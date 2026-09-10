import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

/** @type {import('eslint').Linter.Config[]} */
const config = [
  {
    ignores: [".next/**", "node_modules/**", "out/**", "public/**"]
  },
  ...nextCoreWebVitals,
  ...nextTypeScript,

  {
    rules: {
      // The webhook handler logs verification outcomes on purpose.
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // `noUnusedLocals`/`noUnusedParameters` in tsconfig.json already cover this,
      // and the base rule misfires on type-only declarations.
      "no-unused-vars": "off"
    }
  },

  // Must stay last: turns off every rule that conflicts with Prettier.
  prettier
];

export default config;
