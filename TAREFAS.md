# Bruno Petri V2 — tarefas, prompts, controles e melhorias

> O painel de trabalho deste projeto. Você acrescenta, eu faço, e os dois vamos riscando. Criado em 11/out/2026 na V1; a **V2** (esta pasta, `D:\www\bruno-petri-2027-V2`) nasceu em 25/out/2026 como cópia da V1, com o histórico do git, para passar por todos os itens daqui, um por um. O que existe e como roda está no `README.md`; aqui fica o que foi feito, o que falta e como pedir.

**Código:** https://github.com/vpdemantova/bruno-petri-2027-V2 (público, como o da V1) · **No ar:** ainda não (ver a BP-80: só com o "pode" seu e do Bruno) · **A V1** continua intacta em `D:\www\bruno-petri-2027`.

## Como usar

- **Para pedir uma tarefa, diga o número:** "faz a BP-12", "faz as BP-20 a BP-24", "faz todas as P1 de Conteúdo". O prompt pronto de cada uma está logo abaixo dela; dá para copiar e mudar.
- **Para acrescentar uma ideia:** escreva uma linha na categoria certa, com o próximo número livre (o último em uso está no fim da página). Pode ser em português corrido, do seu jeito; eu completo o porquê e o prompt quando for fazer.
- **Situação:**
  - `[ ]` a fazer;
  - `[~]` em andamento;
  - `[x]` feita (com a data);
  - `[-]` descartada (com o motivo).
- **Prioridade:** **P1** faz diferença já, **P2** melhora bem, **P3** quando der.
- **Tamanho:** *pequena* (minutos), *média* (uma sessão), *grande* (várias sessões, ou precisa de decisão sua ou do Bruno).

---

## 1. Controles

### Comandos
| O quê | Comando | Onde |
|---|---|---|
| Rodar no computador | `npm run dev` | http://localhost:5200 |
| Testar o WebGL2 (sem WebGPU) | o mesmo, com `?webgl` | http://localhost:5200/?webgl |
| Pular a abertura | `?semabertura` | http://localhost:5200/galeria?semabertura |
| Abrir em inglês | `?lang=en` | |
| Conferir os tipos | `npm run typecheck` | |
| Gerar a versão final | `npm run build` | sai em `dist/` |
| Ver a versão final | `npm run preview` | http://localhost:5201 |
| Ver no celular, na mesma rede | `npx vite --host` | o endereço "Network" que aparecer |

### Antes de dar uma tarefa por pronta
- [ ] `npm run build` sem erro (ele já confere os tipos).
- [ ] Olhar em **1440 px** e em **390 px** (F12 → modo dispositivo), sem rolagem para os lados.
- [ ] Olhar com `?webgl`.
- [ ] Só pelo teclado: Tab, setas, Enter e Esc fazem tudo (Spyglass: ← → e 1–6; carrossel: ↑ ↓ e Enter).
- [ ] Com **reduzir movimento** ligado: as obras não giram sozinhas, nada voa entre as páginas e o texto só troca.
- [ ] Console do navegador sem erro vermelho.
- [ ] **Nada inventado**: preço, medida, exposição, e-mail e Instagram só com a palavra do Bruno.

### O que não fazer
- Publicar (push, deploy) sem você pedir.
- Pôr preço ou prazo na loja sem o Bruno dizer.
- Tirar a marca "estudo" de uma forma que o Bruno não confirmou.

---

## 2. Conteúdo (o que depende do Bruno)

- [ ] **BP-01** · [P1 · média] **Confirmar as obras.**
  - Das 20 esculturas e luminárias, 4 são dele, porque estão nas telas: Cruz Fractal, Molécula, Tríade e Coroa. As outras 16 são estudos meus, de geometria e proporção.
  - A pergunta para ele: quais estudos ficam, quais saem e quais ele quer fazer de verdade.
  - A situação de cada uma também é palpite. Só a Cruz Fractal está "disponível", porque a tela diz; as outras três estão "sob consulta".

  - *25/out/2026:* a mensagem pronta para mandar a ele, com todas as perguntas, está em `PERGUNTAS-AO-BRUNO.md`.

  *Prompt:* "faz a BP-01: o Bruno confirmou [lista]; tira [lista]; a situação de cada uma é [lista]."
