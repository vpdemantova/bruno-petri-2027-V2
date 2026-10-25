/* A leitura dos endereços, sem navegador (BP-70, 25/out/2026): o mesmo
   parse() que antes morava em router.ts, separado para os testes rodarem
   no Node. Endereços como nas telas:
     /                    Home
     /spyglass/:obra      a obra sozinha, de todos os ângulos
     /galeria             lista (carrossel); ?vista=grade e ?tipo=pintura…
     /loja  /sobre
     /:obra               a página da obra (ex.: /cruz-fractal)
   Quem usa: router.ts (a navegação) e o build (as páginas pré-geradas). */
import { WORK_BY_SLUG } from "../data/works";

export type Route =
  | { name: "home" }
  | { name: "spyglass"; slug: string }
  | { name: "galeria"; view: "lista" | "grade" }
  | { name: "obra"; slug: string }
  | { name: "loja" }
  | { name: "sobre" }
  | { name: "404" };

export function parse(path: string, search = ""): Route {
  const p = path.replace(/\/+$/, "") || "/";
  const q = new URLSearchParams(search);
  if (p === "/") return { name: "home" };
  if (p === "/galeria" || p === "/gallery") return { name: "galeria", view: q.get("vista") === "grade" || q.get("view") === "grid" ? "grade" : "lista" };
  if (p === "/loja" || p === "/shop") return { name: "loja" };
  if (p === "/sobre" || p === "/about") return { name: "sobre" };
  const sp = p.match(/^\/spyglass(?:\/([\w-]+))?$/);
  if (sp) return { name: "spyglass", slug: sp[1] && WORK_BY_SLUG[sp[1]] ? sp[1] : "molecula" };
  const ob = p.match(/^\/([\w-]+)$/);
  if (ob && WORK_BY_SLUG[ob[1]]) return { name: "obra", slug: ob[1] };
  return { name: "404" };
}
