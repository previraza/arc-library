import { defineConfig } from "fumadocs-mdx/config";

export default defineConfig({
  mdxOptions: {
    // Every compiled MDX file resolves its components from site/mdx-components.tsx.
    providerImportSource: "@/site/mdx-components",
  },
});