/**
 * Prints the stylesheet of a React component as it goes into its Vue and Svelte ports: the same rules, byte for byte, with every
 * class of the CSS module renamed `.mc-<item>__<name>` so it can be global and cannot collide. The ports use these class names
 * in their markup, which is what keeps them looking exactly like the React version.
 *
 *   node scripts/port-css.mjs action-button [--vars=reka|bits] [file.module.css]
 *
 * `--vars` renames the custom properties of Radix (`--radix-dropdown-menu-content-transform-origin`) to those of the library a port
 * uses instead: `--reka-…` for Reka UI (Vue) and `--bits-…` for Bits UI (Svelte).
 */
import { readFile } from "node:fs/promises";

const args = process.argv.slice(2);
const vars = args.find((arg) => arg.startsWith("--vars="))?.slice(7);
const [item, file = `${item}.module.css`] = args.filter((arg) => !arg.startsWith("--"));
const dir = `registry/${item.startsWith("@") ? "" : "components"}`;
const css = await readFile(`${dir}/${item}/${file}`, "utf8").catch(() => readFile(`registry/blocks/${item}/${file}`, "utf8"));

// `:global(x)` keeps x as it is: its classes are not the module's, and the ports' stylesheets are global already.
const globals = [];
const source = css.replace(/:global\(((?:[^()]|\([^()]*\))*)\)/g, (_, inner) => `__GLOBAL${globals.push(inner) - 1}__`);
const names = new Set([...source.matchAll(/\.([A-Za-z_][\w-]*)/g)].map((match) => match[1]).filter((name) => !/^\d/.test(name)));
const frames = new Set([...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((match) => match[1]));
let out = source;
for (const name of [...names].sort((a, b) => b.length - a.length)) out = out.replace(new RegExp(`\\.${name}(?![\\w-])`, "g"), `.mc-${item}__${name}`);
for (const name of frames) out = out.replace(new RegExp(`(?<![\\w-])${name}(?![\\w-])`, "g"), `mc-${item}-${name}`);
out = out.replace(/__GLOBAL(\d+)__/g, (_, index) => globals[Number(index)]);
if (vars) out = out.replaceAll("--radix-select-trigger-width", vars === "bits" ? "--bits-select-anchor-width" : "--reka-select-trigger-width").replaceAll("--radix-", `--${vars}-`);
process.stdout.write(out);
