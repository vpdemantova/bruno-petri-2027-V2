/* As fotos das obras de verdade (BP-02 e BP-07, 25/out/2026). O JSON é
   escrito por `npm run fotos` (scripts/fotos.mjs), que lê media/obras/ e
   grava as versões leves em public/obras/<nome>-<largura>.webp.
   · uma pintura ou mandala fotografada: a obra tem kind { type: "photo", src: "<nome>" };
   · as fotos de uma escultura: <endereço>--1, --2… aparecem em "foto | 3D" na página da obra.
   Sem foto, nada aparece: o site continua com o 3D e as imagens geradas. */
import FOTOS from "./fotos.json";

export interface Foto { w: number; h: number; larguras: number[]; cor: string }
export const FOTO: Record<string, Foto> = FOTOS as Record<string, Foto>;

const url = (nome: string, l: number) => `/obras/${nome}-${l}.webp`;

/** a menor versão que ainda cobre a largura pedida (em pixels de tela) */
export function fotoUrl(nome: string, largura: number): string {
  const f = FOTO[nome];
  if (!f) return "";
  const l = f.larguras.find((x) => x >= largura) ?? f.larguras[f.larguras.length - 1];
  return url(nome, l);
}
export const fotoSrcset = (nome: string) => (FOTO[nome]?.larguras ?? []).map((l) => `${url(nome, l)} ${l}w`).join(", ");

/** as fotos de uma escultura, na ordem: cruz-fractal--1, cruz-fractal--2… */
export const fotosDa = (slug: string) =>
  Object.keys(FOTO).filter((k) => k.startsWith(`${slug}--`)).sort((a, b) => +a.split("--")[1] - +b.split("--")[1]);
