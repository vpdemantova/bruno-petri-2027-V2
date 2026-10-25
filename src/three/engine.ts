/* ════════════════════════════════════════════════════════════════════
   O MOTOR — um renderizador só para o site inteiro.

   Ideia central: cada obra que aparece na página (o herói, os cartões da
   grade, o carrossel, o visualizador) é um <canvas> 2D comum, dentro do
   HTML, com cantos redondos, bordas, ícones por cima e animações do
   próprio CSS. Um único WebGPURenderer (WebGL2 se o navegador não tiver
   WebGPU, ou com ?webgl) desenha cada "vista" num canto do canvas dele,
   que fica fora da tela, e copia o resultado para o canvas da vista
   (drawImage). Vantagens: um contexto de GPU só (o navegador limita a
   ~16), shaders compilados uma vez, e a vista parada (cartão da grade)
   é desenhada UMA vez e fica lá, sem custo nenhum por quadro.

   · Vista "live": redesenha todo quadro enquanto está visível (herói,
     visualizador, cartão com o mouse em cima).
   · Vista "still": desenha quando muda (tamanho, material, giro).
   · Voo (flight): quando uma página sai e outra entra com a mesma obra
     (mesma flightKey), a obra voa do lugar antigo para o novo, num
     canvas por cima de tudo, com a câmera e o enquadramento animados.

   A luz principal acompanha a câmera (como num estúdio): toda vista sai
   bem iluminada, com a sombra própria dentro das molduras.
════════════════════════════════════════════════════════════════════ */
import {
  WebGPURenderer, Scene, PerspectiveCamera, DirectionalLight, PMREMGenerator, NeutralToneMapping,
  PCFShadowMap, Vector3, Object3D, HemisphereLight, Quaternion, Mesh, BoxGeometry, PlaneGeometry, MeshBasicNodeMaterial, BackSide,
} from "three/webgpu";
import { vec3, mix, positionWorld, smoothstep } from "three/tsl";
import type { MaterialChoice, Work } from "../data/works";
import { makePiece, TEXTURE_EVENT } from "./piece";
import { lampPower } from "./materials";
import { build } from "./sculptures";

/* ── o estúdio que os materiais refletem: sala escura, três softboxes e o
   chão claro. É o que dá o brilho em faixa aos metais, à laca e ao vidro. ── */
function studio(): Scene {
  const s = new Scene();
  const room = new MeshBasicNodeMaterial({ side: BackSide });
  // parede escura em cima, chão mais claro embaixo (como um ciclorama)
  room.colorNode = mix(vec3(0.62, 0.61, 0.6), vec3(0.09, 0.09, 0.1), smoothstep(-4, 1.5, positionWorld.y));
  s.add(new Mesh(new BoxGeometry(14, 10, 14), room));
  const panel = (w: number, h: number, x: number, y: number, z: number, k: number, tint = [1, 1, 1]) => {
    const m = new MeshBasicNodeMaterial();
    m.colorNode = vec3(tint[0] * k, tint[1] * k, tint[2] * k);
    const p = new Mesh(new PlaneGeometry(w, h), m);
    p.position.set(x, y, z);
    p.lookAt(0, 0, 0);
    s.add(p);
  };
  panel(7, 3, -1, 4.8, 1.5, 7);        // softbox de cima
  panel(2.2, 6, -6.6, 0.8, 2.5, 5);    // faixa à esquerda
  panel(1.6, 6, 6.6, 0.6, -1.5, 3.2, [0.92, 0.96, 1.05]); // recorte à direita, um pouco frio
  panel(5, 2.2, 1.5, 0.4, 6.6, 1.6);   // rebatedor da frente
  return s;
}

/* ── mola criticamente amortecida (fórmula fechada: estável com qualquer dt) ── */
export class Spring {
  x: number; v = 0; to: number;
  constructor(x: number, public w = 7) { this.x = x; this.to = x; }
  step(dt: number) {
    const y = this.x - this.to, e = Math.exp(-this.w * dt);
    const c = this.v + this.w * y;
    this.x = this.to + (y + c * dt) * e;
    this.v = (this.v - this.w * c * dt) * e;
  }
  snap(x: number) { this.x = this.to = x; this.v = 0; }
  get moving() { return Math.abs(this.x - this.to) > 1e-4 || Math.abs(this.v) > 1e-4; }
}

