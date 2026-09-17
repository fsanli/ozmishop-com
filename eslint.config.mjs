import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Tasarım teslim klasörü: prototip runtime'ı (support.js, image-slot.js) ve
    // .dc.html dosyaları uygulama kaynağı değil, referans. Lint edilmez.
    "Ozmishop Web Design/**",
  ]),
]);

export default eslintConfig;