- [~] **BP-02** · [P1 · média] **As pinturas e mandalas de verdade.** As 8 pinturas e as 4 mandalas são geradas por código, no lugar das dele. *25/out/2026: o caminho está pronto; faltam as fotos.*
  - **Como entra uma foto:** o arquivo em `media/obras/<endereço>.jpg` (o nome é o endereço da obra, sem acento: `media/obras/sol-de-dentro.jpg`), depois `npm run fotos`. O roteiro (`scripts/fotos.mjs`, com o sharp) gira pela orientação da câmera, converte para sRGB e grava `public/obras/<nome>-640.webp`, `-1280` e `-2400` (nunca maior que o original), mais as medidas e a cor média em `src/data/fotos.json`. Só refaz o que mudou. A pasta `media/` fica fora do git (os originais são pesados).
  - **Na obra** (`src/data/works.ts`): `kind: { type: "photo", src: "sol-de-dentro", w: 80, h: 100 }` (w e h em cm; `round: true` para tela redonda, `paper: true` para papel). No 3D, a foto vira a frente do quadro, com o lado e a espessura de sempre (`src/three/piece.ts`); na grade e na loja, uma `<img>` com `srcset`, que o navegador carrega na largura certa e só quando aparece (`src/ui/FlatThumb.tsx`).
  - Conferido em 25/out com uma foto de teste: a grade, a página da obra e o 3D (depois tirada).

  *Prompt:* "faz a BP-02 com estas fotos: [anexos, com nome, ano, técnica e medidas de cada uma]."
- [ ] **BP-03** · [P1 · pequena] **E-mail e Instagram do Bruno.**
  - Vão em `src/data/artist.ts`.
  - Com eles:
    - os botões EMAIL e INSTAGRAM passam a funcionar;
    - a lista de interesse ganha "Enviar por e-mail";
    - o aviso amarelo some.

  *Prompt:* "faz a BP-03: e-mail [x], Instagram [y]."
- [ ] **BP-04** · [P2 · média] **Os textos dele.** Hoje o texto de cada obra descreve a forma. O ideal é a voz do artista: a intenção, a história, o processo. Mande o texto de cada uma, mesmo em rascunho, que eu ajusto e traduzo.
  *Prompt:* "faz a BP-04: o texto da Cruz Fractal é […]; o da Molécula é […]."
- [~] **BP-05** · [P2 · pequena] **Medidas e materiais reais.** *25/out/2026: os campos existem; faltam os dados.* Cada obra aceita `dims` (as medidas exatas, "120 × 120 × 30 cm", que aparecem no lugar do "1.2m" na ficha e no Spyglass) e `medium` (a técnica nas palavras dele: "óleo sobre tela", "mármore Bardiglio"). Sem `medium`, a obra plana mostra a técnica do desenho gerado (óleo sobre tela; ouro sobre preto), num lugar só (`mediumOf` em `src/data/works.ts`), que antes dizia coisas diferentes na ficha e na loja.
  *Prompt:* "faz a BP-05: Cruz Fractal 120 × 120 × 30 cm, mármore Bardiglio; …"
- [~] **BP-06** · [P2 · média] **Bio completa.** Exposições, prêmios e acervos, com ano e lugar. Só entra o que ele confirmar. *25/out/2026: a seção "Exposições e acervos" da página Sobre está pronta e escondida:* aparece sozinha quando a lista `cv` em `src/data/artist.ts` tiver linhas (ano, tipo, título nas duas línguas, lugar e cidade; a mais recente primeiro). Conferida com duas linhas de teste em 1440 e 390 px.
  *Prompt:* "faz a BP-06: 2019, individual, [título], [lugar], [cidade]; …"
- [~] **BP-07** · [P3 · média] **Foto ao lado do 3D.** *25/out/2026: pronta; falta a foto.* Uma foto em `media/obras/cruz-fractal--1.jpg` (e `--2`, `--3`… para mais), depois `npm run fotos`, e a página da obra ganha "3D | Foto" no canto do cartão, com pontos para trocar de foto. Sem foto, nada aparece. Conferida com duas fotos de teste e o mouse de verdade.

## 3. Design e interface (fidelidade às telas)

- [ ] **BP-10** · [P1 · média] **Modo comparação.** `?ref=10` põe a tela de referência por cima do site, meio transparente, para conferir medida por medida (como a VP-10).
  - As telas ficariam em `public/ref/`.
  - *Sugestão:* um componente `<RefOverlay>` em `App.tsx`, com uma `<img>` em `position: fixed; inset: 0; opacity: .5; pointer-events: none`, que alterna com a tecla `R`.

  *Prompt:* "faz a BP-10: modo comparação com as 10 telas."
- [ ] **BP-11** · [P2 · pequena] **Logotipo como desenho.** O "bruno petri" usa a fonte Lexend e o "n" desenhado. Convertido em SVG puro (os contornos das letras), ele:
  - fica idêntico em qualquer navegador;
  - pode virar favicon, imagem de compartilhamento e assinatura de e-mail.