export interface Angle { theta: number; phi: number; zoom?: number; fov?: number; ox?: number; oy?: number }

/** os seis ângulos do "Explore every angle" (o 1º é o da obra, se ela tiver) */
export function presetsFor(w: Work): Angle[] {
  const own = w.kind.type === "sculpture" ? build(w.kind.gen).views?.[0] : undefined;
  const base: Angle = own ?? { theta: 0.3, phi: 1.4 };
  if (w.kind.type !== "sculpture") {
    return [
      { theta: 0, phi: Math.PI / 2 },
      { theta: 0.55, phi: 1.3, zoom: 2.6, fov: 24, ox: -0.2 },
      { theta: 0.7, phi: 1.35 },
      { theta: -0.75, phi: 1.5, zoom: 1.6 },
      { theta: 0.1, phi: 0.95, zoom: 1.3 },
      { theta: -0.25, phi: 1.85, zoom: 1.4 },
    ];
  }
  return [
    base,
    { theta: 0.42, phi: 1.3, zoom: 2.7, fov: 22 },
    { theta: 0.78, phi: 1.1 },
    { theta: Math.PI / 2, phi: 1.52 },
    { theta: 0.25, phi: 0.32 },
    { theta: -0.65, phi: 2.0, zoom: 1.12 },
  ];
}

/* ── a câmera de uma vista ── */
export class Rig {
  theta = new Spring(0.3, 5); phi = new Spring(1.4, 5); zoom = new Spring(1, 6); fov = new Spring(26, 6);
  ox = new Spring(0, 6); oy = new Spring(0, 6);
  tiltX = new Spring(0, 4); tiltY = new Spring(0, 4);
  spin = 0; // rad/s quando parada
  drag = false; vel = 0; velPhi = 0; idle = 0;
  springs() { return [this.theta, this.phi, this.zoom, this.fov, this.ox, this.oy, this.tiltX, this.tiltY]; }
  set(a: Angle, snap = false) {
    const pairs: [Spring, number][] = [[this.theta, a.theta], [this.phi, a.phi], [this.zoom, a.zoom ?? 1], [this.fov, a.fov ?? 26], [this.ox, a.ox ?? 0], [this.oy, a.oy ?? 0]];
    for (const [s, v] of pairs) {
      if (snap) s.snap(v);
      else s.to = v;
    }
    // não dar a volta longa: aproxima o alvo do theta atual
    if (!snap) {
      const d = this.theta.to - this.theta.x;
      this.theta.to -= Math.round(d / (Math.PI * 2)) * Math.PI * 2;
    }
  }
  copyFrom(o: Rig) {
    this.springs().forEach((s, i) => { const t = o.springs()[i]; s.x = t.x; s.v = t.v; });
  }
  update(dt: number) {
    this.idle += dt;
    if (!this.drag) {
      if (Math.abs(this.vel) > 1e-4 || Math.abs(this.velPhi) > 1e-4) {
        // inércia do arrasto
        this.theta.x += this.vel * dt; this.theta.to = this.theta.x;
        this.phi.x = Math.min(2.9, Math.max(0.15, this.phi.x + this.velPhi * dt)); this.phi.to = this.phi.x;
        const k = Math.exp(-dt * 3.2);
        this.vel *= k; this.velPhi *= k;
      } else if (this.spin && this.idle > 1.2) {
        this.theta.to += this.spin * dt;
      }
    }
    for (const s of this.springs()) s.step(dt);
  }
  get moving() { return this.drag || this.springs().some((s) => s.moving) || !!this.spin; }
  apply(cam: PerspectiveCamera, w: number, h: number) {
    const aspect = w / h;
    cam.fov = this.fov.x;
    cam.aspect = aspect;
    const a = (cam.fov * Math.PI) / 360, b = Math.atan(Math.tan(a) * aspect);
    const dist = 1.04 / Math.sin(Math.min(a, b)) / Math.max(0.2, this.zoom.x);
    const th = this.theta.x + this.tiltX.x, ph = Math.min(3.0, Math.max(0.1, this.phi.x + this.tiltY.x));
    cam.position.set(Math.sin(ph) * Math.sin(th), Math.cos(ph), Math.sin(ph) * Math.cos(th)).multiplyScalar(dist);
    cam.up.set(0, 1, 0);
    cam.lookAt(0, 0, 0);
    cam.near = Math.max(0.01, dist - 2.5);
    cam.far = dist + 3;
    cam.setViewOffset(w, h, -this.ox.x * w * 0.5, this.oy.x * h * 0.5, w, h);
    cam.updateProjectionMatrix();
  }
}

