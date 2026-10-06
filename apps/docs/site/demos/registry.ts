import type { ComponentType } from "react";

import * as actions from "./actions";
import * as disclosure from "./disclosure";
import * as feedback from "./feedback";
import * as inputs from "./inputs";

export type DemoComponent = ComponentType;

const modules = [actions, disclosure, feedback, inputs];

/**
 * Demos keyed by registry name, built from the exports themselves: `ButtonDemo` becomes `button`,
 * `ThemeSwitchEclipseDemo` becomes `theme-switch-eclipse`.
 *
 * Adding a demo is therefore enough to publish it — name the export after the item and the item page picks it up.
 * Exports that don't match an item (a loading variant, an unused example) are simply ignored.
 */
function buildDemos(): Record<string, DemoComponent> {
  const found: Record<string, DemoComponent> = {};

  for (const demoModule of modules) {
    for (const [exportName, value] of Object.entries(demoModule)) {
      if (!exportName.endsWith("Demo") || typeof value !== "function") continue;

      const key = kebab(exportName.slice(0, -"Demo".length));
      if (found[key] === undefined) found[key] = value as DemoComponent;
    }
  }

  return found;
}

function kebab(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

export const demos: Record<string, DemoComponent> = buildDemos();

/** The demo for an item, if one exists. */
export function getDemo(name: string): DemoComponent | undefined {
  return demos[name];
}

/** Registry names that have a demo, useful for the library index. */
export function getDemoNames(): string[] {
  return Object.keys(demos);
}