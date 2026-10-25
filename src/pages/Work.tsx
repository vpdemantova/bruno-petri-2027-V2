/* OBRA — como na tela "fractal-cross": menu à esquerda, a obra num cartão
   preto (girar, ampliar para o Spyglass), a ficha embaixo (← nome →,
   material, tamanho, situação, série) e o cartão grande do texto, com
   "Comprar na loja". No lugar do retângulo cinza da tela: o configurador
   de material (as seis famílias e as variações) e três vistas da obra. */
import { AnimatePresence, motion, useIsPresent } from "motion/react";
import { useMemo, useState } from "react";
import { FOTO, fotoSrcset, fotoUrl, fotosDa } from "../data/fotos";
import { WORKS, WORK_BY_SLUG, mediumOf, type Family, type Finish, type MaterialChoice } from "../data/works";
import { TXT, useLang } from "../app/i18n";
import { navigate } from "../app/router";
import { useStore } from "../app/store";
import { FAMILIES, FINISHES, materialLabel, variantOf } from "../three/materials";
import { defaultMaterial } from "../three/piece";
import { presetsFor, type Angle } from "../three/engine";
import { Piece3D } from "../ui/Piece3D";
import { ArrowCircle, Bulb, Expand } from "../ui/Icons";
import { A, EASE_OUT, Ink, Nav, Swap, fade, rise, useMobile, useRadius } from "../ui/kit";

export default function Work({ slug }: { slug: string }) {
  const [lang, t] = useLang();
  const present = useIsPresent();
  const mobile = useMobile();
  const R = useRadius();
  const work = WORK_BY_SLUG[slug];
  const sculpt = work.kind.type === "sculpture";
  const chosen = useStore((s) => s.mats[slug]);
  const mat = chosen ?? (sculpt ? defaultMaterial(work) : undefined);
  const presets = useMemo(() => presetsFor(work), [work]);
  const [angle, setAngle] = useState<Angle | undefined>(undefined);
  const [lamp, setLamp] = useState(1);
  // BP-07: as fotos da peça física, ao lado do 3D (só aparecem se houver)
  const fotos = useMemo(() => fotosDa(slug), [slug]);
  const [fotoAt, setFotoAt] = useState<{ slug: string; i: number } | null>(null);
  const foto = fotoAt?.slug === slug ? fotoAt.i : null;
  const setFoto = (i: number | null) => setFotoAt(i === null ? null : { slug, i });
  const at = WORKS.findIndex((w) => w.slug === slug);
  const go = (d: number) => { setAngle(undefined); navigate(`/${WORKS[(at + d + WORKS.length) % WORKS.length].slug}`, { replace: true }); };
  const isLamp = work.category === "luminaria";
  const status = work.status === "disponivel" ? t(TXT.available) : work.status === "consulta" ? t(TXT.consult) : t(TXT.study);

  return (
    <motion.main className="pg pg-obra" id="conteudo" inert={!present} initial="initial" animate="animate" exit="exit">
      <motion.div {...fade(0.1)}><Nav theme="light" variant={mobile ? "grid" : "stack-left"} active="galeria" className="obra-nav" /></motion.div>
      <div className="obra-decor" aria-hidden="true">
        <Piece3D work={work} mode="still" dpr={1.25} angle={mobile ? { theta: 0.6, phi: 1.35, zoom: 2.2, ox: 0.7, oy: 0.4 } : { theta: -0.3, phi: 1.5, zoom: 2.1, ox: -0.95, oy: -0.55 }}
          flightKey={`hero:${slug}`} />
      </div>

      <motion.section className="card obra-view" aria-label={t(work.title)} {...rise(0, 0.15)}>
        <Piece3D work={work} mode="live" interactive={mobile ? "x" : true} spin={0.18} angle={angle} lamp={lamp} dpr={2} flightKey={`view:${slug}`} />
        <A href={`/spyglass/${slug}`} className="obra-expand" aria-label={t(TXT.expand)}><Expand /></A>
        {isLamp && (
          <button type="button" className="obra-lamp" aria-pressed={lamp > 0.5} onClick={() => setLamp((v) => (v > 0.5 ? 0 : 1))}>
            <Bulb on={lamp > 0.5} /> <span>{lamp > 0.5 ? t(TXT.lampOff) : t(TXT.lampOn)}</span>
          </button>
        )}
        <p className="obra-hint">{mobile ? t(TXT.dragTouch) : t(TXT.drag)}</p>
        {fotos.length > 0 && (
          <div className="obra-mode" role="group" aria-label={t(TXT.viewAs)}>
            <button type="button" aria-pressed={foto === null} onClick={() => setFoto(null)}>3D</button>
            <button type="button" aria-pressed={foto !== null} onClick={() => setFoto(0)}>{t(TXT.photo)}</button>
          </div>
        )}
        <AnimatePresence>
          {foto !== null && fotos[foto] && (
            <motion.figure key="foto" className="obra-foto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease: EASE_OUT }}>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.img key={fotos[foto]} src={fotoUrl(fotos[foto], 1280)} srcSet={fotoSrcset(fotos[foto])} sizes="(max-width: 899px) 92vw, 35vw"
                  alt={`${t(work.title)}: ${t(TXT.photo).toLowerCase()} ${foto + 1}`} style={{ background: FOTO[fotos[foto]].cor }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} />
              </AnimatePresence>
              {fotos.length > 1 && (
                <div className="obra-foto-dots" role="group" aria-label={t(TXT.photo)}>
                  {fotos.map((f, i) => <button key={f} type="button" aria-pressed={i === foto} aria-label={`${t(TXT.photo)} ${i + 1}`} onClick={() => setFoto(i)} />)}
                </div>
              )}
            </motion.figure>
          )}
        </AnimatePresence>
      </motion.section>

      <motion.section className="card obra-info" {...rise(1, 0.15)}>
        <div className="obra-title">
          <button type="button" onClick={() => go(-1)} aria-label={t(TXT.prev)}><ArrowCircle dir="left" /></button>
          <Swap k={slug + lang} as="div" className="obra-name"><h1>{t(work.title)}</h1></Swap>
          <button type="button" onClick={() => go(1)} aria-label={t(TXT.next)}><ArrowCircle /></button>
        </div>
        <Swap k={slug + lang + (mat ? mat.variant : "")} as="div">
          <dl className="meta">
            <div><dt className="sr">{t(TXT.material)}</dt><dd>{mat ? FAMILIES[mat.family].label[lang].toLowerCase() : mediumOf(work)?.[lang] ?? ""}</dd></div>
            <div><dt className="sr">{t(TXT.size)}</dt><dd>{work.dims ?? work.size}</dd></div>
            <div><dt className="sr">{t(TXT.state)}</dt><dd>{status}</dd></div>
          </dl>
          <p className="meta-series">{t(work.series)}{work.origin === "estudo" && <span className="tag-study">{t(TXT.study)}</span>}</p>
        </Swap>
      </motion.section>

      <section className="obra-text">
        <Ink className="obra-ink" radius={[R, R, R, R]} />
        <div className="obra-text-in">
        <motion.div {...rise(2)}>
          <A href={`/loja?obra=${slug}`} className="pill pill-sm pill-paper obra-buy">{t(TXT.buy)}</A>
        </motion.div>
        <Swap k={slug + lang} as="div" className="obra-paras">
          {work.text[lang].map((p, i) => <p key={i} className={i ? "is-mute" : ""}>{p}</p>)}
          {work.origin === "estudo" && <p className="is-note">{t(TXT.studyNote)}</p>}
        </Swap>
        {sculpt && mat && <Configurator slug={slug} mat={mat} families={work.families ?? []} />}
        <motion.div className="obra-views" {...rise(5)}>
          <h2 className="h-mini">{t(TXT.views)}</h2>
          <div className="obra-views-row">
            {[2, 4, 3].map((p) => (
              <button key={p} type="button" className="obra-thumb" onClick={() => setAngle({ ...presets[p] })} aria-label={`${t(TXT.angle)}: ${(lang === "pt" ? TXT.angles : TXT.anglesEn)[p]}`}>
                <Piece3D work={work} mode="still" angle={presets[p]} dpr={1.5} lamp={lamp} />
              </button>
            ))}
          </div>
        </motion.div>
        </div>
      </section>
    </motion.main>
  );
}

