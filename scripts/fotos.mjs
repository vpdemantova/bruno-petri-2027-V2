/* fotos.mjs — as fotos das obras de verdade, prontas para o site (BP-02 e BP-07).

   De onde veio: o pedido da V1 (TAREFAS.md, BP-02: "as pinturas e mandalas de verdade, em
   WebP de até 2400 px") e o "npm run images" do Vitor Petri V2; escrito em 25/out/2026.

   Como usar:
     1. ponha as fotos em media/obras/ (jpg, png, webp ou tif), com o nome do endereço da obra:
          media/obras/cruz-fractal--1.jpg   foto da escultura (aparece em "foto | 3D", BP-07);
                                            --1, --2… são as fotos seguintes da mesma obra
          media/obras/nome-da-pintura.jpg   a pintura ou mandala (BP-02): a obra em
                                            src/data/works.ts ganha kind { type: "photo", src: "nome-da-pintura", … }
     2. npm run fotos
   Sai em public/obras/<nome>-<largura>.webp (640, 1280 e 2400 px, nunca maior que o original)
   e as medidas em src/data/fotos.json, que o site lê. Só refaz o que mudou (pela data do arquivo).
   A pasta media/ fica fora do git (os originais são pesados); o que vai ao ar é public/obras/.

   Para onde vai: src/data/fotos.ts (quem lê o JSON), o 3D (a foto vira a frente do quadro) e as
   miniaturas (srcset). */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ORIGEM = "media/obras";
const DESTINO = "public/obras";
const MEDIDAS = "src/data/fotos.json";
const LARGURAS = [640, 1280, 2400];

if (!fs.existsSync(ORIGEM)) {
  fs.mkdirSync(ORIGEM, { recursive: true });
  console.log(`Criei ${ORIGEM}/. Ponha as fotos lá (o nome do arquivo é o endereço da obra) e rode de novo.`);
  process.exit(0);
}
fs.mkdirSync(DESTINO, { recursive: true });
const antes = fs.existsSync(MEDIDAS) ? JSON.parse(fs.readFileSync(MEDIDAS, "utf8")) : {};
const medidas = {};
const arquivos = fs.readdirSync(ORIGEM).filter((f) => /\.(jpe?g|png|webp|tiff?)$/i.test(f));
let feitas = 0;

for (const f of arquivos) {
  const nome = f.replace(/\.[^.]+$/, "").toLowerCase();
  if (!/^[a-z0-9-]+$/.test(nome)) {
    console.warn(`  pulei "${f}": o nome deve ter só letras sem acento, números e hífen (o endereço da obra).`);
    continue;
  }
  const src = path.join(ORIGEM, f);
  const mtime = Math.round(fs.statSync(src).mtimeMs);
  const velho = antes[nome];
  const saidas = (larguras) => larguras.map((l) => path.join(DESTINO, `${nome}-${l}.webp`));
  if (velho && velho.mtime === mtime && saidas(velho.larguras).every((s) => fs.existsSync(s))) {
    medidas[nome] = velho;
    continue;
  }
  // a orientação da câmera (EXIF) vira giro de verdade, e o perfil de cor vira sRGB
  const base = sharp(src, { limitInputPixels: 400e6 }).rotate();
  const meta = await base.metadata();
  const giro = meta.orientation && meta.orientation >= 5;
  const W = giro ? meta.height : meta.width, H = giro ? meta.width : meta.height;
  const larguras = LARGURAS.filter((l) => l < W);
  larguras.push(Math.min(W, LARGURAS[LARGURAS.length - 1]));
  const unicas = [...new Set(larguras)].sort((a, b) => a - b);
  for (const l of unicas) {
    await base.clone().resize({ width: l, withoutEnlargement: true }).toColorspace("srgb").webp({ quality: 82, effort: 5 }).toFile(path.join(DESTINO, `${nome}-${l}.webp`));
  }
  // a cor média (o fundo enquanto a foto carrega)
  const { dominant } = await base.clone().resize(64).stats();
  medidas[nome] = { w: W, h: H, larguras: unicas, cor: `#${[dominant.r, dominant.g, dominant.b].map((c) => c.toString(16).padStart(2, "0")).join("")}`, mtime };
  feitas++;
  console.log(`  ${nome}: ${W}×${H} → ${unicas.join(", ")} px`);
}

// as que saíram de media/ saem também do site
for (const nome of Object.keys(antes)) {
  if (medidas[nome]) continue;
  for (const l of antes[nome].larguras) fs.rmSync(path.join(DESTINO, `${nome}-${l}.webp`), { force: true });
  console.log(`  ${nome}: tirada (não está mais em ${ORIGEM}/)`);
}

const ordenado = Object.fromEntries(Object.keys(medidas).sort().map((k) => [k, medidas[k]]));
fs.writeFileSync(MEDIDAS, JSON.stringify(ordenado, null, 2) + "\n");
console.log(`${arquivos.length} fotos, ${feitas} refeitas. Medidas em ${MEDIDAS}.`);
