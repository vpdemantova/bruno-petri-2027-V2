/* ════════════════════════════════════════════════════════════════════
   AS ESCULTURAS — um gerador por forma.

   Cada gerador devolve a geometria principal (uma só, para o material
   atravessar tudo) e, nas luminárias, a geometria do núcleo aceso.
   Depois, `build()` centraliza e põe tudo no mesmo tamanho (raio 1).

   As duas formas das telas foram medidas:
   · Cruz Fractal — vigas de seção quadrada w, de 6,7w; quatro losangos
     (quadrados a 45°) com centro em (±1,33w, ±1,33w), meia-diagonal
     externa 1,76w e interna 0,76w (barra de 0,71w); o canto de dentro do
     losango encosta na face de trás da viga. Um quadrante, espelhado.
   · Molécula — a Cruz Fractal nos três planos (XY, YZ, XZ).
   As outras saem da geometria e da proporção (φ, √2, ângulo áureo,
   sólidos de Platão), como pede a série de estudos.
════════════════════════════════════════════════════════════════════ */
import { BufferGeometry, IcosahedronGeometry, Matrix4, Quaternion, SphereGeometry, Vector3 } from "three/webgpu";
import type { GenId } from "../data/works";
import { M, V, bar, box, frame, merge, mirrorXY, octahedron, part, polyhedron, ring, slab, xf, type Part } from "./geometry";

export interface Built {
  main: BufferGeometry;
  glow?: BufferGeometry;
  /** onde o halo da luminária fica (no espaço já normalizado) */
  glowAt?: Vector3;
  /** os ângulos especiais da obra (ex.: o da ilusão da Tríade) */
  views?: { theta: number; phi: number; zoom?: number; fov?: number }[];
}

const PHI = (1 + Math.sqrt(5)) / 2;
const R2 = Math.SQRT2;
const TAU = Math.PI * 2;

/* ── a família cúbica ── */
function diamondsXY(w: number, depth = 0.94): Part[] {
  const c = 1.33 * w, outer = 1.76 * w, inner = 0.76 * w;
  const L = outer * R2, b = (outer - inner) / R2;
  const q = frame(L, b, depth * w, M.c(M.t(c, c, 0), M.rz(Math.PI / 4)));
  return mirrorXY(q);
}

function cruzFractal(): Built {
  const w = 0.3, L = 6.7 * w;
  const parts: Part[] = [
    part(box(w, L, w)),
    part(box(L, w, 0.985 * w)),
    ...diamondsXY(w),
  ];
  return { main: merge(parts) };
}

function molecula(): Built {
  const w = 0.3, L = 6.7 * w;
  const d = diamondsXY(w);
  const parts: Part[] = [
    part(box(w, L, w)),
    part(box(L, 0.99 * w, 0.985 * w)),
    part(box(0.98 * w, 0.98 * w, L)),
    ...d,
    ...xf(d, M.ry(Math.PI / 2)), // plano YZ
    ...xf(d, M.c(M.rx(Math.PI / 2), M.s(1, 1, 0.995))), // plano XZ
  ];
  return { main: merge(parts) };
}

/* ── Tríade: as três barras ao longo de x, y e z; vistas pela diagonal
   (1,1,1), a ponta da última cai sobre o começo da primeira: o triângulo
   impossível. A peça é girada para essa diagonal apontar para a frente. */
function triade(): Built {
  const L = 2.2, s = 0.42;
  const parts: Part[] = [
    bar(V(-s / 2, 0, 0), V(L + s / 2, 0, 0), s),
    bar(V(L, -s / 2, 0), V(L, L + s / 2, 0), s),
    bar(V(L, L, -s / 2), V(L, L, L), s),
  ];
  // centro da projeção e giro: (1,1,1) → +Z
  const q = new Quaternion().setFromUnitVectors(new Vector3(1, 1, 1).normalize(), new Vector3(0, 0, 1));
  const g = merge(xf(parts, new Matrix4().makeRotationFromQuaternion(q)));
  // gira em volta de Z para o triângulo ficar de pé (a barra x embaixo)
  g.applyMatrix4(M.rz(Math.PI / 6 + Math.PI));
  return { main: g, views: [{ theta: 0, phi: Math.PI / 2, fov: 9 }] };
}

