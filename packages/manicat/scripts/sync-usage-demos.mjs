/**
 * Turns the Usage snippets of the docs into the demos of a framework viewer: `apps/docs/content/usage/<item>.<framework>.txt`
 * becomes `<outDir>/<item>.<ext>`. The snippets are what readers copy, so the viewer shows exactly them, and there is one
 * source of truth instead of a snippet and a demo that drift apart.
 *
 *   node scripts/sync-usage-demos.mjs <framework-id> <out-dir>
 *
 * The Examples sections work the same way: `apps/docs/content/examples/<ExportName>.<framework>.txt` becomes
 * `<outDir>/example--<ExportName>.<ext>`, and the viewer opens it at `#example:<ExportName>`.
 *
 * Imports are pointed at the registry sources: `@/components/manicat/button/button.vue` becomes
 * `@/registry/components/button/button.vue`, and blocks live under `@/registry/blocks/`. Metro's `require("./logo.png")`, which a
 * browser bundle cannot resolve, becomes an empty image source.
 */
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const extensions = { vue: ".vue", svelte: ".svelte", "react-native": ".tsx", swift: ".swift" };
const [framework, outArg] = process.argv.slice(2);
if (!extensions[framework] || !outArg) {
  console.error(`Usage: sync-usage-demos.mjs <${Object.keys(extensions).join("|")}> <out-dir>`);
  process.exit(1);
}

const usage = new URL("../../../apps/docs/content/usage/", import.meta.url).pathname;
const out = path.resolve(process.cwd(), outArg);
const suffix = `.${framework}.txt`;

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

const examples = new URL("../../../apps/docs/content/examples/", import.meta.url).pathname;
const sources = [
  ...(await readdir(usage)).filter(name => name.endsWith(suffix)).map(file => ({ dir: usage, file, name: file.slice(0, -suffix.length) })),
  ...(await readdir(examples).catch(() => [])).filter(name => name.endsWith(suffix)).map(file => ({ dir: examples, file, name: `example--${file.slice(0, -suffix.length)}` })),
];

let count = 0;
for (const { dir, file, name } of sources) {
  const source = (await readFile(path.join(dir, file), "utf8"))
    .replaceAll("@/components/manicat/blocks/", "@/registry/blocks/")
    .replaceAll("@/components/manicat/", "@/registry/components/")
    .replace(/require\((["'`])[^"'`]+\1\)/g, '{ uri: "" }');
  await writeFile(path.join(out, name + extensions[framework]), source);
  count += 1;
}
console.log(`${count} ${framework} demos written to ${path.relative(process.cwd(), out)}`);
