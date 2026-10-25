/* O catálogo e os endereços (BP-70, 25/out/2026): conferências que pegam
   um erro de digitação antes de ele virar uma página quebrada. */
import { describe, expect, it } from "vitest";
import { CATEGORIES, WORKS, WORK_BY_SLUG } from "./works";
import { FAMILIES, materialLabel, variantOf } from "../three/materials";
import { parse } from "../app/routes";

describe("o catálogo", () => {
  it("cada obra tem endereço único, título e texto nas duas línguas", () => {
    const slugs = WORKS.map((w) => w.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const w of WORKS) {
      expect(w.slug).toMatch(/^[a-z0-9-]+$/);
      expect(w.title.pt && w.title.en, w.slug).toBeTruthy();
      expect(w.text.pt.length, w.slug).toBeGreaterThan(0);
      expect(w.text.en.length, w.slug).toBe(w.text.pt.length);
      expect(CATEGORIES.some((c) => c.id === w.category)).toBe(true);
    }
  });

  it("os endereços das obras não colidem com as páginas", () => {
    for (const s of ["galeria", "gallery", "loja", "shop", "sobre", "about", "spyglass", "serie", "atelie", "mandala", "og"]) expect(WORK_BY_SLUG[s]).toBeUndefined();
  });

  it("o material padrão existe e está entre os que a obra aceita", () => {
    for (const w of WORKS) {
      if (w.kind.type !== "sculpture") continue;
      const m = w.material!;
      expect(m, w.slug).toBeTruthy();
      expect(FAMILIES[m.family].variants.some((v) => v.id === m.variant), `${w.slug}: ${m.family}.${m.variant}`).toBe(true);
      expect(w.families, w.slug).toContain(m.family);
    }
  });

  it("estudo é estudo: a origem e a situação concordam (nada vendido como obra sem o artista)", () => {
    for (const w of WORKS) if (w.origin === "estudo") expect(w.status, w.slug).toBe("estudo");
  });

  it("o nome do material, nas duas línguas", () => {
    expect(materialLabel({ family: "madeira", variant: "nogueira", finish: "brilhante" }, "pt")).toBe("madeira · nogueira · verniz brilhante");
    expect(materialLabel({ family: "marmore", variant: "bardiglio" }, "en")).toBe("marble · bardiglio");
    // variante desconhecida cai na primeira da família, sem quebrar
    expect(variantOf({ family: "metal", variant: "nao-existe" }).id).toBe(FAMILIES.metal.variants[0].id);
  });
});

describe("os endereços", () => {
  it("cada página", () => {
    expect(parse("/")).toEqual({ name: "home" });
    expect(parse("/galeria")).toEqual({ name: "galeria", view: "lista" });
    expect(parse("/galeria", "?vista=grade")).toEqual({ name: "galeria", view: "grade" });
    expect(parse("/gallery", "?view=grid")).toEqual({ name: "galeria", view: "grade" });
    expect(parse("/loja/")).toEqual({ name: "loja" });
    expect(parse("/about")).toEqual({ name: "sobre" });
    expect(parse("/cruz-fractal")).toEqual({ name: "obra", slug: "cruz-fractal" });
    expect(parse("/spyglass/triade")).toEqual({ name: "spyglass", slug: "triade" });
    expect(parse("/spyglass/nada")).toEqual({ name: "spyglass", slug: "molecula" });
    expect(parse("/nada-aqui")).toEqual({ name: "404" });
    expect(parse("/cruz-fractal/extra")).toEqual({ name: "404" });
  });
});