/* ── Coroa: arquibancada redonda e 24 aletas em onda de 3 cristas ── */
function coroa(): Built {
  const parts: Part[] = [];
  const flat = M.rx(-Math.PI / 2);
  parts.push(part(ring(0.3, 0.6, 0.05, 64), M.c(M.t(0, 0.025, 0), flat)));
  for (let i = 0; i < 5; i++) {
    const r0 = 0.6 + i * 0.09, h = 0.05 + (i + 1) * 0.035;
    parts.push(part(ring(r0 + 0.045, 0.09, h, 128), M.c(M.t(0, h / 2, 0), flat)));
  }
  const n = 24, R = 1.12;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const H = 0.42 + 0.34 * (0.5 + 0.5 * Math.cos(3 * a));
    const wv = 0.17;
    const shape: [number, number][] = [
      [-wv / 2, 0], [wv / 2, 0], [wv * 0.42, H * 0.55], [wv * 0.2, H * 0.86], [-wv * 0.05, H],
      [-wv * 0.22, H * 0.9], [-wv * 0.36, H * 0.62], [-wv * 0.5, H * 0.3],
    ];
    const fin = slab(shape, 0.026);
    parts.push(part(fin, M.c(M.ry(-a), M.t(R, 0, 0), M.ry(Math.PI / 2 + 0.22))));
  }
  return { main: merge(parts), views: [{ theta: 0.5, phi: 1.05 }] };
}

/* ── Espiral Áurea: cada moldura inscrita na anterior, os cantos dividindo
   os lados na razão áurea; giram atan(1/φ) e diminuem 0,7265 por passo ── */
function espiralAurea(): Built {
  const parts: Part[] = [];
  const ang = Math.atan(1 / PHI), k = Math.sqrt(1 / PHI ** 4 + 1 / PHI ** 2);
  let L = 2.2, rot = 0;
  for (let i = 0; i < 9; i++) {
    const b = Math.max(0.035, L * 0.075);
    parts.push(...frame(L, b, 0.16 + i * 0.012, M.c(M.t(0, 0, -i * 0.05), M.rz(rot))));
    L *= k; rot += ang;
  }
  return { main: merge(parts) };
}

/* ── Coluna Áurea: 21 lâminas, cada uma 137,5° em relação à de baixo ── */
function colunaAurea(): Built {
  const parts: Part[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  const n = 21, h = 0.075, gap = 0.016;
  parts.push(part(box(0.95, 0.08, 0.95), M.t(0, -0.04, 0)));
  for (let i = 0; i < n; i++) {
    const s = 0.62 * (1 + 0.22 * Math.sin((i / (n - 1)) * Math.PI * 1.5 + 0.4));
    parts.push(part(box(s, h, s), M.c(M.t(0, gap + i * (h + gap) + h / 2, 0), M.ry(i * golden))));
  }
  parts.push(part(box(0.06, n * (h + gap), 0.06), M.t(0, (n * (h + gap)) / 2, 0)));
  return { main: merge(parts), views: [{ theta: 0.6, phi: 1.2 }] };
}

/* ── sólidos ── */
function nodes(points: Vector3[], r: number): Part[] {
  const g = new IcosahedronGeometry(r, 0);
  return points.map((p) => part(g, M.t(p.x, p.y, p.z)));
}
const upFrom = (v: Vector3) => new Matrix4().makeRotationFromQuaternion(new Quaternion().setFromUnitVectors(v.clone().normalize(), new Vector3(0, 1, 0)));

function estrelaTetraedrica(): Built {
  const a = 1;
  const t1 = [V(a, a, a), V(a, -a, -a), V(-a, a, -a), V(-a, -a, a)];
  const t2 = t1.map((p) => p.clone().negate());
  const parts: Part[] = [];
  for (const t of [t1, t2]) for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) parts.push(bar(t[i], t[j], 0.11, 0.11, 0, t[i].clone().add(t[j])));
  parts.push(...nodes([...t1, ...t2], 0.13));
  return { main: merge(xf(parts, upFrom(V(1, 1, 1)))) };
}

