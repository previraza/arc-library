/**
 * Prints the stylesheet of a React component as it goes into its Vue and Svelte ports: the same rules, byte for byte, with every
 * class of the CSS module renamed `.mc-<item>__<name>` so it can be global and cannot collide. The ports use these class names
 * in their markup, which is what keeps them looking exactly like the React version.
 *
 *   node scripts/port-css.mjs action-button [file.module.css]
 */
import { readFile } from "node:fs/promises";

const [item, file = `${item}.module.css`] = process.argv.slice(2);
const dir = `registry/${item.startsWith("@") ? "" : "components"}`;
const css = await readFile(`${dir}/${item}/${file}`, "utf8").catch(() => readFile(`registry/blocks/${item}/${file}`, "utf8"));

const names = new Set([...css.matchAll(/\.([A-Za-z_][\w-]*)/g)].map((match) => match[1]).filter((name) => !/^\d/.test(name)));
const frames = new Set([...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((match) => match[1]));
let out = css;
for (const name of [...names].sort((a, b) => b.length - a.length)) out = out.replace(new RegExp(`\\.${name}(?![\\w-])`, "g"), `.mc-${item}__${name}`);
for (const name of frames) out = out.replace(new RegExp(`(?<![\\w-])${name}(?![\\w-])`, "g"), `mc-${item}-${name}`);
process.stdout.write(out);