/* ── a vista ── */
export interface SlotConfig {
  work: Work;
  material?: MaterialChoice;
  /** ângulo e enquadramento; zoom > 1 aproxima; ox/oy deslocam (−1…1, meia largura) */
  angle?: Angle;
  mode?: "live" | "still";
  spin?: number;
  interactive?: boolean | "x";
  tilt?: boolean;
  /** chaves do voo entre páginas, em ordem de preferência */
  flightKey?: string | string[];
  /** qualidade: o teto do devicePixelRatio para esta vista */
  dpr?: number;
  /** luz da luminária: 0 apagada, 1 acesa */
  lamp?: number;
}

const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export class Slot {
  ctx: CanvasRenderingContext2D;
  rig = new Rig();
  piece: Object3D | null = null;
  pieceKey = "";
  dirty = true;
  visible = false;
  hidden = false;
  ready = false;
  w = 0; h = 0;
  cfg: SlotConfig;
  onReady?: () => void;
  private io: IntersectionObserver;
  private ro: ResizeObserver;
  private off: (() => void)[] = [];
  constructor(public el: HTMLCanvasElement, cfg: SlotConfig) {
    this.ctx = el.getContext("2d", { alpha: true })!;
    this.cfg = cfg;
    this.rig.set(cfg.angle ?? presetsFor(cfg.work)[0], true);
    this.io = new IntersectionObserver((es) => { for (const e of es) { this.visible = e.isIntersecting; if (this.visible) this.dirty = true; } }, { rootMargin: "120px" });
    this.io.observe(el);
    this.ro = new ResizeObserver(() => { this.dirty = true; });
    this.ro.observe(el);
    if (cfg.interactive) this.bindPointer();
    this.update(cfg);
  }
  update(cfg: SlotConfig) {
    const prev = this.cfg;
    this.cfg = cfg;
    const key = `${cfg.work.slug}|${cfg.material ? `${cfg.material.family}.${cfg.material.variant}.${cfg.material.finish ?? ""}` : ""}`;
    if (key !== this.pieceKey) {
      this.pieceKey = key;
      this.piece = makePiece(cfg.work, cfg.material);
      this.ready = false;
      engine.prepare(this);
    }
    if (prev.work.slug !== cfg.work.slug && !cfg.angle) this.rig.set(presetsFor(cfg.work)[0]);
    if (cfg.angle && JSON.stringify(cfg.angle) !== JSON.stringify(prev.angle)) this.rig.set(cfg.angle);
    this.rig.spin = reduced() ? 0 : cfg.spin ?? 0;
    this.dirty = true;
  }
  get live() { return this.cfg.mode === "live" || this.rig.moving; }
  private bindPointer() {
    const el = this.el;
    let lx = 0, ly = 0, lt = 0, id = -1;
    const onlyX = this.cfg.interactive === "x";
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      id = e.pointerId; el.setPointerCapture(id);
      lx = e.clientX; ly = e.clientY; lt = performance.now();
      this.rig.drag = true; this.rig.vel = this.rig.velPhi = 0; this.rig.idle = 0;
      el.classList.add("is-drag");
    };
    const move = (e: PointerEvent) => {
      if (!this.rig.drag || e.pointerId !== id) return;
      const now = performance.now(), dt = Math.max(1, now - lt) / 1000;
      const dx = (e.clientX - lx) / Math.max(200, el.clientWidth), dy = (e.clientY - ly) / Math.max(200, el.clientHeight);
      lx = e.clientX; ly = e.clientY; lt = now;
      const r = this.rig;
      r.theta.x -= dx * 3.4; r.theta.to = r.theta.x;
      if (!onlyX) { r.phi.x = Math.min(2.9, Math.max(0.15, r.phi.x - dy * 2.6)); r.phi.to = r.phi.x; }
      r.vel = (-dx * 3.4) / dt * 0.6; r.velPhi = onlyX ? 0 : (-dy * 2.6) / dt * 0.6;
      this.dirty = true;
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      this.rig.drag = false; this.rig.idle = 0;
      if (performance.now() - lt > 80) this.rig.vel = this.rig.velPhi = 0;
      el.classList.remove("is-drag");
    };
    const wheel = (e: WheelEvent) => {
      if (onlyX) return;
      e.preventDefault();
      const z = this.rig.zoom;
      z.to = Math.min(4, Math.max(0.6, z.to * Math.exp(-e.deltaY * 0.0015)));
      this.rig.idle = 0;
    };
    const dbl = () => this.rig.set(this.cfg.angle ?? presetsFor(this.cfg.work)[0]);
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("dblclick", dbl);
    this.off.push(() => {
      el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel); el.removeEventListener("dblclick", dbl);
    });
  }
  dispose() {
    this.io.disconnect(); this.ro.disconnect();
    this.off.forEach((f) => f());
  }
}

