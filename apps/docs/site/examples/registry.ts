import type { ComponentType } from "react";
import { getComponentNames, getBlockNames } from "@/lib/registry";
import * as inputs from "./inputs";
import * as actions from "./actions";
import * as feedback from "./feedback";
import * as disclosure from "./disclosure";
import * as data from "./data";
import * as forms from "./forms";
import * as chartsText from "./charts-text";
import * as blocksEx from "./blocks";
import * as mediaCollab from "./media-collab";
import * as feedbackMore from "./feedback-more";
import * as actionsMore from "./actions-more";

const modules = [
  { file: "examples/inputs.tsx", exports: inputs },
  { file: "examples/actions.tsx", exports: actions },
  { file: "examples/feedback.tsx", exports: feedback },
  { file: "examples/disclosure.tsx", exports: disclosure },
  { file: "examples/data.tsx", exports: data },
  { file: "examples/forms.tsx", exports: forms },
  { file: "examples/charts-text.tsx", exports: chartsText },
  { file: "examples/blocks.tsx", exports: blocksEx },
  { file: "examples/media-collab.tsx", exports: mediaCollab },
  { file: "examples/feedback-more.tsx", exports: feedbackMore },
  { file: "examples/actions-more.tsx", exports: actionsMore },
];

export type ExampleEntry = { file: string; exportName: string; Component: ComponentType };

function pascal(name: string): string {
  return name.replace(/(^|-)([a-z0-9])/g, (_, __, char: string) => char.toUpperCase());
}

/**
 * Real-world examples of an item. Name the export `<ItemName><Scenario>Example`
 * (`MorphSelectTimezoneExample` belongs to morph-select) and the item page picks it up in file order.
 */
export function getExamples(itemName: string): ExampleEntry[] {
  const prefix = pascal(itemName);
  const entries: ExampleEntry[] = [];
  // A longer item name that also matches wins (`ButtonGroupFooExample` is not a `Button` example).
  const longer = [...getComponentNames(), ...getBlockNames()].map(pascal).filter((n) => n.length > prefix.length && n.startsWith(prefix));

  for (const entry of modules) {
    for (const [exportName, value] of Object.entries(entry.exports)) {
      // The character after the prefix must start a new word so `Select` doesn't swallow `SelectMenuExample`'s siblings.
      if (!exportName.endsWith("Example") || typeof value !== "function") continue;
      if (!exportName.startsWith(prefix) || !/[A-Z]/.test(exportName[prefix.length] ?? "")) continue;
      if (longer.some((name) => exportName.startsWith(name))) continue;
      entries.push({ file: entry.file, exportName, Component: value as ComponentType });
    }
  }

  return entries;
}

/** An example by its export name, e.g. `MorphSelectTimezoneExample`, for the framed phone preview. */
export function findExample(exportName: string): ComponentType | undefined {
  for (const entry of modules) {
    const value = (entry.exports as Record<string, unknown>)[exportName];
    if (exportName.endsWith("Example") && typeof value === "function") return value as ComponentType;
  }
}