function octaedroEstrelado(): Built {
  const a = 0.9;
  const t1 = [[a, a, a], [a, -a, -a], [-a, a, -a], [-a, -a, a]];
  const t2 = t1.map((p) => p.map((x) => -x));
  const f = [[0, 1, 2], [0, 3, 1], [0, 2, 3], [1, 3, 2]];
  const parts: Part[] = [part(polyhedron(t1, f)), part(polyhedron(t2, f))];
  return { main: merge(xf(parts, upFrom(V(1, 1, 1)))), views: [{ theta: 0.4, phi: 1.25 }] };
}

function dodecaedro(): Built {
  const p = 1 / PHI;
  const vs: Vector3[] = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) vs.push(V(x, y, z));
  for (const a of [-1, 1]) for (const b of [-1, 1]) {
    vs.push(V(0, a * p, b * PHI), V(a * p, b * PHI, 0), V(a * PHI, 0, b * p));
  }
  const edge = 2 / PHI;
  const parts: Part[] = [];
  for (let i = 0; i < vs.length; i++) for (let j = i + 1; j < vs.length; j++) {
    if (Math.abs(vs[i].distanceTo(vs[j]) - edge) < 1e-3) parts.push(bar(vs[i], vs[j], 0.085, 0.04, 0, vs[i].clone().add(vs[j])));
  }
  parts.push(...nodes(vs, 0.1));
  return { main: merge(parts) };
}

function esferaArmilar(): Built {
  const parts: Part[] = [];
  const rg = ring(1, 0.075, 0.075, 160);
  for (let i = 0; i < 3; i++) parts.push(part(rg, M.ry((i / 3) * Math.PI)));
  parts.push(part(ring(1.001, 0.075, 0.074, 160), M.rx(Math.PI / 2)));
  const tilt = (23.44 * Math.PI) / 180;
  parts.push(part(ring(1.002, 0.075, 0.073, 160), M.c(M.rz(tilt), M.rx(Math.PI / 2))));
  parts.push(part(ring(1.003, 0.06, 0.06, 160), M.c(M.rz(-tilt * 2), M.rx(Math.PI / 2))));
  parts.push(part(box(0.05, 2.5, 0.05)));
  parts.push(part(new SphereGeometry(0.17, 48, 24)));
  return { main: merge(parts), views: [{ theta: 0.5, phi: 1.2 }] };
}

function florDaVida(): Built {
  const parts: Part[] = [];
  const R = 0.5;
  parts.push(part(ring(R, 0.06, 0.12, 128)));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    parts.push(part(ring(R, 0.06, 0.12 * (1 + 0.03 * (i + 1)), 128), M.t(Math.cos(a) * R, Math.sin(a) * R, 0)));
  }
  parts.push(part(ring(2 * R + 0.06, 0.08, 0.15, 192)));
  return { main: merge(parts) };
}

function mandalaCubica(): Built {
  const parts: Part[] = [part(box(0.42, 0.42, 0.42), M.rz(Math.PI / 4))];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    parts.push(part(box(0.26, 0.26, 0.26), M.c(M.rz(a), M.t(0.66, 0, 0))));
    const b = a + Math.PI / 8;
    parts.push(part(box(0.2, 0.2, 0.2), M.c(M.rz(b), M.t(1.02, 0, 0), M.rz(Math.PI / 4))));
  }
  for (let i = 0; i < 16; i++) {
    parts.push(part(box(0.11, 0.11, 0.11), M.c(M.rz((i / 16) * TAU), M.t(1.32, 0, 0))));
  }
  return { main: merge(parts) };
}

