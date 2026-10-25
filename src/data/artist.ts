/* ════════════════════════════════════════════════════════════════════
   O ARTISTA — só o que está nas telas de referência. O resto fica vazio
   até o Bruno confirmar (TAREFAS.md, BP-01 e BP-03): e-mail, Instagram,
   cidade, exposições. Campo vazio = o botão some ou avisa, nunca inventa.
════════════════════════════════════════════════════════════════════ */
import type { T } from "./works";

export const ARTIST = {
  name: "Bruno Petri",
  tagline: "Transcendental Geometrical Art",
  /** e-mail para a lista de interesse da loja e o botão EMAIL (vazio até ele mandar) */
  email: "",
  /** endereço do perfil, ex.: "https://instagram.com/…" (vazio até ele mandar) */
  instagram: "",
  // as duas colunas da Home, com as palavras da tela (corrigidas só na grafia)
  bio: {
    pt: [
      "Artista plástico, arte geométrica e transcendental. Formado em Artes Visuais pela Unicamp em 1996, começou a explorar as formas e esculturas com seu projeto sistemas geométricos cúbicos.",
      "Hoje tem uma grande coleção de telas, esculturas, desenhos, mandalas, luminárias, entre outros. Explore todo o seu trabalho no site.",
    ],
    en: [
      "Visual artist, geometric and transcendental art. He graduated in Visual Arts from Unicamp in 1996 and began exploring forms and sculpture through his project of cubic geometric systems.",
      "Today he holds a large collection of canvases, sculptures, drawings, mandalas and lamps, among other works. Explore all of his work on this site.",
    ],
  } as Record<"pt" | "en", string[]>,
  /** a frase curta do celular */
  short: {
    pt: "Artista plástico, arte geométrica e transcendental. Formado em Artes Visuais pela Unicamp em 1996.",
    en: "Visual artist, geometric and transcendental art. Graduated in Visual Arts from Unicamp in 1996.",
  } as T,
  /**
   * BP-06: exposições, prêmios e acervos, com ano e lugar. Só o que o Bruno
   * confirmar; vazio, a seção não aparece na página Sobre. Exemplo de linha:
   * { ano: 2019, tipo: "individual", titulo: { pt: "…", en: "…" }, lugar: "…", cidade: "Campinas" }
   */
  cv: [] as CvItem[],
};

export interface CvItem { ano: number; tipo: "individual" | "coletiva" | "premio" | "acervo"; titulo: T; lugar: string; cidade: string }
