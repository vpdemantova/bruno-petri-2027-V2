/* ════════════════════════════════════════════════════════════════════
   Ferramentas de geometria das esculturas.

   Toda escultura é uma lista de peças (caixas, anéis, barras entre dois
   pontos, sólidos) com uma matriz cada; no fim, tudo vira UMA geometria
   (merge), com as coordenadas no espaço do objeto. Os materiais são
   texturas sólidas (src/three/materials.ts), calculadas pela posição: os
   veios do mármore e os anéis da madeira atravessam as peças como se a
   obra fosse esculpida de um bloco só.

   A simetria: `mirrorX`, `mirrorY`, `mirrorXY` e `rotations` copiam as
   peças de um quadrante (é "só espelhar", como as obras são simétricas).
   Uma reflexão inverte a ordem dos vértices; `bake` corrige.
════════════════════════════════════════════════════════════════════ */
import { BoxGeometry, BufferAttribute, BufferGeometry, Matrix4, Quaternion, Vector3, Euler } from "three/webgpu";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export interface Part { geo: BufferGeometry; m: Matrix4 }

const tmpV = new Vector3();

/** aplica a matriz e, se ela espelha, desvira os triângulos */
function bake(p: Part): BufferGeometry {
  const g = (p.geo.index ? p.geo.toNonIndexed() : p.geo.clone());
  g.applyMatrix4(p.m);
  if (p.m.determinant() < 0) {
    const pos = g.getAttribute("position") as BufferAttribute;
    const nor = g.getAttribute("normal") as BufferAttribute | undefined;
    for (let i = 0; i < pos.count; i += 3) {
      for (const a of [pos, nor]) {
        if (!a) continue;
        for (let c = 0; c < a.itemSize; c++) {
          const t = a.array[(i + 1) * a.itemSize + c];
          (a.array as Float32Array)[(i + 1) * a.itemSize + c] = a.array[(i + 2) * a.itemSize + c];
          (a.array as Float32Array)[(i + 2) * a.itemSize + c] = t;
        }
      }
    }
  }
  for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal") g.deleteAttribute(k);
  return g;
}

export function merge(parts: Part[]): BufferGeometry {
  const g = mergeGeometries(parts.map(bake), false);
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}

/* ── matrizes ── */
export const M = {
  t: (x = 0, y = 0, z = 0) => new Matrix4().makeTranslation(x, y, z),
  rx: (a: number) => new Matrix4().makeRotationX(a),
  ry: (a: number) => new Matrix4().makeRotationY(a),
  rz: (a: number) => new Matrix4().makeRotationZ(a),
  s: (x: number, y = x, z = x) => new Matrix4().makeScale(x, y, z),
  /** compõe da direita para a esquerda, como na matemática: M.c(a, b) = a·b */
  c: (...ms: Matrix4[]) => ms.reduce((acc, m) => acc.multiply(m), new Matrix4()),
  euler: (x: number, y: number, z: number) => new Matrix4().makeRotationFromEuler(new Euler(x, y, z)),
};

export const part = (geo: BufferGeometry, m: Matrix4 = new Matrix4()): Part => ({ geo, m });
export const xf = (ps: Part[], m: Matrix4): Part[] => ps.map((p) => ({ geo: p.geo, m: m.clone().multiply(p.m) }));

export const mirrorX = (ps: Part[]) => [...ps, ...xf(ps, M.s(-1, 1, 1))];
export const mirrorY = (ps: Part[]) => [...ps, ...xf(ps, M.s(1, -1, 1))];
export const mirrorZ = (ps: Part[]) => [...ps, ...xf(ps, M.s(1, 1, -1))];
export const mirrorXY = (ps: Part[]) => mirrorY(mirrorX(ps));
/** n cópias giradas em volta de um eixo ("y" por padrão) */
export function rotations(ps: Part[], n: number, axis: "x" | "y" | "z" = "y", phase = 0): Part[] {
  const out: Part[] = [];
  for (let i = 0; i < n; i++) out.push(...xf(ps, M[`r${axis}`](phase + (i / n) * Math.PI * 2)));
  return out;
}