- [ ] **BP-12** · [P2 · pequena] **Cursor das obras.** Sobre uma obra que gira, um círculo com "arraste" no lugar da mãozinha; ao arrastar, o círculo encolhe.
- [ ] **BP-13** · [P2 · média] **Página de cada série.** "Sistemas integrados cúbicos", "proporção áurea", "sólidos sagrados"…: cada uma com o texto da ideia e as obras dela.
- [ ] **BP-14** · [P3 · média] **Galeria noturna.** Um botão de lua apaga a página e só as luminárias acendem (a luz das obras já existe: `lampPower`).

## 4. Experiência (UX)

- [ ] **BP-20** · [P1 · pequena] **Pinça no celular.** No Spyglass, aproximar com dois dedos (hoje é só a roda do mouse).
  - *Sugestão:* em `Slot.bindPointer`, guardar os dois `pointerId` e mudar `rig.zoom.to` pela razão entre as distâncias.

  *Prompt:* "faz a BP-20."
- [ ] **BP-21** · [P2 · pequena] **Material no endereço.** `/portal?material=madeira.nogueira.brilhante` abre a obra com o material escolhido, para mandar a alguém "assim que eu quero".
- [ ] **BP-22** · [P2 · média] **Comparar materiais.** Na página da obra, a vista se divide ao meio, com o material A à esquerda e o B à direita, e uma linha que se arrasta.
- [ ] **BP-23** · [P2 · pequena] **Lembrar o ângulo.** Voltar à galeria deixa o carrossel na obra em que se estava (já lembra o índice; falta lembrar o filtro e a rolagem da grade).
- [ ] **BP-24** · [P3 · grande] **Ver na sua sala (realidade aumentada).** Exportar a obra em GLB e abrir no celular com o `<model-viewer>` (AR Quick Look no iPhone, Scene Viewer no Android).

## 5. O 3D (o coração do projeto)

- [ ] **BP-30** · [P1 · média] **Luz mais fotográfica no Spyglass.** Oclusão de ambiente (GTAO) e um brilho leve (bloom) nas luminárias, só na vista grande, com o `PostProcessing` do three em TSL. As vistas pequenas ficam como estão.
- [ ] **BP-31** · [P2 · pequena] **Arestas chanfradas.** Arestas vivas parecem computação gráfica. Um chanfro de 1 a 2 mm pega a luz, como na pedra de verdade.
  - *Sugestão:* trocar `BoxGeometry` por `RoundedBoxGeometry` (em `three/addons`) com raio de 0,004 e 2 segmentos, nas peças grandes.
- [ ] **BP-32** · [P2 · média] **Exportar para impressão 3D.** Um botão (só para o Bruno, com `?ateliê`) que baixa a escultura em STL ou GLB, no tamanho real, para maquete ou impressão.
- [ ] **BP-33** · [P2 · grande] **Ateliê de formas.** Uma página com controles (proporção, número de molduras, ângulo, espessura) que gera variações de uma forma. **O desenho final é dele:** a ferramenta só propõe.
- [ ] **BP-34** · [P2 · pequena] **Mármore ainda mais fino.** De muito perto, os veios ficam macios, porque a textura de ruído tem 64³. Duas saídas: subir para 96³ (3,5 MB, um pouco mais de abertura) ou somar uma oitava a mais nos veios capilares.
- [ ] **BP-35** · [P3 · média] **Vidro com refração.** Hoje o vidro é transparente com a borda mais forte, porque o canvas é transparente. No Spyglass dá para usar a refração de verdade (`transmission`) com um fundo pintado.

## 6. Desempenho

- [ ] **BP-40** · [P1 · pequena] **three.js em pedaço próprio.** O pacote tem 1,3 MB (390 KB compactados) num arquivo só. Separar o three num pedaço que o navegador guarda em cache entre as versões, e carregar a interface primeiro.
- [ ] **BP-41** · [P1 · pequena] **Medir num celular de verdade** (um Android médio). Quanto tempo a abertura leva e quantos quadros por segundo dá o Spyglass. Se precisar, baixar o teto de resolução das vistas no celular.
- [ ] **BP-42** · [P2 · pequena] **Ruído numa worker.** A textura 3D é calculada em ~100 ms na linha principal. Numa worker, a animação da abertura não engasga.

## 7. Acessibilidade

