/* navegador.mjs — dirige o Edge sem janela (headless) pelo protocolo de depuração (CDP).

   De onde veio: o roteiro do Vale Serafim 3D (testes/navegador.mjs, 18–23/out/2026), que
   juntou as armadilhas anotadas na memória: abrir sem extensões, criar a própria aba, tocar
   com dispatchTouchEvent, teclas com windowsVirtualKeyCode e a pasta temporária do Edge
   dentro do perfil (sem isso, cada Edge novo deixava ~0,4 GB na Temp do Windows). Trazido
   para o Bruno Petri V2 em 25/out/2026, com a placa de vídeo de verdade (WebGPU), o mouse
   e a roda (a lição de 19/out: testar com o mouse, não só com o teclado) e os dedos (pinça).

   Para onde vai: scripts/fumaca.mjs (a conferência das páginas), scripts/og.mjs (as prévias
   de compartilhamento, BP-60) e os testes de cada tarefa. Uso:
     const nav = await abrirNavegador({ largura: 390, altura: 844, movel: true });
     await nav.ir("http://localhost:5291/galeria");  await nav.esperar(3000);
     await nav.foto("saida.png");  console.log(nav.erros);  await nav.fechar();

   Não precisa instalar nada: o Node 22+ já traz WebSocket e fetch. */

import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const EDGE = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find((p) =>
  fs.existsSync(p),
);

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Abre um Edge sem janela.
 * · gpu: true usa a placa de vídeo (WebGPU de verdade); false, o SwiftShader (lento, sem placa).
 * · movel: emula o celular (toque, tela pequena, devicePixelRatio).
 * · antes: um código que roda em toda página antes do site (ex.: relógio lento).
 */