/* ── peças ── */
const boxCache = new Map<string, BoxGeometry>();
export function box(w: number, h: number, d: number): BufferGeometry {
  const k = `${w.toFixed(4)}|${h.toFixed(4)}|${d.toFixed(4)}`;
  let g = boxCache.get(k);
  if (!g) { g = new BoxGeometry(w, h, d); boxCache.set(k, g); }
  return g;
}

/**
 * caixa de seção s×s entre dois pontos (uma barra), com sobra nas pontas.
 * `face`: para onde uma das faces olha (ex.: para fora, a partir do centro
 * da forma). Sem ela, o giro da seção em volta da barra sai do
 * setFromUnitVectors e muda de barra para barra, o que quebra a simetria
 * (o teste das formas espelhadas pegou isso no Dodecaedro em 25/out/2026).
 */
export function bar(a: Vector3, b: Vector3, s: number, extend = 0, roll = 0, face?: Vector3): Part {
  const dir = tmpV.copy(b).sub(a);
  const len = dir.length();
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const y = dir.normalize().clone();
  if (face) {
    const z = face.clone().sub(y.clone().multiplyScalar(face.dot(y)));
    if (z.lengthSq() > 1e-10) {
      z.normalize();
      const x = new Vector3().crossVectors(y, z);
      const m = new Matrix4().makeBasis(x, y, z).setPosition(mid).multiply(M.ry(roll));
      return part(box(s, len + extend, s), m);
    }
  }
  const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), y);
  const m = new Matrix4().compose(mid, q, new Vector3(1, 1, 1)).multiply(M.ry(roll));
  return part(box(s, len + extend, s), m);
}

/** moldura quadrada no plano XY: lado externo L, largura da barra b, profundidade d */
export function frame(L: number, b: number, d: number, m: Matrix4 = new Matrix4()): Part[] {
  const h = L / 2 - b / 2;
  return [
    part(box(L, b, d), M.t(0, h, 0)),
    part(box(L, b, d), M.t(0, -h, 0)),
    part(box(b, L - 2 * b, d), M.t(h, 0, 0)),
    part(box(b, L - 2 * b, d), M.t(-h, 0, 0)),
  ].map((p) => ({ geo: p.geo, m: m.clone().multiply(p.m) }));
}

/**
 * Anel de seção retangular (largura radial w, altura h), varrido em volta
 * do eixo Z, do ângulo a0 ao a1. Cantos vivos: cada face tem os próprios
 * vértices; liso ao longo da volta.
 */
