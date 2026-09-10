import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", "out/**", "public/**"],
  },
  ...nextCoreWebVitals,
  ...nextTypeScript,
];

export default eslintConfig;
