/* ════════════════════════════════════════════════════════════════════
   AS OBRAS (11/out/2026).

   origem:
   · "obra"   — as que estão nas telas de referência: a Cruz Fractal (o
                mármore, 1,2 m, disponível, "sistemas integrados cúbicos"),
                a Molécula, a Tríade (o triângulo branco) e a Coroa (o anel
                com as aletas, cor de areia);
   · "estudo" — formas novas, desenhadas por geometria e proporção para
                mostrar o repertório (pedido: "invente e crie novas formas,
                use a geometria e a proporção para criar esculturas"), e as
                pinturas e mandalas geradas, que ficam no lugar das do artista
                até ele mandar as de verdade. A interface mostra "estudo".
   Antes de publicar: trocar ou confirmar cada estudo com o artista
   (TAREFAS.md, BP-01).

   Cada escultura nasce de um gerador (src/three/sculptures.ts) e de um
   material (src/three/materials.ts), que o visitante pode trocar na página
   da obra. As pinturas e as mandalas são geradas em src/three/flat.ts.
════════════════════════════════════════════════════════════════════ */

export type Lang = "pt" | "en";
export type T = Record<Lang, string>;
export type Category = "escultura" | "luminaria" | "pintura" | "mandala";
export type Family = "marmore" | "madeira" | "vidro" | "gesso" | "metal" | "laca";
export type Finish = "fosco" | "acetinado" | "brilhante";

export interface MaterialChoice { family: Family; variant: string; finish?: Finish }

export type GenId =
  | "cruz-fractal" | "molecula" | "triade" | "coroa" | "espiral-aurea" | "coluna-aurea"
  | "estrela-tetraedrica" | "octaedro-estrelado" | "dodecaedro" | "esfera-armilar" | "flor-da-vida"
  | "mandala-cubica" | "hipercubo" | "portal" | "ninho" | "arcos" | "torre-raiz2"
  | "lanterna-cubica" | "halo" | "prisma" | "amostra";

export type Kind =
  | { type: "sculpture"; gen: GenId }
  | { type: "painting"; style: "campos" | "geometria" | "gestos" | "horizonte" | "radial"; seed: number; w: number; h: number; round?: boolean }
  | { type: "mandala"; seed: number; folds: number }
  /** uma obra plana fotografada (BP-02): src é o nome em src/data/fotos.json (npm run fotos); w e h em centímetros */
  | { type: "photo"; src: string; w: number; h: number; round?: boolean; paper?: boolean };

export interface Work {
  slug: string;
  title: T;
  category: Category;
  series: T;
  kind: Kind;
  material?: MaterialChoice;
  /** as famílias de material que a obra aceita no configurador */
  families?: Family[];
  /** o tamanho (o maior lado), como nas telas: "1.2m" */
  size: string;
  /** as medidas exatas, quando o artista disser (BP-05): "120 × 120 × 30 cm" */
  dims?: string;
  /** a técnica, nas palavras do artista (BP-05): "óleo sobre tela", "mármore Bardiglio" */
  medium?: T;
  origin: "obra" | "estudo";
  status: "disponivel" | "consulta" | "estudo";
  text: Record<Lang, string[]>;
}

const ALL: Family[] = ["marmore", "madeira", "vidro", "gesso", "metal", "laca"];
const S = (pt: string, en: string): T => ({ pt, en });

const SERIES = {
  cubicos: S("sistemas integrados cúbicos", "integrated cubic systems"),
  aurea: S("proporção áurea", "golden proportion"),
  solidos: S("sólidos sagrados", "sacred solids"),
  orbitas: S("anéis e órbitas", "rings and orbits"),
  paradoxos: S("paradoxos", "paradoxes"),
  raiz: S("raiz de dois", "root of two"),
  luz: S("luz geométrica", "geometric light"),
  oleos: S("óleos abstratos", "abstract oils"),
  mandalas: S("mandalas", "mandalas"),
};