export function ring(R: number, w: number, h: number, seg = 96, a0 = 0, a1 = Math.PI * 2): BufferGeometry {
  const ri = R - w / 2, ro = R + w / 2, hz = h / 2;
  const pos: number[] = [], nor: number[] = [], idx: number[] = [];
  const closed = Math.abs(a1 - a0 - Math.PI * 2) < 1e-6;
  // 4 faces: externa, de cima, interna, de baixo
  const faces: [number, number, number, number, number][] = [
    // r0, z0, r1, z1, tipo
    [ro, -hz, ro, hz, 0],
    [ro, hz, ri, hz, 1],
    [ri, hz, ri, -hz, 2],
    [ri, -hz, ro, -hz, 3],
  ];
  for (const [r0, z0, r1, z1, f] of faces) {
    const base = pos.length / 3;
    for (let i = 0; i <= seg; i++) {
      const a = a0 + ((a1 - a0) * i) / seg, c = Math.cos(a), s = Math.sin(a);
      const n = f === 0 ? [c, s, 0] : f === 2 ? [-c, -s, 0] : f === 1 ? [0, 0, 1] : [0, 0, -1];
      pos.push(r0 * c, r0 * s, z0, r1 * c, r1 * s, z1);
      nor.push(...n, ...n);
    }
    for (let i = 0; i < seg; i++) {
      const p = base + i * 2;
      idx.push(p, p + 2, p + 1, p + 1, p + 2, p + 3);
    }
  }
  if (!closed) {
    // tampas nas pontas
    for (const [a, sgn] of [[a0, -1], [a1, 1]] as const) {
      const c = Math.cos(a), s = Math.sin(a);
      const n = [-s * sgn, c * sgn, 0];
      const base = pos.length / 3;
      pos.push(ro * c, ro * s, -hz, ro * c, ro * s, hz, ri * c, ri * s, hz, ri * c, ri * s, -hz);
      nor.push(...n, ...n, ...n, ...n);
      if (sgn > 0) idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
      else idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute("normal", new BufferAttribute(new Float32Array(nor), 3));
  g.setIndex(idx);
  return g;
}

/** sólido convexo a partir de vértices e faces (polígonos), com faces planas */
export function polyhedron(verts: number[][], faces: number[][]): BufferGeometry {
  const pos: number[] = [], nor: number[] = [];
  const v = verts.map((p) => new Vector3(...p));
  const centre = v.reduce((a, b) => a.add(b), new Vector3()).multiplyScalar(1 / v.length);
  for (const f of faces) {
    const a = v[f[0]], b = v[f[1]], c = v[f[2]];
    const n = b.clone().sub(a).cross(c.clone().sub(a)).normalize();
    const fc = f.reduce((acc, i) => acc.add(v[i]), new Vector3()).multiplyScalar(1 / f.length);
    const flip = n.dot(fc.clone().sub(centre)) < 0;
    if (flip) n.negate();
    for (let i = 1; i < f.length - 1; i++) {
      const tri = flip ? [f[0], f[i + 1], f[i]] : [f[0], f[i], f[i + 1]];
      for (const k of tri) { pos.push(v[k].x, v[k].y, v[k].z); nor.push(n.x, n.y, n.z); }
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute("normal", new BufferAttribute(new Float32Array(nor), 3));
  return g;
}

/** pirâmide de base quadrada (lado b, altura h), base em y=0 */
export function pyramid(b: number, h: number): BufferGeometry {
  const s = b / 2;
  return polyhedron(
    [[-s, 0, -s], [s, 0, -s], [s, 0, s], [-s, 0, s], [0, h, 0]],
    [[0, 1, 2, 3], [0, 4, 1], [1, 4, 2], [2, 4, 3], [3, 4, 0]],
  );
}

/** octaedro de "raio" r (vértices nos eixos) */
export function octahedron(r: number): BufferGeometry {
  return polyhedron(
    [[r, 0, 0], [-r, 0, 0], [0, r, 0], [0, -r, 0], [0, 0, r], [0, 0, -r]],
    [[0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4], [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5]],
  );
}

/** placa recortada por uma silhueta 2D (pontos no plano XY), com espessura d em Z */
export function slab(shape: [number, number][], d: number): BufferGeometry {
  const pos: number[] = [], nor: number[] = [];
  // o sentido da silhueta decide para onde as faces apontam: sempre anti-horário
  const area = shape.reduce((a, p, i) => { const q = shape[(i + 1) % shape.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0);
  const outline = area < 0 ? shape.slice().reverse() : shape;
  const n = outline.length, hz = d / 2;
  // tampas: leque a partir do centro (a silhueta precisa ser estrelada em volta dele)
  const cx = outline.reduce((a, p) => a + p[0], 0) / n, cy = outline.reduce((a, p) => a + p[1], 0) / n;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = outline[i], [x1, y1] = outline[(i + 1) % n];
    pos.push(cx, cy, hz, x0, y0, hz, x1, y1, hz); nor.push(0, 0, 1, 0, 0, 1, 0, 0, 1);
    pos.push(cx, cy, -hz, x1, y1, -hz, x0, y0, -hz); nor.push(0, 0, -1, 0, 0, -1, 0, 0, -1);
    // lado
    const ex = x1 - x0, ey = y1 - y0, l = Math.hypot(ex, ey) || 1, nx = ey / l, ny = -ex / l;
    pos.push(x0, y0, -hz, x1, y1, -hz, x1, y1, hz, x0, y0, -hz, x1, y1, hz, x0, y0, hz);
    for (let k = 0; k < 6; k++) nor.push(nx, ny, 0);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute("normal", new BufferAttribute(new Float32Array(nor), 3));
  return g;
}

export const V = (x = 0, y = 0, z = 0) => new Vector3(x, y, z);