function cubeEdges(s: number, t: number): Part[] {
  const h = s / 2, out: Part[] = [];
  for (const a of [-h, h]) for (const b of [-h, h]) {
    out.push(part(box(s + t, t, t), M.t(0, a, b)));
    out.push(part(box(t * 0.995, s + t, t * 0.995), M.t(a, 0, b)));
    out.push(part(box(t * 0.99, t * 0.99, s + t), M.t(a, b, 0)));
  }
  return out;
}

function hipercubo(): Built {
  const S = 2, s = 0.9, t = 0.11;
  const parts: Part[] = [...cubeEdges(S, t), ...cubeEdges(s, t * 0.8)];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
    parts.push(bar(V(x, y, z).multiplyScalar(s / 2), V(x, y, z).multiplyScalar(S / 2), t * 0.75, 0, 0, V(0, y, 0)));
  }
  return { main: merge(parts), views: [{ theta: 0.62, phi: 1.12 }] };
}

function portal(): Built {
  const L = 2.2, b = 0.22, open = L - 2 * b;
  const parts: Part[] = [...frame(L, b, 0.22)];
  const dl = open / R2;
  parts.push(...frame(dl, 0.15, 0.3, M.rz(Math.PI / 4)));
  parts.push(part(box(0.11, open, 0.17)), part(box(open, 0.11, 0.165)));
  parts.push(part(box(1.1, 0.12, 0.62), M.t(0, -L / 2 - 0.06, 0)));
  return { main: merge(parts) };
}

function ninho(): Built {
  const a = 0.7, len = 2;
  const parts: Part[] = [];
  for (const p of [-a, 0, a]) for (const q of [-a, 0, a]) {
    parts.push(part(box(len, 0.11, 0.11), M.t(0, p, q)));
    parts.push(part(box(0.108, len, 0.108), M.t(p, 0, q)));
    parts.push(part(box(0.106, 0.106, len), M.t(p, q, 0)));
  }
  return { main: merge(parts), views: [{ theta: 0.55, phi: 1.1 }] };
}

function arcos(): Built {
  const parts: Part[] = [part(box(2.3, 0.1, 2.3), M.t(0, -0.05, 0))];
  for (let i = 0; i < 4; i++) {
    parts.push(part(ring(1 + i * 0.004, 0.1, 0.1, 96, 0, Math.PI), M.ry((i / 4) * Math.PI)));
  }
  return { main: merge(parts), views: [{ theta: 0.4, phi: 1.15 }] };
}

function torreRaiz2(): Built {
  const parts: Part[] = [];
  let L = 2, y = 0;
  const gap = 0.26, th = 0.1;
  for (let i = 0; i < 7; i++) {
    const b = Math.max(0.045, 0.16 * Math.sqrt(L / 2));
    const m = M.c(M.t(0, y, 0), M.ry((i * Math.PI) / 4), M.rx(-Math.PI / 2));
    parts.push(...frame(L, b, th, m));
    if (i < 6) {
      // postes no meio dos lados desta moldura: é onde caem os cantos da próxima
      for (let k = 0; k < 4; k++) {
        const ang = (i * Math.PI) / 4 + (k * Math.PI) / 2;
        const mid = new Vector3(L / 2 - b / 2, 0, 0).applyAxisAngle(new Vector3(0, 1, 0), ang);
        parts.push(part(box(b * 0.7, gap, b * 0.7), M.t(mid.x, y + gap / 2 + th / 2, mid.z)));
      }
    }
    y += gap + th;
    L /= R2;
  }
  return { main: merge(parts), views: [{ theta: 0.3, phi: 1.05 }] };
}

/* ── luminárias ── */
function lanternaCubica(): Built {
  const parts = cubeEdges(1.4, 0.075);
  for (const x of [-1, 1]) for (const z of [-1, 1]) parts.push(part(box(0.1, 0.08, 0.1), M.t(x * 0.7, -0.76, z * 0.7)));
  const core = new Matrix4().makeRotationFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(1, 1, 1).normalize(), new Vector3(0, 1, 0)));
  const glow = box(0.62, 0.62, 0.62).clone().applyMatrix4(core);
  return { main: merge(parts), glow, glowAt: V(0, 0, 0) };
}

