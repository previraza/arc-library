import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import { behindProxy } from "../viewer-shared/behind-proxy";
import { syncDemos } from "../viewer-shared/sync-demos";

const root = fileURLToPath(new URL("../../packages/manicat", import.meta.url));

// `@/registry/...` and `@/lib/...` resolve to the manicat package, exactly as they do once the ports are installed in a project.
// The docs site serves this viewer under /preview/vue through a rewrite, so every URL starts with that base.
export default defineConfig({
  base: "/preview/vue/",
  // Absolute URLs in the Usage snippets (such as /product.png) are the reader's public files, not modules to bundle.
  plugins: [behindProxy(), syncDemos("vue"), vue({ template: { transformAssetUrls: { includeAbsolute: false } } })],
  resolve: { alias: { "@": root } },
  server: { fs: { allow: [root, fileURLToPath(new URL("../..", import.meta.url))] } },
});
