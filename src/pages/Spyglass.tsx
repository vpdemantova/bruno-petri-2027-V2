/* SPYGLASS — a obra sozinha na tela inteira. Os quatro cantos levam às
   páginas; o "i" abre a ficha; à direita, "Explore every angle" e os seis
   pontos: cada um leva a câmera a um ângulo (o 2º é o close das telas).
   Arrastar gira, a roda aproxima; ← → trocam o ângulo, 1–6 escolhem. */
import { AnimatePresence, motion, useIsPresent } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { WORKS, WORK_BY_SLUG } from "../data/works";
import { TXT, useLang } from "../app/i18n";
import { navigate } from "../app/router";
import { useStore } from "../app/store";
import { presetsFor } from "../three/engine";
import { materialLabel } from "../three/materials";
import { defaultMaterial } from "../three/piece";
import { Piece3D } from "../ui/Piece3D";
import { ArrowCircle, Close } from "../ui/Icons";
import { A, EASE_OUT, Nav, Swap, fade, useMobile } from "../ui/kit";

export default function Spyglass({ slug }: { slug: string }) {
  const [lang, t] = useLang();
  const present = useIsPresent();
  const mobile = useMobile();
  const work = WORK_BY_SLUG[slug];
  const presets = useMemo(() => presetsFor(work), [work]);
  const [ang, setAng] = useState(0);
  const [info, setInfo] = useState(false);
  const [touched, setTouched] = useState(false);
  const mat = useStore((s) => s.mats[slug]) ?? (work.kind.type === "sculpture" ? defaultMaterial(work) : undefined);
  const infoBtn = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const list = WORKS.filter((w) => w.kind.type === "sculpture");
  const at = list.findIndex((w) => w.slug === slug);
  const go = (d: number) => navigate(`/spyglass/${list[(at + d + list.length) % list.length].slug}`, { replace: true });

  useEffect(() => { setAng(0); }, [slug]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input,textarea")) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { setAng((a) => (a + 1) % 6); setTouched(true); }
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { setAng((a) => (a + 5) % 6); setTouched(true); }
      else if (/^[1-6]$/.test(e.key)) { setAng(+e.key - 1); setTouched(true); }
      else if (e.key === "Escape") { if (info) { setInfo(false); infoBtn.current?.focus(); } }
      else if (e.key.toLowerCase() === "i") setInfo((v) => !v);
    };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, [info]);
  useEffect(() => { if (info) closeBtn.current?.focus(); }, [info]);

  const names = lang === "pt" ? TXT.angles : TXT.anglesEn;
  return (
    <motion.main className="pg pg-spy" id="conteudo" inert={!present} initial="initial" animate="animate" exit="exit" onPointerDown={() => setTouched(true)}>
      <div className="spy-stage">
        <Piece3D work={work} mode="live" interactive spin={0.05} angle={presets[ang]} dpr={2}
          flightKey={[`view:${slug}`, `hero:${slug}`]} />
      </div>
      <motion.div {...fade(0.15)}><Nav theme="light" variant="corners" className="spy-nav" /></motion.div>

      <motion.button ref={infoBtn} type="button" className="spy-i" aria-expanded={info} aria-controls="spy-ficha" aria-label={t(TXT.info)}
        onClick={() => setInfo((v) => !v)}
        initial={{ scale: 0 }} animate={{ scale: 1, transition: { delay: 0.6, type: "spring", stiffness: 260, damping: 18 } }} exit={{ scale: 0 }}>
        <span aria-hidden="true">i</span>
      </motion.button>

      <motion.div className="spy-angles" {...fade(0.5)}>
        <AnimatePresence>
          {!touched && (
            <motion.p className="spy-explore" aria-hidden="true" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.8, duration: 0.8, ease: EASE_OUT } }} exit={{ opacity: 0, x: 12, transition: { duration: 0.4 } }}>
              {t(TXT.explore).split(" ").map((w) => <span key={w}>{w}</span>)}
            </motion.p>
          )}
        </AnimatePresence>
        <div className="spy-dots" role="radiogroup" aria-label={t(TXT.explore)}>
          {presets.map((_, i) => (
            <button key={i} type="button" role="radio" aria-checked={ang === i} aria-label={`${t(TXT.angle)} ${i + 1}: ${names[i]}`}
              onClick={() => { setAng(i); setTouched(true); }}>
              {ang === i && <motion.span layoutId="spy-dot" className="spy-dot-on" transition={{ type: "spring", stiffness: 500, damping: 34 }} />}
            </button>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {info && (
          <motion.aside id="spy-ficha" className="spy-card" role="dialog" aria-modal="false" aria-labelledby="spy-title"
            initial={{ opacity: 0, x: -30, scale: 0.96, filter: "blur(8px)" }} animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -20, scale: 0.97, filter: "blur(6px)" }} transition={{ duration: 0.45, ease: EASE_OUT }}>
            <button ref={closeBtn} type="button" className="spy-card-x" aria-label={t(TXT.close)} onClick={() => { setInfo(false); infoBtn.current?.focus(); }}><Close /></button>
            <div className="spy-card-head">
              <button type="button" aria-label={t(TXT.prev)} onClick={() => go(-1)}><ArrowCircle dir="left" /></button>
              <Swap k={slug + lang} className="spy-card-title"><span id="spy-title">{t(work.title)}</span></Swap>
              <button type="button" aria-label={t(TXT.next)} onClick={() => go(1)}><ArrowCircle /></button>
            </div>
            <dl className="meta">
              {mat && <div><dt className="sr">{t(TXT.material)}</dt><dd>{materialLabel(mat, lang).split(" · ")[0]}</dd></div>}
              <div><dt className="sr">{t(TXT.size)}</dt><dd>{work.dims ?? work.size}</dd></div>
              <div><dt className="sr">{t(TXT.state)}</dt><dd>{work.status === "disponivel" ? t(TXT.available) : work.status === "consulta" ? t(TXT.consult) : t(TXT.study)}</dd></div>
            </dl>
            <p className="meta-series">{t(work.series)}</p>
            <Swap k={slug + lang} as="p" className="spy-card-text">{work.text[lang][0]}</Swap>
            <p className="spy-card-hint">{mobile ? t(TXT.dragTouch) : t(TXT.drag)}</p>
            <A href={`/${slug}`} className="pill pill-sm pill-paper">{t(TXT.open)}</A>
          </motion.aside>
        )}
      </AnimatePresence>
    </motion.main>
  );
}
