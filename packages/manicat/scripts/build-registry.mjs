/**
 * Regenerates the prebuilt items in public/r from registry.json and the source files it lists, so the shipped payloads
 * can never drift from the code: every content field is the item's file with its imports rewritten for the install
 * layout, exactly as scripts/check-registry.mjs verifies it.
 *
 *   pnpm --filter manicat build:registry
 */
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { importSpecifiers, withRelativeImports } from "./registry-install.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
process.chdir(root);

const registry = JSON.parse(await readFile("registry.json", "utf8"));
const exists = async file => { try { return (await stat(file)).isFile(); } catch { return false; } };

async function findFile(importPath) {
  for (const candidate of [importPath, `${importPath}.ts`, `${importPath}.tsx`, `${importPath}.css`, `${importPath}.module.css`, path.join(importPath, "index.ts"), path.join(importPath, "index.tsx")]) {
    if (await exists(candidate)) return candidate;
  }
  return null;
}
const resolveFrom = file => specifier => {
  if (specifier.startsWith("./") || specifier.startsWith("../")) return findFile(path.normalize(path.join(path.dirname(file), specifier)));
  if (specifier.startsWith("@/")) return findFile(specifier.slice(2));
  return null;
};
/** The payload a registry item embeds for `file`: the source, with imports rewritten for the install layout. */
async function expected(file) {
  const source = await readFile(file, "utf8");
  return /\.(?:tsx?|css)$/.test(file) ? withRelativeImports(file, source, importSpecifiers(file, source), resolveFrom(file)) : source;
}

for (const item of registry.items) {
  const payload = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    ...item,
    files: [],
  };
  for (const file of item.files) {
    payload.files.push({ ...file, content: await expected(file.path) });
  }
  await writeFile(`public/r/${item.name}.json`, JSON.stringify(payload));
}

console.log(`Built ${registry.items.length} items.`);