export const WORKS: Work[] = [
  {
    slug: "cruz-fractal", title: S("Cruz Fractal", "Fractal Cross"), category: "escultura", series: SERIES.cubicos,
    kind: { type: "sculpture", gen: "cruz-fractal" }, material: { family: "marmore", variant: "bardiglio" }, families: ALL,
    size: "1.2m", origin: "obra", status: "disponivel",
    text: {
      pt: ["Duas vigas de seção quadrada se cruzam no centro. Em cada quadrante, uma moldura em losango atravessa as vigas e encosta na face oposta: a cruz se repete dentro dela mesma, em escala e em giro.",
        "Feita de um só bloco de mármore, a peça foi pensada para ser vista de todos os lados: de frente é um ícone plano; de lado, um entrelaçado de volumes."],
      en: ["Two square-section beams cross at the centre. In each quadrant, a diamond frame passes through the beams and touches the far face: the cross repeats inside itself, in scale and in rotation.",
        "Carved from a single block of marble, the piece is meant to be seen from every side: from the front it is a flat icon; from the side, an interlacing of volumes."],
    },
  },
  {
    slug: "molecula", title: S("Molécula", "Molecule"), category: "escultura", series: SERIES.cubicos,
    kind: { type: "sculpture", gen: "molecula" }, material: { family: "marmore", variant: "bardiglio-claro" }, families: ALL,
    size: "1.0m", origin: "obra", status: "consulta",
    text: {
      pt: ["A Cruz Fractal levada aos três eixos: três vigas ortogonais e doze molduras em losango, uma em cada plano e quadrante. De qualquer ângulo, ela mostra uma cruz.",
        "É a peça para girar devagar: os vazios das molduras se alinham e se desalinham, como átomos num retículo."],
      en: ["The Fractal Cross taken to three axes: three orthogonal beams and twelve diamond frames, one in each plane and quadrant. From any angle, it shows a cross.",
        "It is the piece to turn slowly: the voids of the frames align and misalign, like atoms in a lattice."],
    },
  },
  {
    slug: "triade", title: S("Tríade", "Triad"), category: "escultura", series: SERIES.paradoxos,
    kind: { type: "sculpture", gen: "triade" }, material: { family: "gesso", variant: "branco" }, families: ALL,
    size: "0.8m", origin: "obra", status: "consulta",
    text: {
      pt: ["Três barras de seção quadrada formam um triângulo que parece impossível: cada lado sobe um degrau e se apoia no seguinte, em simetria de três.",
        "Em gesso, a luz desenha as arestas e a sombra explica o que o olho estranha."],
      en: ["Three square-section bars form a triangle that looks impossible: each side climbs one step and rests on the next, in threefold symmetry.",
        "In plaster, the light draws the edges and the shadow explains what the eye finds strange."],
    },
  },
  {
    slug: "coroa", title: S("Coroa", "Crown"), category: "escultura", series: SERIES.orbitas,
    kind: { type: "sculpture", gen: "coroa" }, material: { family: "gesso", variant: "areia" }, families: ALL,
    size: "0.9m", origin: "obra", status: "consulta",
    text: {
      pt: ["Um anel baixo e, em volta dele, vinte e quatro aletas curvas cuja altura sobe e desce numa onda: uma coroa, ou um anfiteatro visto de longe.",
        "A ondulação tem três cristas, e cada aleta gira um pouco em relação à vizinha."],
      en: ["A low ring and, around it, twenty-four curved fins whose height rises and falls in a wave: a crown, or an amphitheatre seen from afar.",
        "The wave has three crests, and each fin turns slightly from its neighbour."],
    },
  },
  {
    slug: "espiral-aurea", title: S("Espiral Áurea", "Golden Spiral"), category: "escultura", series: SERIES.aurea,
    kind: { type: "sculpture", gen: "espiral-aurea" }, material: { family: "madeira", variant: "nogueira", finish: "acetinado" }, families: ALL,
    size: "0.9m", origin: "estudo", status: "estudo",
    text: {
      pt: ["Nove molduras quadradas, cada uma inscrita na anterior: os cantos da menor dividem os lados da maior na razão áurea (1 : 1,618). A cada passo a moldura gira cerca de 32° e recua um pouco, e os cantos desenham uma espiral.",
        "O vazio do centro é o ponto para onde todas as molduras convergem."],
      en: ["Nine square frames, each inscribed in the one before: the corners of the smaller divide the sides of the larger in the golden ratio (1 : 1.618). At each step the frame turns about 32° and steps back a little, and the corners draw a spiral.",
        "The void at the centre is the point towards which every frame converges."],
    },
  },
  {
    slug: "coluna-aurea", title: S("Coluna Áurea", "Golden Column"), category: "escultura", series: SERIES.aurea,
    kind: { type: "sculpture", gen: "coluna-aurea" }, material: { family: "marmore", variant: "calacatta" }, families: ALL,
    size: "1.6m", origin: "estudo", status: "estudo",
    text: {
      pt: ["Vinte e uma lâminas quadradas empilhadas, cada uma girada 137,5° (o ângulo áureo, o das folhas e sementes) em relação à de baixo. A coluna se torce sem se repetir.",
        "A largura das lâminas respira devagar ao longo da altura."],
      en: ["Twenty-one square slabs stacked, each turned 137.5° (the golden angle, that of leaves and seeds) from the one below. The column twists without ever repeating.",
        "The width of the slabs breathes slowly along the height."],
    },
  },
  {
    slug: "estrela-tetraedrica", title: S("Estrela Tetraédrica", "Star Tetrahedron"), category: "escultura", series: SERIES.solidos,
    kind: { type: "sculpture", gen: "estrela-tetraedrica" }, material: { family: "vidro", variant: "ambar" }, families: ALL,
    size: "0.7m", origin: "estudo", status: "estudo",
    text: {
      pt: ["Dois tetraedros de arestas, um apontando para cima e outro para baixo, atravessados um no outro: os vértices desenham um cubo invisível.",
        "Em vidro, as arestas de trás aparecem pelas da frente."],
      en: ["Two edge tetrahedra, one pointing up and one down, passing through each other: their vertices draw an invisible cube.",
        "In glass, the back edges show through the front ones."],
    },
  },
  {
    slug: "octaedro-estrelado", title: S("Octaedro Estrelado", "Stellated Octahedron"), category: "escultura", series: SERIES.solidos,
    kind: { type: "sculpture", gen: "octaedro-estrelado" }, material: { family: "marmore", variant: "nero" }, families: ALL,
    size: "0.6m", origin: "estudo", status: "estudo",
    text: {
      pt: ["Um octaedro com uma pirâmide em cada face: a estrela de oito pontas que nasce quando dois tetraedros sólidos se fundem.",
        "No mármore negro, os veios brancos atravessam as faces de ponta a ponta."],
      en: ["An octahedron with a pyramid on each face: the eight-pointed star born when two solid tetrahedra fuse.",
        "In black marble, the white veins cross the faces from point to point."],
    },
  },
  {
    slug: "dodecaedro", title: S("Dodecaedro", "Dodecahedron"), category: "escultura", series: SERIES.solidos,
    kind: { type: "sculpture", gen: "dodecaedro" }, material: { family: "metal", variant: "latao" }, families: ALL,
    size: "0.6m", origin: "estudo", status: "estudo",
    text: {
      pt: ["As trinta arestas do dodecaedro, o sólido de doze pentágonos, em barras finas: uma gaiola onde a proporção áurea aparece em cada face.",
        "Em latão, cada barra pega a luz de um jeito."],
      en: ["The thirty edges of the dodecahedron, the solid of twelve pentagons, in slender bars: a cage where the golden ratio appears on every face.",
        "In brass, each bar catches the light differently."],
    },
  },
  {
    slug: "esfera-armilar", title: S("Esfera Armilar", "Armillary Sphere"), category: "escultura", series: SERIES.orbitas,
    kind: { type: "sculpture", gen: "esfera-armilar" }, material: { family: "metal", variant: "bronze" }, families: ALL,
    size: "0.8m", origin: "estudo", status: "estudo",
    text: {
      pt: ["Seis anéis de seção quadrada, todos do mesmo raio, girados em volta do mesmo centro: os círculos máximos de uma esfera que não está lá.",
        "A referência é o instrumento antigo dos astrônomos, sem os números."],
      en: ["Six square-section rings, all of the same radius, turned around the same centre: the great circles of a sphere that is not there.",
        "The reference is the old instrument of astronomers, without the numbers."],
    },
  },
  {
    slug: "flor-da-vida", title: S("Flor da Vida", "Flower of Life"), category: "escultura", series: SERIES.orbitas,
    kind: { type: "sculpture", gen: "flor-da-vida" }, material: { family: "vidro", variant: "dicroico" }, families: ALL,
    size: "0.9m", origin: "estudo", status: "estudo",
    text: {
      pt: ["Sete anéis do mesmo tamanho: um no centro e seis em volta, cada um passando pelo centro do vizinho. O desenho antigo da Flor da Vida, com espessura.",
        "O vidro dicroico muda de cor conforme o ângulo."],
      en: ["Seven rings of the same size: one at the centre and six around it, each passing through its neighbour's centre. The ancient Flower of Life drawing, given thickness.",
        "Dichroic glass changes colour with the angle."],
    },
  },
  {
    slug: "mandala-cubica", title: S("Mandala Cúbica", "Cubic Mandala"), category: "escultura", series: SERIES.cubicos,
    kind: { type: "sculpture", gen: "mandala-cubica" }, material: { family: "laca", variant: "amarelo" }, families: ALL,
    size: "0.8m", origin: "estudo", status: "estudo",
    text: {
      pt: ["Um cubo no centro e dois anéis de cubos à volta, cada anel girado 45° em relação ao outro: uma mandala de blocos em simetria de oito.",
        "Laqueada em amarelo, a cor da assinatura."],
      en: ["A cube at the centre and two rings of cubes around it, each ring turned 45° from the other: a mandala of blocks in eightfold symmetry.",
        "Lacquered in yellow, the colour of the signature."],
    },
  },
  {
    slug: "hipercubo", title: S("Hipercubo", "Hypercube"), category: "escultura", series: SERIES.cubicos,
    kind: { type: "sculpture", gen: "hipercubo" }, material: { family: "metal", variant: "aco-escovado" }, families: ALL,
    size: "0.9m", origin: "estudo", status: "estudo",
    text: {
      pt: ["A sombra de um cubo de quatro dimensões no nosso espaço: um cubo dentro de outro, com as oito arestas que ligam os vértices de um aos do outro.",
        "As barras têm a mesma seção da Cruz Fractal: a família dos sistemas cúbicos."],
      en: ["The shadow of a four-dimensional cube in our space: a cube inside another, with the eight edges that join the vertices of one to those of the other.",
        "The bars share the section of the Fractal Cross: the family of cubic systems."],
    },
  },
  {
    slug: "portal", title: S("Portal", "Portal"), category: "escultura", series: SERIES.cubicos,
    kind: { type: "sculpture", gen: "portal" }, material: { family: "madeira", variant: "carvalho", finish: "fosco" }, families: ALL,
    size: "1.4m", origin: "estudo", status: "estudo",
    text: {
      pt: ["Uma moldura quadrada e, dentro dela, outra girada 45°, presas por uma cruz que atravessa as duas: a porta como desenho de quadrados.",
        "Em carvalho fosco, os anéis da madeira correm pelas peças como se fossem um bloco só."],
      en: ["A square frame and, inside it, another turned 45°, held by a cross that passes through both: the door as a drawing of squares.",
        "In matte oak, the growth rings run through the parts as if they were a single block."],
    },
  },
  {
    slug: "ninho", title: S("Ninho", "Nest"), category: "escultura", series: SERIES.cubicos,
    kind: { type: "sculpture", gen: "ninho" }, material: { family: "laca", variant: "ciano" }, families: ALL,
    size: "0.8m", origin: "estudo", status: "estudo",
    text: {
      pt: ["Vinte e sete barras numa grade de três por três por três, nos três eixos: um retículo que deixa o ar passar por todos os lados.",
        "Laqueado em ciano, a segunda cor da assinatura."],
      en: ["Twenty-seven bars in a three-by-three-by-three grid, along the three axes: a lattice that lets the air through on every side.",
        "Lacquered in cyan, the second colour of the signature."],
    },
  },
  {
    slug: "arcos", title: S("Arcos", "Arches"), category: "escultura", series: SERIES.paradoxos,
    kind: { type: "sculpture", gen: "arcos" }, material: { family: "marmore", variant: "verde" }, families: ALL,
    size: "0.9m", origin: "estudo", status: "estudo",
    text: {
      pt: ["Quatro meios-anéis de seção quadrada, girados 45° um do outro em volta do mesmo eixo, apoiados numa base quadrada: uma cúpula de nervuras.",
        "O mármore verde faz as nervuras parecerem pedra viva."],
      en: ["Four half-rings of square section, turned 45° from one another around the same axis, standing on a square base: a dome of ribs.",
        "Green marble makes the ribs look like living stone."],
    },
  },
  {
    slug: "torre-raiz2", title: S("Torre √2", "√2 Tower"), category: "escultura", series: SERIES.raiz,
    kind: { type: "sculpture", gen: "torre-raiz2" }, material: { family: "metal", variant: "cobre" }, families: ALL,
    size: "1.3m", origin: "estudo", status: "estudo",
    text: {
      pt: ["Sete molduras quadradas deitadas, uma sobre a outra. Cada uma é a anterior girada 45° e reduzida na razão de raiz de dois, o quadrado inscrito no quadrado: a torre afina como um zigurate de vazios.",
        "O cobre escurece onde a luz não chega."],
      en: ["Seven square frames lying one on top of the other. Each is the previous one turned 45° and reduced by the square root of two, the square inscribed in the square: the tower narrows like a ziggurat of voids.",
        "Copper darkens where the light does not reach."],
    },
  },
  {
    slug: "lanterna-cubica", title: S("Lanterna Cúbica", "Cubic Lantern"), category: "luminaria", series: SERIES.luz,
    kind: { type: "sculpture", gen: "lanterna-cubica" }, material: { family: "metal", variant: "latao" }, families: ["metal", "madeira", "laca"],
    size: "0.4m", origin: "estudo", status: "estudo",
    text: {
      pt: ["Um cubo de arestas e, dentro dele, um cubo de vidro fosco aceso, girado sobre a diagonal: a luz fica presa no desenho.",
        "Para mesa ou chão."],
      en: ["A cube of edges and, inside it, a lit frosted-glass cube turned on its diagonal: the light is caught in the drawing.",
        "For table or floor."],
    },
  },
  {
    slug: "halo", title: S("Halo", "Halo"), category: "luminaria", series: SERIES.luz,
    kind: { type: "sculpture", gen: "halo" }, material: { family: "metal", variant: "ouro" }, families: ["metal", "madeira", "laca", "gesso"],
    size: "0.6m", origin: "estudo", status: "estudo",
    text: {
      pt: ["Dois anéis cruzados em ângulo reto e, no centro, uma esfera de luz: um pequeno astro de mesa.",
        "A esfera brilha mais quanto mais escuro estiver o ambiente."],
      en: ["Two rings crossed at right angles and, at the centre, a sphere of light: a small table star.",
        "The sphere shines brighter the darker the room."],
    },
  },
  {
    slug: "prisma", title: S("Prisma", "Prism"), category: "luminaria", series: SERIES.luz,
    kind: { type: "sculpture", gen: "prisma" }, material: { family: "madeira", variant: "freijo", finish: "acetinado" }, families: ["madeira", "metal", "laca", "gesso"],
    size: "0.5m", origin: "estudo", status: "estudo",
    text: {
      pt: ["Uma pirâmide de arestas sobre uma base quadrada, com um núcleo de vidro aceso em forma de octaedro.",
        "A luz sai pelas quatro faces abertas."],
      en: ["A pyramid of edges on a square base, with a lit glass core in the shape of an octahedron.",
        "The light comes out through the four open faces."],
    },
  },
  /* ── pinturas (geradas: no lugar das do artista, até ele mandar) ── */
  ...([
    ["campos-de-ouro", "Campos de Ouro", "Fields of Gold", "campos", 11, 80, 100],
    ["orbita-magenta", "Órbita Magenta", "Magenta Orbit", "geometria", 23, 90, 90],
    ["vento-ciano", "Vento Ciano", "Cyan Wind", "gestos", 37, 120, 80],
    ["horizonte-cubico", "Horizonte Cúbico", "Cubic Horizon", "horizonte", 41, 140, 70],
    ["sol-interior", "Sol Interior", "Inner Sun", "radial", 53, 80, 80],
    ["tres-luzes", "Três Luzes", "Three Lights", "campos", 67, 70, 100],
    ["triangulo-vermelho", "Triângulo Vermelho", "Red Triangle", "geometria", 79, 100, 120],
    ["mar-de-dentro", "Mar de Dentro", "Inner Sea", "gestos", 83, 100, 100],
  ] as const).map(([slug, pt, en, style, seed, w, h]): Work => ({
    slug, title: S(pt, en), category: "pintura", series: SERIES.oleos,
    kind: { type: "painting", style, seed, w, h, round: slug === "sol-interior" },
    size: `${w} × ${h} cm`, origin: "estudo", status: "estudo",
    text: {
      pt: ["Óleo sobre tela, abstrato: campos e formas de cor com a matéria da tinta à vista, a pincelada como relevo.",
        "Imagem gerada no lugar de uma pintura do artista, que entra aqui quando chegar a foto."],
      en: ["Oil on canvas, abstract: fields and shapes of colour with the paint's body showing, the brushstroke as relief.",
        "A generated image standing in for one of the artist's paintings, to be replaced when the photograph arrives."],
    },
  })),
  /* ── mandalas (desenhos a compasso, gerados) ── */
  ...([
    ["mandala-seis", "Mandala do Seis", "Mandala of Six", 6, 101],
    ["mandala-oito", "Mandala do Oito", "Mandala of Eight", 8, 113],
    ["mandala-doze", "Mandala do Doze", "Mandala of Twelve", 12, 127],
    ["mandala-cinco", "Mandala do Cinco", "Mandala of Five", 5, 131],
  ] as const).map(([slug, pt, en, folds, seed]): Work => ({
    slug, title: S(pt, en), category: "mandala", series: SERIES.mandalas,
    kind: { type: "mandala", seed, folds },
    size: "50 × 50 cm", origin: "estudo", status: "estudo",
    text: {
      pt: [`Desenho a compasso e régua em simetria de ${folds}: círculos, pétalas e polígonos que nascem uns dos outros a partir do centro.`,
        "Desenho gerado no lugar de uma mandala do artista."],
      en: [`A compass-and-ruler drawing in ${folds}-fold symmetry: circles, petals and polygons born from one another out of the centre.`,
        "A generated drawing standing in for one of the artist's mandalas."],
    },
  })),
];