function halo(): Built {
  const parts: Part[] = [
    part(ring(0.85, 0.07, 0.07, 160)),
    part(ring(0.851, 0.07, 0.069, 160), M.ry(Math.PI / 2)),
    part(ring(0.2, 0.4, 0.06, 64), M.c(M.t(0, -1.12, 0), M.rx(Math.PI / 2))),
    part(box(0.05, 0.3, 0.05), M.t(0, -0.97, 0)),
  ];
  return { main: merge(parts), glow: new SphereGeometry(0.3, 48, 24), glowAt: V(0, 0, 0) };
}

function prisma(): Built {
  const s = 0.75, h = 1.45, t = 0.07;
  const base = [V(-s, 0, -s), V(s, 0, -s), V(s, 0, s), V(-s, 0, s)];
  const apex = V(0, h, 0);
  const parts: Part[] = [];
  // as faces das barras olham para fora, a partir do centro da pirâmide
  const mid = V(0, h / 4, 0);
  const out = (p: Vector3, q: Vector3) => p.clone().add(q).multiplyScalar(0.5).sub(mid);
  for (let i = 0; i < 4; i++) {
    parts.push(bar(base[i], base[(i + 1) % 4], t, t, 0, out(base[i], base[(i + 1) % 4])));
    parts.push(bar(base[i], apex, t, t * 0.5, 0, out(base[i], apex)));
  }
  parts.push(...nodes([...base, apex], 0.075));
  const glow = octahedron(0.36).clone().applyMatrix4(M.t(0, 0.46, 0));
  return { main: merge(parts), glow, glowAt: V(0, 0.46, 0) };
}

/* ── amostra de material: um cubo em pé num canto, para mostrar três faces ── */
function amostra(): Built {
  const g = merge([part(box(1, 1, 1))]);
  g.applyMatrix4(M.c(M.rx(Math.atan(1 / Math.SQRT2)), M.ry(Math.PI / 4)));
  return { main: g, views: [{ theta: 0, phi: 1.5 }] };
}

const GEN: Record<GenId, () => Built> = {
  "cruz-fractal": cruzFractal, molecula, triade, coroa, "espiral-aurea": espiralAurea, "coluna-aurea": colunaAurea,
  "estrela-tetraedrica": estrelaTetraedrica, "octaedro-estrelado": octaedroEstrelado, dodecaedro, "esfera-armilar": esferaArmilar,
  "flor-da-vida": florDaVida, "mandala-cubica": mandalaCubica, hipercubo, portal, ninho, arcos, "torre-raiz2": torreRaiz2,
  "lanterna-cubica": lanternaCubica, halo, prisma, amostra,
};

const built = new Map<GenId, Built>();
/** gera (uma vez) e normaliza: centro na origem, raio 1 */
export function build(id: GenId): Built {
  const hit = built.get(id);
  if (hit) return hit;
  const b = GEN[id]();
  b.main.computeBoundingBox();
  const bb = b.main.boundingBox!;
  const centre = bb.getCenter(new Vector3());
  b.main.translate(-centre.x, -centre.y, -centre.z);
  b.main.computeBoundingSphere();
  // raio pela caixa (mais estável que a esfera mínima): a obra cabe inteira em qualquer giro
  const size = bb.getSize(new Vector3()).length() / 2;
  const k = 1 / size;
  b.main.scale(k, k, k);
  b.main.computeBoundingBox();
  b.main.computeBoundingSphere();
  if (b.glow) {
    b.glow = b.glow.clone();
    b.glow.translate(-centre.x, -centre.y, -centre.z);
    b.glow.scale(k, k, k);
    b.glowAt = (b.glowAt ?? new Vector3()).clone().sub(centre).multiplyScalar(k);
  }
  built.set(id, b);
  return b;
}

export const GEN_IDS = Object.keys(GEN) as GenId[];
