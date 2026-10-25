/* Os textos da interface, em português e inglês. Os rótulos das telas
   (Home, Galeria, Loja, Sobre) ficam iguais nos dois idiomas, como no
   desenho; o resto acompanha a troca pt-br / en. */
import { useStore } from "./store";
import type { Lang, T } from "../data/works";

const S = (pt: string, en: string): T => ({ pt, en });

export const TXT = {
  home: S("Home", "Home"),
  galeria: S("Galeria", "Gallery"),
  loja: S("Loja", "Shop"),
  sobre: S("Sobre", "About"),
  nav: S("Navegação principal", "Main navigation"),
  explore: S("Explore every angle", "Explore every angle"),
  angle: S("Ângulo", "Angle"),
  angles: ["de frente", "de perto", "três quartos", "de lado", "de cima", "de baixo"],
  anglesEn: ["front", "close", "three quarters", "side", "top", "below"],
  info: S("Sobre esta obra", "About this work"),
  close: S("Fechar", "Close"),
  enterSpy: S("Ver de todos os ângulos", "See from every angle"),
  prev: S("Obra anterior", "Previous work"),
  next: S("Próxima obra", "Next work"),
  list: S("List", "List"),
  grid: S("Gallery", "Gallery"),
  listView: S("List view", "List view"),
  pieces: S("Pieces", "Pieces"),
  all: S("All", "All"),
  buy: S("Comprar na loja", "Buy in the shop"),
  material: S("Material", "Material"),
  finish: S("Acabamento", "Finish"),
  views: S("Vistas", "Views"),
  expand: S("Ampliar (spyglass)", "Enlarge (spyglass)"),
  drag: S("arraste para girar · role para aproximar", "drag to turn · scroll to zoom"),
  dragTouch: S("arraste para girar", "drag to turn"),
  study: S("estudo", "study"),
  studyNote: S("Forma desenhada como estudo do repertório; a confirmar com o artista.", "A form drawn as a study of the repertoire; to be confirmed with the artist."),
  available: S("disponível", "available"),
  consult: S("sob consulta", "on request"),
  lampOn: S("Acender", "Turn on"),
  lampOff: S("Apagar", "Turn off"),
  open: S("Abrir", "Open"),
  size: S("Tamanho", "Size"),
  state: S("Situação", "Status"),
  photo: S("Foto", "Photo"),
  viewAs: S("Ver em 3D ou na foto", "See in 3D or in the photo"),
  // loja
  shopTitle: S("Loja", "Shop"),
  shopLead: S("Esculturas, luminárias, pinturas e mandalas. Escolha a obra e o material, monte a sua lista e envie ao artista: preço, prazo e entrega são combinados direto com ele.",
    "Sculptures, lamps, paintings and mandalas. Choose the work and the material, build your list and send it to the artist: price, timing and delivery are agreed directly with him."),
  addWish: S("Adicionar à lista", "Add to list"),
  inWish: S("Na lista", "In the list"),
  wish: S("Lista de interesse", "Wish list"),
  wishEmpty: S("A lista está vazia. Escolha uma obra na loja ou na galeria.", "The list is empty. Pick a work in the shop or the gallery."),
  remove: S("Tirar", "Remove"),
  note: S("Recado para o artista (medidas, cor, prazo…)", "Note for the artist (size, colour, timing…)"),
  name: S("Seu nome", "Your name"),
  send: S("Enviar por e-mail", "Send by e-mail"),
  copy: S("Copiar o pedido", "Copy the request"),
  copied: S("Copiado", "Copied"),
  noEmail: S("O e-mail do artista ainda não foi publicado: copie o pedido e envie pelo contato dele.", "The artist's e-mail is not published yet: copy the request and send it through his contact."),
  priceNote: S("Preço sob consulta", "Price on request"),
  qty: S("Quantidade", "Quantity"),
  configure: S("Escolher material", "Choose material"),
  everyMaterial: S("Toda escultura pode ser pedida em qualquer um destes materiais.", "Every sculpture can be requested in any of these materials."),
  // sobre
  aboutTitle: S("Sobre", "About"),
  materialsTitle: S("As matérias", "The materials"),
  materialsLead: S("Mármore, madeira, vidro, gesso, metal e laca: cada um com as suas variações. Passe o mouse ou toque para girar.", "Marble, wood, glass, plaster, metal and lacquer, each with its variations. Hover or tap to turn."),
  geometryTitle: S("Geometria e proporção", "Geometry and proportion"),
  cvTitle: S("Exposições e acervos", "Exhibitions and collections"),
  contact: S("Contato", "Contact"),
  credits: S("Créditos do site", "Site credits"),
  notFound: S("Esta página não existe.", "This page does not exist."),
  backHome: S("Voltar ao início", "Back home"),
  loading: S("preparando as obras", "preparing the works"),
  skip: S("Pular para o conteúdo", "Skip to content"),
  no3d: S("Este navegador não mostra 3D; as obras aparecem como desenho.", "This browser cannot show 3D; works appear as drawings."),
};

export function useLang(): [Lang, (t: T) => string] {
  const lang = useStore((s) => s.lang);
  return [lang, (t: T) => t[lang]];
}