export async function abrirNavegador({ largura = 1440, altura = 900, movel = false, dpr = 1, gpu = true, antes = "", porta = 9400 + Math.floor(Math.random() * 400) } = {}) {
  if (!EDGE) throw new Error("Edge não encontrado.");
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), "bp2-edge-"));
  const temp = path.join(perfil, "temp");
  fs.mkdirSync(temp, { recursive: true });
  const flags = [
    "--headless=new",
    `--remote-debugging-port=${porta}`,
    `--user-data-dir=${perfil}`,
    "--disable-extensions",
    "--disable-component-extensions-with-background-pages",
    "--disable-component-update",
    "--disable-background-networking",
    "--disable-sync",
    "--disable-default-apps",
    "--no-first-run",
    "--no-default-browser-check",
    "--mute-audio",
    `--window-size=${largura},${altura}`,
    ...(gpu ? ["--enable-unsafe-webgpu", "--ignore-gpu-blocklist", "--enable-gpu-rasterization"] : ["--enable-unsafe-swiftshader"]),
    "about:blank",
  ];
  const processo = spawn(EDGE, flags, { stdio: "ignore", env: { ...process.env, TMP: temp, TEMP: temp } });

  let versao = null;
  for (let i = 0; i < 60 && !versao; i++) {
    try {
      versao = await (await fetch(`http://127.0.0.1:${porta}/json/version`)).json();
    } catch {
      await dormir(250);
    }
  }
  if (!versao) {
    processo.kill();
    throw new Error("O Edge não respondeu na porta " + porta);
  }

  const aba = await (await fetch(`http://127.0.0.1:${porta}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(aba.webSocketDebuggerUrl);
  await new Promise((ok, falha) => {
    ws.onopen = ok;
    ws.onerror = falha;
  });

  let id = 0;
  const pendentes = new Map();
  const ouvintes = [];
  const consoleMsgs = [];
  const erros = [];
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pendentes.has(m.id)) {
      const { ok, falha } = pendentes.get(m.id);
      pendentes.delete(m.id);
      if (m.error) falha(new Error(m.error.message));
      else ok(m.result);
      return;
    }
    if (m.method === "Runtime.consoleAPICalled") {
      const texto = m.params.args.map((a) => a.value ?? a.description ?? "").join(" ");
      consoleMsgs.push(`${m.params.type}: ${texto}`);
      if (m.params.type === "error") erros.push(texto);
    }
    if (m.method === "Runtime.exceptionThrown") {
      const d = m.params.exceptionDetails;
      erros.push(`${d.exception?.description || d.text} (${d.url || ""}:${d.lineNumber})`);
    }
    if (m.method === "Log.entryAdded" && m.params.entry.level === "error") erros.push(`${m.params.entry.text} ${m.params.entry.url || ""}`);
    for (const f of ouvintes) f(m);
  };
  const cdp = (method, params = {}) =>
    new Promise((ok, falha) => {
      const n = ++id;
      pendentes.set(n, { ok, falha });
      ws.send(JSON.stringify({ id: n, method, params }));
    });

  await cdp("Page.enable");
  await cdp("Runtime.enable");
  await cdp("Log.enable");
  await cdp("Emulation.setDeviceMetricsOverride", { width: largura, height: altura, deviceScaleFactor: dpr, mobile: movel });
  if (movel) await cdp("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  if (antes) await cdp("Page.addScriptToEvaluateOnNewDocument", { source: antes });

  let mx = largura / 2,
    my = altura / 2;
  const nav = {
    cdp,
    console: consoleMsgs,
    erros,
    largura,
    altura,
    async ir(url) {
      const carregou = new Promise((ok) => {
        const f = (m) => {
          if (m.method === "Page.loadEventFired") {
            ouvintes.splice(ouvintes.indexOf(f), 1);
            ok();
          }
        };
        ouvintes.push(f);
      });
      await cdp("Page.navigate", { url });
      await Promise.race([carregou, dormir(30000)]);
    },
    esperar: dormir,
    /** espera até a expressão dar verdadeiro (ou o tempo acabar); devolve se deu */
    async ate(expr, ms = 20000) {
      const t0 = Date.now();
      while (Date.now() - t0 < ms) {
        try {
          if (await nav.avaliar(expr)) return true;
        } catch {
          /* a página ainda está nascendo */
        }
        await dormir(150);
      }
      return false;
    },
    /** avalia uma expressão na página e devolve o valor (as promessas são esperadas) */
    async avaliar(expr) {
      const r = await cdp("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    },
    /** o centro de um elemento (pelo seletor) e quem está de fato embaixo dele */
    async onde(sel) {
      return nav.avaliar(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null;
        const r = e.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2;
        const t = document.elementFromPoint(x, y);
        return { x, y, w: r.width, h: r.height, alvo: !!t && (t === e || e.contains(t)), por_cima: t ? (t.className || t.tagName) + '' : null }; })()`);
    },
    async foto(arquivo, { formato = "png", qualidade = 88, recorte } = {}) {
      const p = { format: formato };
      if (formato === "jpeg") p.quality = qualidade;
      if (recorte) p.clip = { ...recorte, scale: 1 };
      const r = await cdp("Page.captureScreenshot", p);
      fs.mkdirSync(path.dirname(arquivo), { recursive: true });
      fs.writeFileSync(arquivo, Buffer.from(r.data, "base64"));
      return arquivo;
    },
    /* ── o mouse, como uma pessoa: mover, esperar, apertar, soltar ── */
    async mover(x, y, passos = 6) {
      for (let i = 1; i <= passos; i++) {
        await cdp("Input.dispatchMouseEvent", { type: "mouseMoved", x: mx + ((x - mx) * i) / passos, y: my + ((y - my) * i) / passos, pointerType: "mouse" });
        await dormir(16);
      }
      mx = x;
      my = y;
    },
    async clicar(x, y) {
      await nav.mover(x, y);
      await dormir(250);
      await cdp("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", buttons: 1, clickCount: 1, pointerType: "mouse" });
      await dormir(60);
      await cdp("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", buttons: 0, clickCount: 1, pointerType: "mouse" });
    },
    /** clica no centro do elemento; falha se outro elemento estiver por cima */
    async clicarEm(sel) {
      const o = await nav.onde(sel);
      if (!o) throw new Error(`não achei ${sel}`);
      if (!o.alvo) throw new Error(`${sel}: o clique cairia em "${o.por_cima}"`);
      await nav.clicar(o.x, o.y);
      return o;
    },
    async arrastar(x1, y1, x2, y2, passos = 14) {
      await nav.mover(x1, y1, 3);
      await cdp("Input.dispatchMouseEvent", { type: "mousePressed", x: x1, y: y1, button: "left", buttons: 1, clickCount: 1, pointerType: "mouse" });
      for (let i = 1; i <= passos; i++) {
        await cdp("Input.dispatchMouseEvent", { type: "mouseMoved", x: x1 + ((x2 - x1) * i) / passos, y: y1 + ((y2 - y1) * i) / passos, button: "left", buttons: 1, pointerType: "mouse" });
        await dormir(16);
      }
      await cdp("Input.dispatchMouseEvent", { type: "mouseReleased", x: x2, y: y2, button: "left", buttons: 0, clickCount: 1, pointerType: "mouse" });
      mx = x2;
      my = y2;
    },
    /** um dente da roda (deltaY 100 desce), com pausa, como quem rola devagar */
    async roda(x, y, deltaY = 100, pausa = 160) {
      await cdp("Input.dispatchMouseEvent", { type: "mouseWheel", x, y, deltaX: 0, deltaY, pointerType: "mouse" });
      await dormir(pausa);
    },
    /* ── os dedos ── */
    async tocar(x, y) {
      await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 1 }] });
      await dormir(60);
      await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    },
    async deslizar(x1, y1, x2, y2, passos = 12) {
      await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x1, y: y1, id: 1 }] });
      for (let i = 1; i <= passos; i++) {
        await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x1 + ((x2 - x1) * i) / passos, y: y1 + ((y2 - y1) * i) / passos, id: 1 }] });
        await dormir(16);
      }
      await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    },
    /** dois dedos que se afastam (fator > 1) ou se aproximam (< 1), em volta de (x, y) */
    async pinca(x, y, d0 = 60, fator = 2, passos = 12) {
      const pts = (d) => [
        { x: x - d / 2, y, id: 1 },
        { x: x + d / 2, y, id: 2 },
      ];
      await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: pts(d0) });
      for (let i = 1; i <= passos; i++) {
        await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: pts(d0 * (1 + ((fator - 1) * i) / passos)) });
        await dormir(16);
      }
      await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    },
    async tecla(key, code, keyCode, modificadores = 0) {
      await cdp("Input.dispatchKeyEvent", { type: "keyDown", key, code, windowsVirtualKeyCode: keyCode, modifiers: modificadores, text: key.length === 1 ? key : undefined });
      await cdp("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: keyCode, modifiers: modificadores });
    },
    async fechar() {
      try {
        await fetch(`http://127.0.0.1:${porta}/json/close/${aba.id}`);
      } catch {
        /* já fechou */
      }
      try {
        ws.close();
      } catch {
        /* idem */
      }
      processo.kill();
      for (let i = 0; i < 15 && processo.exitCode === null && processo.signalCode === null; i++) await dormir(200);
      await dormir(300);
      try {
        fs.rmSync(perfil, { recursive: true, force: true, maxRetries: 6, retryDelay: 250 });
      } catch {
        /* o Edge às vezes segura arquivos por um instante */
      }
    },
  };
  return nav;
}

/** as teclas mais usadas, com o código que o Windows espera */
export const TECLAS = {
  direita: ["ArrowRight", "ArrowRight", 39],
  esquerda: ["ArrowLeft", "ArrowLeft", 37],
  cima: ["ArrowUp", "ArrowUp", 38],
  baixo: ["ArrowDown", "ArrowDown", 40],
  enter: ["Enter", "Enter", 13],
  esc: ["Escape", "Escape", 27],
  tab: ["Tab", "Tab", 9],
};
