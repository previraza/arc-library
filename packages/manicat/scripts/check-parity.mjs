/**
 * UI parity between the web ports. A Svelte port must look and behave like its Vue port, and the Vue port like the React
 * one, so the two things that decide how a component looks are compared mechanically:
 *
 *  - the stylesheet: the CSS of `x.vue` and `x.svelte` must be the same rules (Svelte only wraps them in `:global { }`);
 *  - the `classNames` keys: every customisable part of the Vue port exists in the Svelte port.
 *
 * Run through `pnpm check:registry`. It only looks at items that have both ports, so it grows with the ports.
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = new URL("../registry/", import.meta.url).pathname;
const errors = [];

const squash = css => css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").replace(/\s*([{};:,>])\s*/g, "$1").trim();
const vueCss = source => /<style[^>]*>([\s\S]*?)<\/style>/.exec(source)?.[1] ?? "";
const svelteCss = source => {
  const body = /<style[^>]*>([\s\S]*?)<\/style>/.exec(source)?.[1] ?? "";
  return body.replace(/^\s*:global\s*\{/, "").replace(/\}\s*$/, "");
};
const parts = source => new Set([...(/classNames\??:\s*\{([^}]*)\}/.exec(source)?.[1] ?? "").matchAll(/(\w+)\??:/g)].map(match => match[1]));

for (const kind of ["components", "blocks"]) {
  for (const name of await readdir(path.join(root, kind))) {
    const dir = path.join(root, kind, name);
    const files = await readdir(dir);
    if (!files.includes(`${name}.vue`) || !files.includes(`${name}.svelte`)) continue;
    const vue = await readFile(path.join(dir, `${name}.vue`), "utf8");
    const svelte = await readFile(path.join(dir, `${name}.svelte`), "utf8");
    if (squash(vueCss(vue)) !== squash(svelteCss(svelte))) errors.push(`${name}: the CSS of ${name}.svelte differs from ${name}.vue`);
    const missing = [...parts(vue)].filter(part => !parts(svelte).has(part));
    if (missing.length) errors.push(`${name}: ${name}.svelte lacks the classNames part(s) ${missing.join(", ")} of ${name}.vue`);
  }
}

// Swift has no CSS: its colours are compared with the React Native tokens, which are themselves the values of foundation.css.
const hexes = source => new Set([...source.matchAll(/#[0-9a-fA-F]{6}\b/g)].map(match => match[0].toLowerCase()));
const nativeTokens = hexes(await readFile(new URL("../lib/rn-tokens.ts", import.meta.url), "utf8"));
const swiftTokens = hexes(await readFile(new URL("../lib/ManicatTokens.swift", import.meta.url), "utf8"));
for (const color of nativeTokens) if (!swiftTokens.has(color)) errors.push(`ManicatTokens.swift lacks ${color} of rn-tokens.ts`);
for (const color of swiftTokens) if (!nativeTokens.has(color)) errors.push(`ManicatTokens.swift has ${color}, which rn-tokens.ts does not`);

if (errors.length) {
  console.error(`Port parity check failed:\n${errors.map(error => `  - ${error}`).join("\n")}`);
  process.exit(1);
}
console.log("Port parity: Svelte matches Vue, Swift tokens match React Native.");