/* ── voo entre páginas ── */
const keysOf = (s: Slot) => (s.cfg.flightKey ? ([] as string[]).concat(s.cfg.flightKey) : []);
interface Flight { slot: Slot; from: DOMRect; t: number; dur: number }

class Engine {
  renderer!: WebGPURenderer;
  backend: "webgpu" | "webgl" | "none" = "none";
  scene = new Scene();
  camera = new PerspectiveCamera(26, 1, 0.1, 50);
  key = new DirectionalLight(0xffffff, 1.75);
  fill = new DirectionalLight(0xdfe6ff, 0.4);
  /** cena só para compilar shaders (as mesmas luzes), sem atrapalhar o quadro */
  private prep = new Scene();
  slots = new Set<Slot>();
  flights: Flight[] = [];
  ready: Promise<void>;
  isReady = false;
  dprScale = 1;
  private W = 0; H = 0;
  private overlay?: HTMLCanvasElement;
  private octx?: CanvasRenderingContext2D;
  private last = 0;
  private slowFrames = 0;
  private fastFrames = 0;
  private resolveReady!: () => void;
  private failed = false;
  private gone = new Map<string, { rect: DOMRect; rig: Rig; at: number }>();

  constructor() {
    this.ready = new Promise((r) => (this.resolveReady = r));
  }

  async init() {
    if (this.isReady || this.renderer) return this.ready;
    const forceWebGL = /[?&]webgl\b/.test(location.search) || !("gpu" in navigator);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 8;
      const r = new WebGPURenderer({ canvas, antialias: true, alpha: true, forceWebGL });
      await r.init();
      this.renderer = r;
      this.backend = (r.backend as unknown as { isWebGPUBackend?: boolean }).isWebGPUBackend ? "webgpu" : "webgl";
    } catch (e) {
      console.warn("3D indisponível:", e);
      this.failed = true;
      document.documentElement.classList.add("no-3d");
      this.resolveReady();
      return;
    }
    const r = this.renderer;
    r.setPixelRatio(1);
    r.toneMapping = NeutralToneMapping;
    r.toneMappingExposure = 1.0;
    r.setClearColor(0x000000, 0);
    r.shadowMap.enabled = true;
    r.shadowMap.type = PCFShadowMap;
    this.resize(Math.min(2048, Math.ceil(innerWidth * Math.min(2, devicePixelRatio))), Math.min(2048, Math.ceil(innerHeight * Math.min(2, devicePixelRatio))));

    const pm = new PMREMGenerator(r);
    this.scene.environment = pm.fromScene(studio(), 0.035).texture;
    this.scene.environmentIntensity = 0.55;
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(2048, 2048);
    const sc = this.key.shadow.camera;
    sc.left = sc.bottom = -1.15; sc.right = sc.top = 1.15; sc.near = 0.5; sc.far = 9;
    this.key.shadow.bias = -0.0004;
    this.key.shadow.normalBias = 0.012;
    this.key.shadow.radius = 3;
    this.scene.add(this.key, this.key.target, this.fill, new HemisphereLight(0xffffff, 0x8a8f99, 0.25));
    this.prep.environment = this.scene.environment;
    this.prep.environmentIntensity = this.scene.environmentIntensity;
    const k2 = this.key.clone();
    k2.castShadow = true;
    this.prep.add(k2, k2.target, this.fill.clone(), new HemisphereLight(0xffffff, 0x8a8f99, 0.25));

