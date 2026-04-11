import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Layering (see package.json: lint, lint:strict, lint:changed, lint:staged):
 * - scripts/** ignored (Node one-offs; new scripts can use ESM import if removed from ignore).
 * - src/app/admin/page.tsx: warn-only for mega-file debt until split.
 * - src/app/api + src/lib: no-explicit-any stays error (tight core).
 * Option B (warning ratchet): once `eslint .` reports 0 errors, run e.g.
 *   npx eslint . --max-warnings 400
 * and lower the number each sprint (warnings only; errors always fail).
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scripts/**",
  ]),
  {
    files: ["src/app/api/**/*.ts", "src/lib/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    files: ["src/app/admin/page.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
]);

export default eslintConfig;
