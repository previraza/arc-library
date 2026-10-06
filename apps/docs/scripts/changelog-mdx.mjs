/**
 * Turns CHANGELOG.md into content/docs/changelog.mdx, pointing every entry at the local preview page.
 * Usage: pnpm --filter @arc/docs changelog
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// The app writes content/docs/changelog.mdx; the CHANGELOG it reads is at the repository root.
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const changelog = readFileSync(join(root, "..", "..", "CHANGELOG.md"), "utf8");

const body = changelog
  .split("\n")
  .slice(1)
  .join("\n")
  // uiarc.dev/components/<id> and uiarc.dev/components/blocks/<id> become local routes.
  .replaceAll(/\]\(https:\/\/uiarc\.dev\/components\/(blocks\/)?([a-z0-9-]+)\)/g, (_, blocks, id) =>
    blocks ? `](/blocks/${id})` : `](/components/${id})`,
  )
  .replace(/^# .*$/m, "")
  .replace("Every entry links to its live preview on uiarc.dev.", "Every entry links to its live preview on this site.");

const output = `---
title: Changelog
description: Every free component and block added to Arc, newest first.
---

${body.trim()}
`;

mkdirSync(join(root, "content", "docs"), { recursive: true });
writeFileSync(join(root, "content/docs/changelog.mdx"), output);
console.log("Wrote content/docs/changelog.mdx");