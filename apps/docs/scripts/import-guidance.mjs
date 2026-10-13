/**
 * Snapshots the usage guidance of every item from the upstream Arc docs (MIT licensed, see LICENSE) into
 * content/guidance/<item>.json: when to use it, keyboard interactions, accessibility, motion, responsive behavior,
 * performance and notes for AI. The item pages render these sections; the snapshot is committed, so builds never hit the network.
 *
 *   node scripts/import-guidance.mjs            # every item
 *   node scripts/import-guidance.mjs phone-input button
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const origin = "https://uiarc.dev";
const registry = JSON.parse(await readFile(new URL("../../../packages/manicat/registry.json", import.meta.url), "utf8"));
const out = fileURLToPath(new URL("../content/guidance/", import.meta.url));
await mkdir(out, { recursive: true });

const wanted = new Map([
  ["When to use", "when-to-use"],
  ["When not to use", "when-not-to-use"],
  ["Keyboard interactions", "keyboard"],
  ["Accessibility", "accessibility"],
  ["Motion", "motion"],
  ["Responsive behavior", "responsive"],
  ["Performance", "performance"],
  ["Notes for AI", "notes"],
]);

const only = process.argv.slice(2);
const items = registry.items.filter((item) => (item.type === "registry:ui" || item.type === "registry:block") && (!only.length || only.includes(item.name)));

let written = 0;
const missing = [];
for (const item of items) {
  const path = item.type === "registry:block" || item.meta?.kind === "block" ? `components/blocks/${item.name}` : `components/${item.name}`;
  const response = await fetch(`${origin}/${path}/markdown`).catch(() => undefined);
  if (!response?.ok) {
    missing.push(item.name);
    continue;
  }

  const text = await response.text();
  const sections = [];
  for (const part of text.split(/\n(?=## )/)) {
    const match = /^## (.+)\n/.exec(part);
    const id = match && wanted.get(match[1].trim());
    if (!id) continue;
    const markdown = part.slice(match[0].length).trim();
    if (markdown) sections.push({ id, title: match[1].trim(), markdown });
  }

  if (sections.length) {
    await writeFile(`${out}${item.name}.json`, JSON.stringify({ sections }, null, 2) + "\n");
    written += 1;
  } else {
    missing.push(item.name);
  }
  await new Promise((done) => setTimeout(done, 120));
}

console.log(`Wrote ${written} guidance files.${missing.length ? ` No guidance found for: ${missing.join(", ")}` : ""}`);
