import type { MDXComponents } from "mdx/types";
import defaultMdxComponents from "fumadocs-ui/mdx";
import { Steps } from "fumadocs-ui/components/steps";
import { AccentSwitcher } from "@/site/components/accent-switcher";
import { ThemeSwitch } from "@/site/components/theme-switch";
import { MotionPlayground } from "@/site/components/motion-playground";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    // Fumadocs ships Steps as a separate entry, so it is not part of the defaults.
    Steps,
    AccentSwitcher,
    ThemeSwitch,
    MotionPlayground,
    ...components,
  } satisfies MDXComponents;
}

/** The MDX compiler calls this through `providerImportSource`, set in fumadocs-mdx.config.ts. */
export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}