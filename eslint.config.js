/* O ESLint (BP-72, 25/out/2026): as regras recomendadas do JavaScript e do
   TypeScript e as duas regras clássicas dos hooks do React (a ordem dos
   hooks e as dependências dos efeitos), sem regras de estilo: o desenho das
   linhas é do código, não do linter. Veio do Vitor Petri V2 (VP-70).
   Roda com `npm run lint`, dentro do `npm run check` e no GitHub a cada envio. */
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default tseslint.config(
  { ignores: ["dist", "node_modules", "public"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser }, ecmaVersion: 2022, sourceType: "module" },
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
  { files: ["scripts/**", "*.config.*", "**/*.test.ts"], languageOptions: { globals: { ...globals.node } } },
);
