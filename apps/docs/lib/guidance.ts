import { readFileSync } from "node:fs";
import { join } from "node:path";

export type GuidanceSection = { id: string; title: string; markdown: string };

/** Sections that sit right under the preview: when to reach for the item, and when not to. */
export const decisionIds = ["when-to-use", "when-not-to-use"] as const;

/**
 * The usage guidance of an item, from the snapshot in content/guidance (see scripts/import-guidance.mjs):
 * when to use it, keyboard interactions, accessibility, motion, responsive behavior, performance and notes for AI.
 * An item without a snapshot simply shows none of these sections.
 */
export function getGuidance(name: string): GuidanceSection[] {
  try {
    const file = join(process.cwd(), "content", "guidance", `${name}.json`);
    return (JSON.parse(readFileSync(file, "utf8")) as { sections: GuidanceSection[] }).sections;
  } catch {
    return [];
  }
}
