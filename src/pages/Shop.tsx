/* LOJA — não estava nas telas; feita na mesma língua visual: painel preto
   à esquerda (título, texto, filtros e a lista), cartões pretos à direita.
   Preço, prazo e entrega são combinados com o artista: a "compra" é uma
   lista de interesse enviada por e-mail (ou copiada, enquanto o e-mail
   dele não estiver publicado). Nada de preço inventado. */
import { AnimatePresence, motion, useIsPresent } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, WORKS, WORK_BY_SLUG, lightCard, mediumOf, type Category, type Work } from "../data/works";
import { ARTIST } from "../data/artist";
import { TXT, useLang } from "../app/i18n";
import { useRoute } from "../app/router";
import { useStore } from "../app/store";
import { FAMILIES, materialLabel } from "../three/materials";
import { defaultMaterial } from "../three/piece";
import { Piece3D } from "../ui/Piece3D";
import { FlatThumb } from "../ui/FlatThumb";
import { ArrowDisc, Bag, Check, Close, Plus } from "../ui/Icons";
import { A, EASE_OUT, Ink, LangSwitch, Nav, Swap, fade, rise, useMobile, useRadius } from "../ui/kit";

export default function Shop() {
  const [lang, t] = useLang();
  const present = useIsPresent();
  const mobile = useMobile();
  const R = useRadius();
  const { search } = useRoute();
  const focus = new URLSearchParams(search).get("obra");
  const [cat, setCat] = useState<Category | "all">("all");
  const wish = useStore((s) => s.wish);
  const setCart = useStore((s) => s.setCart);
  const works = useMemo(() => WORKS.filter((w) => cat === "all" || w.category === cat), [cat]);

  useEffect(() => {
    if (!focus) return;
    const id = setTimeout(() => {
      const el = document.getElementById(`prod-${focus}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.classList.add("is-focus");
    }, 700);
    return () => clearTimeout(id);
  }, [focus]);

  return (
    <motion.main className="pg pg-loja" id="conteudo" inert={!present} initial="initial" animate="animate" exit="exit">
      <aside className="loja-side">
        <Ink className="loja-ink" radius={mobile ? [0, 0, R, R] : [0, R, R, 0]} />
        <div className="loja-side-in">
          <motion.p className="tagline" {...rise(0)}>{ARTIST.tagline}</motion.p>
          <motion.h1 className="h-big" {...rise(1)}><Swap k={lang}>{t(TXT.shopTitle)}</Swap></motion.h1>
          <motion.div {...rise(2)}><Swap k={lang} as="p" className="loja-lead">{t(TXT.shopLead)}</Swap></motion.div>
          <motion.div className="loja-cats" role="radiogroup" aria-label={t(TXT.pieces)} {...rise(3)}>
            {CATEGORIES.map((c) => (
              <button key={c.id} type="button" role="radio" aria-checked={cat === c.id} className="chip" onClick={() => setCat(c.id)}>
                {cat === c.id && <motion.span layoutId="loja-cat" className="chip-on" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                <span>{c.label[lang]}</span>
              </button>
            ))}
          </motion.div>
          <motion.button type="button" className="pill pill-paper loja-wish" onClick={() => setCart(true)} {...rise(4)}>
            <Bag className="ico" /> <span>{t(TXT.wish)}</span>
            <AnimatePresence mode="popLayout">
              <motion.b key={wish.length} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}>{wish.length}</motion.b>
            </AnimatePresence>
          </motion.button>
          {!mobile && <motion.div className="loja-foot" {...rise(5)}><LangSwitch /></motion.div>}
        </div>
      </aside>
      <motion.div {...fade(0.1)}><Nav theme="light" variant={mobile ? "grid" : "stack"} active="loja" className="loja-nav" /></motion.div>
      <section className="loja-grid" aria-label={t(TXT.shopTitle)}>
        <AnimatePresence mode="popLayout" initial={false}>
          {works.map((w, i) => <Product key={w.slug} work={w} i={i} />)}
        </AnimatePresence>
      </section>
    </motion.main>
  );
}

function Product({ work, i }: { work: Work; i: number }) {
  const [lang, t] = useLang();
  const [hover, setHover] = useState(false);
  const chosen = useStore((s) => s.mats[work.slug]);
  const inWish = useStore((s) => s.wish.some((x) => x.slug === work.slug));
  const addWish = useStore((s) => s.addWish);
  const setCart = useStore((s) => s.setCart);
  const sculpt = work.kind.type === "sculpture";
  const mat = chosen ?? (sculpt ? defaultMaterial(work) : undefined);
  const status = work.status === "disponivel" ? t(TXT.available) : work.status === "consulta" ? t(TXT.consult) : t(TXT.study);
  return (
    <motion.article id={`prod-${work.slug}`} layout className={`prod ${lightCard(work) ? "is-light" : ""}`}
      initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.25 + Math.min(i, 10) * 0.05, duration: 0.7, ease: EASE_OUT } }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.2 } }}
      onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
      <A href={`/${work.slug}`} className="prod-view" aria-label={t(work.title)}>
        {sculpt ? <Piece3D work={work} mode={hover ? "live" : "still"} spin={hover ? 0.6 : 0} dpr={1.5} flightKey={`view:${work.slug}`} /> : <FlatThumb work={work} />}
        <ArrowDisc className="disc card-disc" />
        <span className={`prod-status is-${work.status}`}>{status}</span>
      </A>
      <div className="prod-body">
        <h2 className="prod-name">{t(work.title)}</h2>
        <p className="prod-meta"><span>{t(work.series)}</span><span>{work.size}</span></p>
        <p className="prod-mat">
          {mat ? <Swap k={materialLabel(mat, lang)}>{materialLabel(mat, lang)}</Swap> : <span>{mediumOf(work)?.[lang] ?? ""}</span>}
        </p>
        <div className="prod-row">
          <span className="prod-price">{t(TXT.priceNote)}</span>
          {sculpt && <A href={`/${work.slug}#material`} className="prod-cfg">{t(TXT.configure)}</A>}
        </div>
        <button type="button" className={`pill pill-sm ${inWish ? "pill-paper" : ""} prod-add`} onClick={() => { addWish(work.slug, mat); if (inWish) setCart(true); }} aria-pressed={inWish}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={String(inWish)} className="prod-add-in" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ duration: 0.2 }}>
              {inWish ? <><Check className="ico" /> {t(TXT.inWish)}</> : <><Plus className="ico" /> {t(TXT.addWish)}</>}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
    </motion.article>
  );
}

/* ── a lista de interesse (gaveta lateral, aberta de qualquer página) ── */
export function WishDrawer() {
  const [lang, t] = useLang();
  const open = useStore((s) => s.cart);
  const setCart = useStore((s) => s.setCart);
  const wish = useStore((s) => s.wish);
  const setWish = useStore((s) => s.setWish);
  const removeWish = useStore((s) => s.removeWish);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCart(false);
      if (e.key === "Tab" && box.current) {
        const f = box.current.querySelectorAll<HTMLElement>("button, a[href], input, textarea, select");
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    addEventListener("keydown", k);
    setTimeout(() => box.current?.querySelector<HTMLElement>("button")?.focus(), 60);
    return () => { removeEventListener("keydown", k); (opener.current as HTMLElement | null)?.focus?.(); };
  }, [open, setCart]);

  const text = () => {
    const lines = wish.map((w) => {
      const wk = WORK_BY_SLUG[w.slug];
      return `• ${wk.title[lang]} (${wk.size})${w.material ? ` — ${materialLabel(w.material, lang)}` : ""} × ${w.qty}${w.note ? ` — ${w.note}` : ""}`;
    });
    const hi = lang === "pt" ? "Olá, Bruno! Tenho interesse nestas obras:" : "Hello Bruno! I am interested in these works:";
    return [hi, "", ...lines, "", note, "", name ? `— ${name}` : ""].filter((l, i, a) => l || a[i - 1]).join("\n").trim();
  };
  const subject = lang === "pt" ? "Interesse em obras — site" : "Interest in works — website";

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="wish-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { delay: 0.15 } }}>
          <div className="wish-scrim" onClick={() => setCart(false)} />
          <motion.div ref={box} className="wish" role="dialog" aria-modal="true" aria-labelledby="wish-h"
            initial={{ x: "105%" }} animate={{ x: 0 }} exit={{ x: "105%" }} transition={{ type: "spring", stiffness: 160, damping: 24 }}>
            <header className="wish-head">
              <h2 id="wish-h">{t(TXT.wish)} <b>{wish.length}</b></h2>
              <button type="button" className="wish-x" onClick={() => setCart(false)} aria-label={t(TXT.close)}><Close /></button>
            </header>
            {wish.length === 0 ? <p className="wish-empty">{t(TXT.wishEmpty)}</p> : (
              <ul className="wish-list">
                <AnimatePresence initial={false}>
                  {wish.map((w) => {
                    const wk = WORK_BY_SLUG[w.slug];
                    return (
                      <motion.li key={w.slug} layout initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30, height: 0, marginBottom: 0 }} transition={{ duration: 0.3, ease: EASE_OUT }}>
                        <div className="wish-thumb">{wk.kind.type === "sculpture" ? <Piece3D work={wk} material={w.material} mode="still" dpr={1.5} /> : <FlatThumb work={wk} />}</div>
                        <div className="wish-info">
                          <A href={`/${w.slug}`} onClick={() => setCart(false)} className="wish-name">{t(wk.title)} <ArrowDisc className="disc" /></A>
                          <span className="wish-mat">{w.material ? materialLabel(w.material, lang) : wk.size}</span>
                          <div className="wish-qty" role="group" aria-label={t(TXT.qty)}>
                            <button type="button" onClick={() => setWish(w.slug, { qty: Math.max(1, w.qty - 1) })} aria-label="−1">−</button>
                            <output>{w.qty}</output>
                            <button type="button" onClick={() => setWish(w.slug, { qty: Math.min(20, w.qty + 1) })} aria-label="+1">+</button>
                          </div>
                        </div>
                        <button type="button" className="wish-rm" onClick={() => removeWish(w.slug)} aria-label={`${t(TXT.remove)}: ${t(wk.title)}`}><Close /></button>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
            {wish.length > 0 && (
              <div className="wish-form">
                <label><span>{t(TXT.name)}</span><input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
                <label><span>{t(TXT.note)}</span><textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} /></label>
                {!ARTIST.email && <p className="wish-warn">{t(TXT.noEmail)}</p>}
                <div className="wish-actions">
                  {ARTIST.email && <a className="pill pill-paper" href={`mailto:${ARTIST.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text())}`}>{t(TXT.send)}</a>}
                  <button type="button" className="pill" onClick={async () => {
                    try { await navigator.clipboard.writeText(text()); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* sem área de transferência */ }
                  }}>{copied ? t(TXT.copied) : t(TXT.copy)}</button>
                </div>
                <p className="wish-fams">{Object.values(FAMILIES).map((f) => f.label[lang]).join(" · ")}</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