function Configurator({ slug, mat, families }: { slug: string; mat: MaterialChoice; families: Family[] }) {
  const [lang, t] = useLang();
  const setMat = useStore((s) => s.setMat);
  const fam = FAMILIES[mat.family];
  const pick = (m: MaterialChoice) => setMat(slug, m);
  const original = defaultMaterial(WORK_BY_SLUG[slug]);
  const isOriginal = original.family === mat.family && original.variant === mat.variant && (original.finish ?? "") === (mat.finish ?? "");
  return (
    <motion.div className="cfg" id="material" {...rise(4)}>
      <div className="cfg-head">
        <h2 className="h-mini">{t(TXT.material)}</h2>
        <Swap k={materialLabel(mat, lang)} className="cfg-now">{materialLabel(mat, lang)}</Swap>
        {!isOriginal && <button type="button" className="cfg-reset" onClick={() => pick(original)}>{lang === "pt" ? "original" : "original"}</button>}
      </div>
      <div className="cfg-fams" role="tablist" aria-label={t(TXT.material)}>
        {families.map((f) => (
          <button key={f} type="button" role="tab" aria-selected={mat.family === f} className="cfg-fam"
            onClick={() => pick({ family: f, variant: FAMILIES[f].variants[0].id, finish: f === "madeira" ? "acetinado" : undefined })}>
            {mat.family === f && <motion.span layoutId="cfg-fam" className="cfg-fam-on" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <span>{FAMILIES[f].label[lang]}</span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={mat.family} className="cfg-vars" role="radiogroup" aria-label={fam.label[lang]}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25, ease: EASE_OUT }}>
          {fam.variants.map((v, i) => (
            <motion.button key={v.id} type="button" role="radio" aria-checked={variantOf(mat).id === v.id} className="cfg-var" title={v.label[lang]}
              aria-label={v.label[lang]} style={{ "--sw": v.swatch } as React.CSSProperties}
              initial={{ scale: 0 }} animate={{ scale: 1, transition: { delay: i * 0.025, type: "spring", stiffness: 400, damping: 20 } }}
              onClick={() => pick({ ...mat, variant: v.id })} />
          ))}
        </motion.div>
      </AnimatePresence>
      {fam.finishes && (
        <div className="cfg-fin" role="radiogroup" aria-label={t(TXT.finish)}>
          {FINISHES.map((f) => (
            <button key={f.id} type="button" role="radio" aria-checked={(mat.finish ?? "acetinado") === f.id} onClick={() => pick({ ...mat, finish: f.id as Finish })}>{f.label[lang]}</button>
          ))}
        </div>
      )}
      <p className="cfg-note">{t(TXT.everyMaterial)}</p>
    </motion.div>
  );
}