    this.overlay = document.createElement("canvas");
    this.overlay.className = "flight-layer";
    this.overlay.setAttribute("aria-hidden", "true");
    document.body.appendChild(this.overlay);
    this.octx = this.overlay.getContext("2d")!;

    // a foto de uma obra chega depois do primeiro quadro (BP-02): as vistas paradas se redesenham
    addEventListener(TEXTURE_EVENT, () => this.slots.forEach((s) => (s.dirty = true)));
    document.documentElement.dataset.gpu = this.backend;
    this.isReady = true;
    this.resolveReady();
    for (const s of this.slots) this.prepare(s);
    requestAnimationFrame(this.loop);
  }

  private resize(w: number, h: number) {
    if (w <= this.W && h <= this.H) return;
    this.W = Math.max(this.W, w); this.H = Math.max(this.H, h);
    this.renderer.setSize(this.W, this.H, false);
  }

  /**
   * Compila de uma vez os shaders de todos os materiais (cada família e
   * variação que muda o programa), durante a abertura. Importante: o three
   * não desenha nada enquanto um compileAsync está em curso (os objetos vão
   * para a fila de compilação e o quadro sai vazio); por isso a compilação
   * acontece uma vez só, antes de qualquer vista existir.
   */
  warm?: Promise<void>;
  warmup(pieces: Object3D[]) {
    if (this.warm) return this.warm;
    this.warm = (async () => {
      await this.ready;
      if (this.failed) return;
      const g = new Object3D();
      pieces.forEach((p, i) => { p.position.set((i % 8) * 0.01, 0, 0); g.add(p); });
      this.prep.add(g);
      this.camera.position.set(0, 0, 6); this.camera.lookAt(0, 0, 0); this.camera.updateMatrixWorld();
      try { await this.renderer.compileAsync(this.prep, this.camera); } catch (err) { console.warn("compilação antecipada:", err); }
      this.prep.remove(g);
      this.warmed = true;
      for (const s of this.slots) this.prepare(s);
    })();
    return this.warm;
  }
  warmed = false;

  /** a vista pode desenhar quando o motor está pronto e os shaders compilados */
  prepare(s: Slot) {
    if (!this.warmed || this.failed || !s.piece) return;
    if (!s.ready) { s.ready = true; s.dirty = true; s.onReady?.(); }
  }

  register(s: Slot) {
    this.slots.add(s);
    if (this.isReady) this.prepare(s);
    // voo: outra vista com a mesma chave ainda na tela (a página que sai) ou que acabou de sair
    const keys = keysOf(s);
    if (!keys.length || reduced()) return;
    let from: DOMRect | null = null;
    for (const k of keys) {
      for (const o of this.slots) {
        if (o === s || !o.el.isConnected || o.hidden || !keysOf(o).includes(k)) continue;
        const r = o.el.getBoundingClientRect();
        if (r.width < 4) continue;
        from = r;
        s.rig.copyFrom(o.rig);
        o.hidden = true;
        o.el.style.visibility = "hidden";
        break;
      }
      if (from) break;
      const g = this.gone.get(k);
      if (g && performance.now() - g.at < 700) { from = g.rect; s.rig.copyFrom(g.rig); this.gone.delete(k); break; }
    }
    if (from) {
      s.hidden = true;
      s.el.style.visibility = "hidden";
      this.flights.push({ slot: s, from, t: 0, dur: 1.15 });
    }
  }

  unregister(s: Slot) {
    if (s.el.isConnected && !s.hidden) for (const k of keysOf(s)) this.gone.set(k, { rect: s.el.getBoundingClientRect(), rig: s.rig, at: performance.now() });
    this.slots.delete(s);
    this.flights = this.flights.filter((f) => f.slot !== s);
    s.dispose();
  }

  private loop = (now: number) => {
    requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, this.last ? (now - this.last) / 1000 : 0.016);
    this.last = now;
    if (document.hidden) return;
    const t0 = performance.now();
    let budget = 3; // vistas "still" por quadro: espalha o custo da grade
    for (const s of this.slots) {
      s.rig.update(dt);
      if (s.hidden || !s.visible || !s.ready) continue;
      if (s.live || s.dirty) {
        if (!s.live && budget-- <= 0) continue;
        this.draw(s, s.ctx, null);
        s.dirty = false;
      }
    }
    this.flyAll(dt);
    // qualidade adaptativa: se o quadro passa de ~24 ms várias vezes, baixa a resolução
    const cost = performance.now() - t0;
    if (cost > 24) { this.slowFrames++; this.fastFrames = 0; } else if (cost < 9) { this.fastFrames++; this.slowFrames = 0; }
    if (this.slowFrames > 20 && this.dprScale > 0.55) { this.dprScale -= 0.15; this.slowFrames = 0; this.slots.forEach((s) => (s.dirty = true)); }
    if (this.fastFrames > 240 && this.dprScale < 1) { this.dprScale = Math.min(1, this.dprScale + 0.1); this.fastFrames = 0; }
  };

  private flyAll(dt: number) {
    const o = this.overlay!, c = this.octx!;
    if (!this.flights.length) {
      if (o.width) { o.width = 0; o.height = 0; }
      return;
    }
    const dpr = Math.min(2, devicePixelRatio) * this.dprScale;
    const W = Math.round(innerWidth * dpr), H = Math.round(innerHeight * dpr);
    if (o.width !== W || o.height !== H) { o.width = W; o.height = H; } else c.clearRect(0, 0, W, H);
    for (const f of [...this.flights]) {
      f.t += dt / f.dur;
      const to = f.slot.el.getBoundingClientRect();
      const e = f.t >= 1 ? 1 : 1 - Math.pow(1 - f.t, 3.2) * (1 - f.t * 0.15);
      const lerp = (a: number, b: number) => a + (b - a) * e;
      const x = lerp(f.from.left, to.left), y = lerp(f.from.top, to.top);
      const w = Math.max(8, lerp(f.from.width, to.width)), h = Math.max(8, lerp(f.from.height, to.height));
      if (f.slot.ready) this.draw(f.slot, c, { x: x * dpr, y: y * dpr, w: w * dpr, h: h * dpr });
      if (f.t >= 1) {
        f.slot.hidden = false;
        f.slot.el.style.visibility = "";
        f.slot.dirty = true;
        this.flights.splice(this.flights.indexOf(f), 1);
      }
    }
  }

  private q = new Quaternion();
  private v = new Vector3();
  /** desenha a vista no canvas dela, ou num retângulo do canvas do voo */
  draw(s: Slot, ctx: CanvasRenderingContext2D, rect: { x: number; y: number; w: number; h: number } | null) {
    const el = s.el;
    let w: number, h: number;
    if (rect) { w = Math.round(rect.w); h = Math.round(rect.h); } else {
      const dpr = Math.min(s.cfg.dpr ?? 2, devicePixelRatio) * this.dprScale;
      w = Math.max(2, Math.round(el.clientWidth * dpr)); h = Math.max(2, Math.round(el.clientHeight * dpr));
      if (el.width !== w || el.height !== h) { el.width = w; el.height = h; }
    }
    if (w < 4 || h < 4) return;
    const scale = Math.min(1, 2048 / Math.max(w, h));
    const rw = Math.round(w * scale), rh = Math.round(h * scale);
    this.resize(rw, rh);
    const r = this.renderer, cam = this.camera;
    s.rig.apply(cam, rw, rh);
    // luz de estúdio presa à câmera: de cima, à esquerda, um pouco à frente
    this.q.copy(cam.quaternion);
    this.key.position.copy(this.v.set(-1.6, 2.4, 2.2).applyQuaternion(this.q));
    this.fill.position.copy(this.v.set(2.2, -0.6, 1.4).applyQuaternion(this.q));
    lampPower.value = s.cfg.lamp ?? 1;
    this.scene.add(s.piece!);
    r.setViewport(0, 0, rw, rh);
    r.setScissor(0, 0, rw, rh);
    r.setScissorTest(true);
    r.render(this.scene, cam);
    this.scene.remove(s.piece!);
    const src = r.domElement;
    if (rect) ctx.drawImage(src, 0, 0, rw, rh, rect.x, rect.y, rect.w, rect.h);
    else {
      ctx.globalCompositeOperation = "copy";
      ctx.drawImage(src, 0, 0, rw, rh, 0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
    }
  }
}

export const engine = new Engine();
if (import.meta.env.DEV) (window as unknown as { __engine: Engine }).__engine = engine;
