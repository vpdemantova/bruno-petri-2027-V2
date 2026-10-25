/* SOBRE — o artista (as palavras da Home), as matérias (cada família com
   as variações, numa amostra 3D que gira com o mouse), a geometria por
   trás das formas (φ, √2, ângulo áureo, sólidos de Platão), o contato e
   os créditos. Página que rola; o painel preto abre a página. */
import { motion, useIsPresent, useInView } from "motion/react";
import { useRef, useState } from "react";
import { SAMPLE, WORK_BY_SLUG, type Family } from "../data/works";
import { ARTIST } from "../data/artist";
import { TXT, useLang } from "../app/i18n";
import { FAMILIES, FINISHES } from "../three/materials";
import { Piece3D } from "../ui/Piece3D";
import { Logo } from "../ui/Logo";
import { ArrowDisc } from "../ui/Icons";
import { A, Contacts, EASE_OUT, Ink, LangSwitch, Nav, Swap, fade, rise, useMobile, useRadius } from "../ui/kit";

export default function About() {
  const [lang, t] = useLang();
  const present = useIsPresent();
  const mobile = useMobile();
  const R = useRadius();
  return (
    <motion.main className="pg pg-sobre" id="conteudo" inert={!present} initial="initial" animate="animate" exit="exit">
      <motion.div {...fade(0.1)}><Nav theme="light" variant={mobile ? "grid" : "stack"} active="sobre" className="sobre-nav" /></motion.div>
      <header className="sobre-hero">
        <Ink className="sobre-ink" radius={mobile ? [0, 0, R, R] : [0, R, R, 0]} />
        <div className="sobre-hero-in">
          <motion.p className="tagline" {...rise(0)}>{ARTIST.tagline}</motion.p>
          <motion.div {...rise(1)}><Logo as="div" /></motion.div>
          <motion.h1 className="h-big" {...rise(2)}><Swap k={lang}>{t(TXT.aboutTitle)}</Swap></motion.h1>
          {ARTIST.bio[lang].map((p, i) => (
            <motion.div key={i} {...rise(3 + i)}><Swap k={lang + i} as="p" className="sobre-bio">{p}</Swap></motion.div>
          ))}
          <motion.div className="sobre-hero-foot" {...rise(6)}><LangSwitch /><Contacts /></motion.div>
        </div>
        <div className="sobre-hero-art">
          <Piece3D work={WORK_BY_SLUG["molecula"]} mode="live" spin={0.15} interactive dpr={1.5} flightKey={["hero:molecula", "view:molecula"]} />
        </div>
      </header>

      {ARTIST.cv.length > 0 && <CvSection />}

      <section className="sobre-sec" aria-labelledby="h-mat">
        <Reveal><h2 id="h-mat" className="h-sec"><Swap k={lang}>{t(TXT.materialsTitle)}</Swap></h2></Reveal>
        <Reveal><p className="sec-lead">{t(TXT.materialsLead)}</p></Reveal>
        {(Object.keys(FAMILIES) as Family[]).map((f) => <FamilyRow key={f} family={f} />)}
      </section>

      <section className="sobre-sec" aria-labelledby="h-geo">
        <Reveal><h2 id="h-geo" className="h-sec">{t(TXT.geometryTitle)}</h2></Reveal>
        <div className="geo-grid">
          {GEO.map((g, i) => (
            <Reveal key={g.id} delay={i * 0.06}>
              <article className="geo">
                <GeoFigure id={g.id} />
                <h3>{g.title[lang]}</h3>
                <p>{g.text[lang]}</p>
                <ul className="geo-links">
                  {g.works.map((s) => <li key={s}><A href={`/${s}`}>{t(WORK_BY_SLUG[s].title)} <ArrowDisc className="disc" /></A></li>)}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="sobre-sec sobre-contact" id="contato" aria-labelledby="h-contato">
        <Reveal><h2 id="h-contato" className="h-sec">{t(TXT.contact)}</h2></Reveal>
        <Reveal>
          <p className="sec-lead">
            {ARTIST.email || ARTIST.instagram
              ? (lang === "pt" ? "Escreva para o artista:" : "Write to the artist:")
              : (lang === "pt" ? "O e-mail e o Instagram do artista entram aqui em breve. Enquanto isso, monte a sua lista na loja e copie o pedido." : "The artist's e-mail and Instagram will be added here soon. Meanwhile, build your list in the shop and copy the request.")}
          </p>
        </Reveal>
        {ARTIST.email && <p><a className="pill" href={`mailto:${ARTIST.email}`}>{ARTIST.email}</a></p>}
        {ARTIST.instagram && <p><a className="pill" href={ARTIST.instagram} target="_blank" rel="noreferrer">Instagram</a></p>}
        <A href="/loja" className="pill pill-ink">{t(TXT.loja)}</A>
      </section>

      <footer className="sobre-credits">
        <h2 className="h-mini">{t(TXT.credits)}</h2>
        <p>{lang === "pt"
          ? "Esculturas em 3D geradas por código (three.js com WebGPU, e WebGL2 de reserva); materiais calculados pela posição, sem fotos. Fontes: Syne, Lexend e Cormorant Garamond (licença SIL Open Font). As formas marcadas como estudo, as pinturas e as mandalas geradas ficam no lugar das obras do artista até a troca pelas fotos."
          : "3D sculptures generated in code (three.js with WebGPU, WebGL2 fallback); materials computed from position, no photos. Typefaces: Syne, Lexend and Cormorant Garamond (SIL Open Font License). Forms marked as studies, and the generated paintings and mandalas, stand in for the artist's works until replaced by photographs."}</p>
      </footer>
    </motion.main>
  );
}

/* ── BP-06: exposições, prêmios e acervos (só aparece quando o Bruno confirmar e a lista em artist.ts tiver linhas) ── */
const CV_TIPO = {
  individual: { pt: "individual", en: "solo show" },
  coletiva: { pt: "coletiva", en: "group show" },
  premio: { pt: "prêmio", en: "award" },
  acervo: { pt: "acervo", en: "collection" },
};
function CvSection() {
  const [lang, t] = useLang();
  const rows = [...ARTIST.cv].sort((a, b) => b.ano - a.ano);
  return (
    <section className="sobre-sec" aria-labelledby="h-cv">
      <Reveal><h2 id="h-cv" className="h-sec">{t(TXT.cvTitle)}</h2></Reveal>
      <Reveal>
        <ol className="cv">
          {rows.map((r, i) => (
            <li key={i}>
              <span className="cv-ano">{r.ano}</span>
              <span className="cv-tit">{r.titulo[lang]}</span>
              <span className="cv-lug">{[r.lugar, r.cidade].filter(Boolean).join(", ")}</span>
              <span className="cv-tipo">{CV_TIPO[r.tipo][lang]}</span>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  );
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, margin: "-8% 0px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 34 }} animate={seen ? { opacity: 1, y: 0 } : undefined} transition={{ duration: 0.9, ease: EASE_OUT, delay }}>
      {children}
    </motion.div>
  );
}

function FamilyRow({ family }: { family: Family }) {
  const [lang] = useLang();
  const f = FAMILIES[family];
  const [live, setLive] = useState<string | null>(null);
  return (
    <Reveal>
      <div className="fam">
        <h3 className="fam-h">{f.label[lang]}{f.finishes && <small>{FINISHES.map((x) => x.label[lang]).join(" · ")}</small>}</h3>
        <ul className="fam-row">
          {f.variants.map((v) => (
            <li key={v.id} className="fam-cell" onPointerEnter={() => setLive(v.id)} onPointerLeave={() => setLive(null)} tabIndex={0} onFocus={() => setLive(v.id)} onBlur={() => setLive(null)}>
              <div className="fam-swatch">
                <Piece3D work={SAMPLE} material={{ family, variant: v.id, finish: family === "madeira" ? "brilhante" : undefined }}
                  mode={live === v.id ? "live" : "still"} spin={live === v.id ? 0.9 : 0} dpr={1.5} label={`${f.label[lang]}: ${v.label[lang]}`} />
              </div>
              <span>{v.label[lang]}</span>
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}

/* ── a geometria (fatos de matemática, bem estabelecidos) ── */
const GEO = [
  {
    id: "phi", works: ["espiral-aurea", "dodecaedro"],
    title: { pt: "φ — a razão áurea", en: "φ — the golden ratio" },
    text: {
      pt: "Divida um segmento de modo que o todo esteja para a parte maior assim como a maior está para a menor: a razão é φ = (1 + √5) / 2 ≈ 1,618. Ela aparece no pentágono, no dodecaedro e na espiral de quadrados.",
      en: "Divide a segment so that the whole is to the larger part as the larger is to the smaller: the ratio is φ = (1 + √5) / 2 ≈ 1.618. It appears in the pentagon, the dodecahedron and the spiral of squares.",
    },
  },
  {
    id: "r2", works: ["torre-raiz2", "portal"],
    title: { pt: "√2 — o quadrado no quadrado", en: "√2 — the square in the square" },
    text: {
      pt: "Ligue os meios dos lados de um quadrado: nasce outro, girado 45°, com lado menor na razão √2 ≈ 1,414 e metade da área. Repetido, dá a torre de molduras.",
      en: "Join the midpoints of a square's sides: another square appears, turned 45°, smaller by √2 ≈ 1.414 and with half the area. Repeated, it builds the tower of frames.",
    },
  },
  {
    id: "golden-angle", works: ["coluna-aurea"],
    title: { pt: "137,5° — o ângulo áureo", en: "137.5° — the golden angle" },
    text: {
      pt: "A volta inteira dividida pela razão áurea deixa um ângulo de cerca de 137,5°. Girando cada nova peça por ele, nenhuma fica exatamente sobre outra: é o arranjo de muitas folhas e sementes.",
      en: "A full turn divided by the golden ratio leaves an angle of about 137.5°. Turning each new piece by it, none lands exactly over another: it is the arrangement of many leaves and seeds.",
    },
  },
  {
    id: "platonic", works: ["estrela-tetraedrica", "octaedro-estrelado", "dodecaedro"],
    title: { pt: "Os sólidos de Platão", en: "The Platonic solids" },
    text: {
      pt: "Só existem cinco sólidos com todas as faces iguais e regulares e o mesmo número de faces em cada vértice: tetraedro, cubo, octaedro, dodecaedro e icosaedro (Euclides prova isso no fim dos Elementos).",
      en: "There are only five solids whose faces are all equal regular polygons with the same number meeting at each vertex: tetrahedron, cube, octahedron, dodecahedron and icosahedron (Euclid proves it at the end of the Elements).",
    },
  },
];

function GeoFigure({ id }: { id: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const seen = useInView(ref, { once: true });
  const draw = (d: number) => ({ initial: { pathLength: 0, opacity: 0 }, animate: seen ? { pathLength: 1, opacity: 1 } : undefined, transition: { duration: 1.6, ease: EASE_OUT, delay: d } });
  const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.4 };
  if (id === "phi") {
    // retângulo áureo com os quadrados e a espiral
    const P = 1.618;
    return (
      <svg ref={ref} viewBox="-4 -4 170 108" className="geo-fig" aria-hidden="true">
        <motion.rect x="0" y="0" width={100 * P} height="100" {...s} {...draw(0)} />
        <motion.path d="M100 0V100M100 61.8H161.8M123.6 61.8V100M100 76.4H123.6" {...s} {...draw(0.3)} />
        <motion.path d="M0 100A100 100 0 0 1 100 0A61.8 61.8 0 0 1 161.8 61.8A38.2 38.2 0 0 1 123.6 100A23.6 23.6 0 0 1 100 76.4" {...s} stroke="var(--magenta)" strokeWidth={2} {...draw(0.6)} />
      </svg>
    );
  }
  if (id === "r2") {
    const sq = (k: number, rot: number) => {
      const r = 50 / Math.pow(Math.SQRT2, k) * Math.SQRT2;
      const pts = [0, 1, 2, 3].map((i) => { const a = rot + Math.PI / 4 + (i * Math.PI) / 2; return `${60 + Math.cos(a) * r},${52 + Math.sin(a) * r}`; });
      return `M${pts.join("L")}Z`;
    };
    return (
      <svg ref={ref} viewBox="0 0 120 104" className="geo-fig" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((k) => <motion.path key={k} d={sq(k, (k * Math.PI) / 4)} {...s} stroke={k === 1 ? "var(--cyan)" : "currentColor"} {...draw(k * 0.2)} />)}
      </svg>
    );
  }
  if (id === "golden-angle") {
    const g = Math.PI * (3 - Math.sqrt(5));
    return (
      <svg ref={ref} viewBox="-55 -55 110 110" className="geo-fig" aria-hidden="true">
        {Array.from({ length: 120 }, (_, i) => {
          const r = 4.5 * Math.sqrt(i), a = i * g;
          return <motion.circle key={i} cx={Math.cos(a) * r} cy={Math.sin(a) * r} r={1.3 + i * 0.012} fill={i % 13 === 0 ? "var(--magenta)" : "currentColor"}
            initial={{ scale: 0 }} animate={seen ? { scale: 1 } : undefined} transition={{ delay: i * 0.012, type: "spring", stiffness: 300, damping: 18 }} />;
        })}
      </svg>
    );
  }
  // cubo e octaedro (duais) em perspectiva simples
  return (
    <svg ref={ref} viewBox="0 0 120 104" className="geo-fig" aria-hidden="true">
      <motion.path d="M30 30H80V80H30ZM45 18H95V68H45ZM30 30L45 18M80 30L95 18M80 80L95 68M30 80L45 68" {...s} {...draw(0)} />
      <motion.path d="M62.5 24L87.5 49L62.5 74L37.5 49ZM62.5 24L62.5 74M37.5 49L87.5 49" {...s} stroke="var(--cyan)" {...draw(0.4)} />
    </svg>
  );
}
