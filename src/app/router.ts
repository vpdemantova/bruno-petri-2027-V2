/* Um roteador pequeno sobre a History API. A leitura dos endereços mora em
   routes.ts (pura, testada no Node); aqui ficam a navegação e o hook.
   O vercel.json manda todo endereço sem arquivo para o index.html. */
import { useSyncExternalStore } from "react";
import { parse, type Route } from "./routes";

export { parse, type Route };

let current = { path: location.pathname, search: location.search, route: parse(location.pathname, location.search) };
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

function sync() {
  current = { path: location.pathname, search: location.search, route: parse(location.pathname, location.search) };
  emit();
}
window.addEventListener("popstate", sync);

export function navigate(to: string, opts: { replace?: boolean } = {}) {
  const u = new URL(to, location.origin);
  if (u.pathname + u.search === location.pathname + location.search) return;
  history[opts.replace ? "replaceState" : "pushState"](null, "", u.pathname + u.search + u.hash);
  sync();
}

export function useRoute() {
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => current);
}

export const routeKey = (r: Route) => r.name;
