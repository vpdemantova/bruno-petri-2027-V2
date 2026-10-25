/* Miniatura de uma obra plana (pintura ou mandala).
   · Gerada: a imagem desenhada num canvas. Gerar uma pintura custa ~0,1 s,
     por isso as miniaturas entram numa fila e saem uma por vez, nos
     intervalos livres.
   · Fotografada (BP-02, 25/out/2026): uma <img> com srcset, que o
     navegador carrega na largura certa e só quando aparece. */
import { useEffect, useRef, useState } from "react";
import type { Work } from "../data/works";
import { FOTO, fotoSrcset, fotoUrl } from "../data/fotos";
import { flatFor, type Flat } from "../three/flat";
import { useLang } from "../app/i18n";

const queue: (() => void)[] = [];
let busy = false;
function pump() {
  if (busy) return;
  const job = queue.shift();
  if (!job) return;
  busy = true;
  const run = () => { job(); busy = false; pump(); };
  if ("requestIdleCallback" in window) requestIdleCallback(run, { timeout: 300 });
  else setTimeout(run, 16);
}
export function whenFlat(w: Work, cb: (f: Flat) => void) {
  let alive = true;
  queue.push(() => { if (alive) cb(flatFor(w.kind as never)); });
  pump();
  return () => { alive = false; };
}

export function FlatThumb({ work, className = "" }: { work: Work; className?: string }) {
  return work.kind.type === "photo" ? <PhotoThumb work={work} className={className} /> : <DrawnThumb work={work} className={className} />;
}

function PhotoThumb({ work, className }: { work: Work; className: string }) {
  const [lang] = useLang();
  const [ready, setReady] = useState(false);
  if (work.kind.type !== "photo") return null;
  const k = work.kind, f = FOTO[k.src];
  return (
    <span className={`piece3d flat-thumb flat-photo ${ready ? "is-ready" : ""} ${k.round ? "is-round" : ""} ${className}`}>
      <img src={fotoUrl(k.src, 640)} srcSet={fotoSrcset(k.src)} sizes="(max-width: 899px) 50vw, 22vw" width={f?.w} height={f?.h}
        alt={work.title[lang]} loading="lazy" decoding="async" onLoad={() => setReady(true)} style={{ background: f?.cor }} />
    </span>
  );
}

function DrawnThumb({ work, className }: { work: Work; className: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [lang] = useLang();
  useEffect(() => {
    return whenFlat(work, (f) => {
      const c = ref.current;
      if (!c) return;
      const dpr = Math.min(2, devicePixelRatio);
      const W = Math.max(2, Math.round(c.clientWidth * dpr)), H = Math.max(2, Math.round(c.clientHeight * dpr));
      c.width = W; c.height = H;
      const ctx = c.getContext("2d")!;
      // a obra inteira, com margem (como pendurada na parede), centrada
      const src = f.color, a = src.width / src.height;
      const m = 0.16;
      let w = W * (1 - m * 2), h = w / a;
      if (h > H * (1 - m * 2)) { h = H * (1 - m * 2); w = h * a; }
      const x = (W - w) / 2, y = (H - h) / 2;
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 24 * dpr; ctx.shadowOffsetY = 8 * dpr;
      if (work.kind.type === "painting" && work.kind.round) {
        ctx.beginPath(); ctx.arc(W / 2, H / 2, Math.min(w, h) / 2, 0, Math.PI * 2); ctx.closePath();
        ctx.fillStyle = "#000"; ctx.fill(); ctx.shadowColor = "transparent"; ctx.clip();
      } else { ctx.fillStyle = "#000"; ctx.fillRect(x, y, w, h); ctx.shadowColor = "transparent"; }
      ctx.drawImage(src, x, y, w, h);
      ctx.restore();
      setReady(true);
    });
  }, [work]);
  return <canvas ref={ref} className={`piece3d flat-thumb ${ready ? "is-ready" : ""} ${className}`} role="img" aria-label={work.title[lang]} />;
}
