/* Os testes da geometria (BP-70, 25/out/2026). Cada escultura é gerada de
   verdade, no Node, e conferida: tem triângulos, nenhum número inválido,
   o centro na origem e o raio 1 (o enquadramento de todas as vistas conta
   com isso), e as formas que nascem de espelhos continuam simétricas.
   A contagem de triângulos fica guardada (o "snapshot"): mudar uma forma
   sem querer acende o aviso; mudar de propósito é rodar
   `npx vitest run -u` e conferir a diferença no git. */
import { describe, expect, it } from "vitest";
import { BufferAttribute, Vector3 } from "three/webgpu";
import { GEN_IDS, build } from "./sculptures";
import { WORKS } from "../data/works";

const tris = (id: (typeof GEN_IDS)[number]) => build(id).main.getAttribute("position").count / 3;

/** as posições arredondadas, num conjunto, para procurar o espelho de cada vértice */
function pointSet(id: (typeof GEN_IDS)[number]) {
  const pos = build(id).main.getAttribute("position") as BufferAttribute;
  const key = (x: number, y: number, z: number) => `${Math.round(x * 2000)}|${Math.round(y * 2000)}|${Math.round(z * 2000)}`;
  const set = new Set<string>();
  for (let i = 0; i < pos.count; i++) set.add(key(pos.getX(i), pos.getY(i), pos.getZ(i)));
  return { pos, set, key };
}
function mirrored(id: (typeof GEN_IDS)[number], axis: 0 | 1 | 2) {
  const { pos, set, key } = pointSet(id);
  let miss = 0;
  for (let i = 0; i < pos.count; i++) {
    const v = [pos.getX(i), pos.getY(i), pos.getZ(i)];
    v[axis] = -v[axis];
    if (!set.has(key(v[0], v[1], v[2])) && !set.has(key(v[0] + 0.0004, v[1], v[2])) && !set.has(key(v[0] - 0.0004, v[1], v[2]))) miss++;
  }
  return miss / pos.count;
}

describe("as esculturas", () => {
  it.each(GEN_IDS)("%s: triângulos, números válidos, centro e raio 1", (id) => {
    const b = build(id);
    const pos = b.main.getAttribute("position");
    const nor = b.main.getAttribute("normal");
    expect(pos.count).toBeGreaterThan(0);
    expect(pos.count % 3).toBe(0);
    expect(nor.count).toBe(pos.count);
    const a = pos.array as Float32Array;
    for (let i = 0; i < a.length; i++) expect(Number.isFinite(a[i])).toBe(true);
    b.main.computeBoundingBox();
    const bb = b.main.boundingBox!;
    const c = bb.getCenter(new Vector3());
    expect(c.length()).toBeLessThan(1e-4);
    // o raio pela caixa: metade da diagonal = 1
    expect(bb.getSize(new Vector3()).length() / 2).toBeCloseTo(1, 4);
    // as normais têm comprimento 1 (uma normal torta escurece a face)
    const n = nor.array as Float32Array;
    for (let i = 0; i < n.length; i += 3 * 17) expect(Math.hypot(n[i], n[i + 1], n[i + 2])).toBeCloseTo(1, 3);
  });

  it("as luminárias têm o núcleo aceso dentro da caixa da peça", () => {
    for (const id of ["lanterna-cubica", "halo", "prisma"] as const) {
      const b = build(id);
      expect(b.glow).toBeTruthy();
      expect(b.glowAt).toBeTruthy();
      expect(b.main.boundingBox!.containsPoint(b.glowAt!)).toBe(true);
    }
  });

  it("as formas espelhadas continuam simétricas", () => {
    // a Cruz Fractal é um quadrante espelhado em x e y; a Molécula, o Ninho e o Hipercubo, nos três eixos
    const casos: [(typeof GEN_IDS)[number], (0 | 1 | 2)[]][] = [
      ["cruz-fractal", [0, 1]],
      ["molecula", [0, 1, 2]],
      ["ninho", [0, 1, 2]],
      ["hipercubo", [0, 1, 2]],
      ["dodecaedro", [0, 1, 2]],
    ];
    for (const [id, eixos] of casos) for (const e of eixos) expect(mirrored(id, e), `${id}, eixo ${"xyz"[e]}`).toBeLessThan(0.01);
  });

  it("a contagem de triângulos de cada forma (avisa se uma forma mudar)", () => {
    expect(Object.fromEntries(GEN_IDS.map((id) => [id, tris(id)]))).toMatchSnapshot();
  });

  it("toda escultura do catálogo tem gerador", () => {
    for (const w of WORKS) if (w.kind.type === "sculpture") expect(GEN_IDS).toContain(w.kind.gen);
  });
});