/** a peça de amostra dos materiais (página Sobre): um cubo em pé num canto, mostra três faces */
export const SAMPLE: Work = {
  slug: "amostra", title: S("Amostra", "Sample"), category: "escultura", series: S("", ""), kind: { type: "sculpture", gen: "amostra" },
  size: "", origin: "estudo", status: "estudo", text: { pt: [], en: [] },
};

/** cartão claro (papel) para obras de material escuro ou de gesso, como a Coroa e a Tríade nas telas */
const DARK = new Set(["nero", "preto", "ebanizada", "aco-negro", "fume"]);
export const lightCard = (w: Work) => w.material?.family === "gesso" || DARK.has(w.material?.variant ?? "");

export const WORK_BY_SLUG: Record<string, Work> = Object.fromEntries(WORKS.map((w) => [w.slug, w]));

export const CATEGORIES: { id: Category | "all"; label: T }[] = [
  { id: "all", label: S("Todas", "All") },
  { id: "escultura", label: S("Esculturas", "Sculptures") },
  { id: "pintura", label: S("Pinturas", "Paintings") },
  { id: "mandala", label: S("Mandalas", "Mandalas") },
  { id: "luminaria", label: S("Luminárias", "Lamps") },
];

export const FAMILY_LABEL: Record<Family, T> = {
  marmore: S("mármore", "marble"),
  madeira: S("madeira", "wood"),
  vidro: S("vidro", "glass"),
  gesso: S("gesso", "plaster"),
  metal: S("metal", "metal"),
  laca: S("laca", "lacquer"),
};

/** a técnica da obra plana, para a ficha e a loja: a do artista, quando houver (BP-05); senão, a do desenho gerado */
export function mediumOf(w: Work): T | null {
  if (w.medium) return w.medium;
  if (w.kind.type === "painting") return S("óleo sobre tela", "oil on canvas");
  if (w.kind.type === "mandala") return w.kind.seed % 2 ? S("ouro sobre preto", "gold on black") : S("nanquim sobre papel", "ink on paper");
  return null;
}