- [ ] **BP-50** · [P1 · média] **Leitor de tela.** Testar com o NVDA (Windows) e o TalkBack (Android). Cada obra 3D já tem nome e material como texto; falta conferir os anúncios do carrossel e da lista.
- [ ] **BP-51** · [P2 · pequena] **Contraste do texto cinza.** O cinza dos parágrafos (`#a6a6a6` sobre preto) passa; o `#8c8c8c` das fichas fica perto do limite. Conferir e subir um tom, se precisar.

## 8. SEO e compartilhamento

- [ ] **BP-60** · [P1 · média] **Imagem de compartilhamento por obra.** Quando alguém manda o link `/cruz-fractal`, aparece a foto da obra. Um script de build que abre o site no navegador sem janela e fotografa cada obra (o mesmo jeito dos testes).
- [ ] **BP-61** · [P2 · pequena] **sitemap.xml e robots.txt**, e o título de cada página no HTML inicial (pré-renderizado), para os buscadores.

## 9. Código e organização

- [x] **BP-70** · [P2 · pequena] **Testes da geometria.** *25/out/2026.* `npm test` (Vitest) gera cada uma das 21 formas no Node e confere: triângulos, nenhum número inválido, normais de comprimento 1, o centro na origem e o raio 1; as formas espelhadas (Cruz Fractal, Molécula, Ninho, Hipercubo, Dodecaedro) procuram o espelho de cada vértice; e a contagem de triângulos de cada forma fica guardada em `src/three/__snapshots__/` (mudou uma forma de propósito? `npx vitest run -u` e conferir a diferença no git). Também o catálogo (`src/data/works.test.ts`): endereços únicos, as duas línguas, material padrão válido, "estudo é estudo", e cada endereço do site.
  - **O teste já achou um defeito:** no Dodecaedro, a seção quadrada de cada barra girava de um jeito (o giro saía do `setFromUnitVectors`), e a forma não era simétrica de verdade. Agora `bar()` aceita a direção de uma face (`src/three/geometry.ts`): as barras do Dodecaedro, da Estrela Tetraédrica, do Prisma e do Hipercubo olham para fora, todas iguais.
- [x] **BP-72** · [P1 · pequena] **Uma conferência só: `npm run check`.** *25/out/2026.* Tipos (`tsc`), lint (`eslint .`, as regras recomendadas e as dos hooks do React, `eslint.config.js`) e testes, numa linha. Roda também no GitHub a cada envio (`.github/workflows/ci.yml`, aba Actions) e na Vercel antes de publicar (`vercel.json`, que já tem o cache longo dos arquivos com hash).
- [ ] **BP-71** · [P3 · pequena] **Repartir o `ui/kit.tsx`** em arquivos (Nav, LangSwitch, Dropdown…) quando crescer.

## 10. Publicação

- [ ] **BP-80** · [P1 · pequena] **Domínio e Vercel.** Confirmar com o Bruno o domínio (as telas mostram brunopetri.com), criar o repositório e o projeto na Vercel (passo a passo no `README.md`). **Só com o "pode" de vocês dois.**
- [ ] **BP-81** · [P2 · grande] **Loja de verdade.** Preços, frete e pagamento (Mercado Pago ou Stripe), se e quando o Bruno quiser vender pelo site. Hoje a loja é uma lista de interesse por e-mail, de propósito.

## 11. Ideias grandes

- **BP-90** · **Exposição virtual.** Uma sala 3D (como a Casa do Jadesun) com as obras nos pedestais e a luz do dia passando; o visitante anda e para diante de cada uma.
- **BP-91** · **Mandala ao vivo.** O visitante escolhe a simetria (5, 6, 8, 12) e desenha; o compasso repete o traço em volta. Dá para baixar a mandala.
- **BP-92** · **Edições impressas.** Pequenas edições numeradas das esculturas em impressão 3D (resina ou cerâmica), a partir dos mesmos geradores.

## 12. Prompts prontos

- "faz todas as P1 que não dependem do Bruno" (BP-10, BP-20, BP-30, BP-40, BP-41, BP-50, BP-60).
- "o Bruno mandou [fotos/textos/contatos]: encaixa onde for (BP-01 a BP-06)."
- "confere o site inteiro pela lista de conferência e me diz o que quebrou."
- "uma escultura nova: [descrição, ou foto, ou desenho], no gerador, com material [x]."

## 13. Registro

| Data | O quê | Onde |
|---|---|---|
| 11/out/2026 | Site construído: as 10 telas, mais a Loja e a página Sobre; 20 esculturas e luminárias em 3D, com 6 famílias e 53 variações de material; 8 pinturas e 4 mandalas geradas; WebGPU e WebGL2; desktop e celular; abertura; transições com o painel e as obras voando | todo o projeto |

**Último número em uso:** BP-92.
