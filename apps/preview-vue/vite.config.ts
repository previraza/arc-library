import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

const root = fileURLToPath(new URL("../../packages/manicat", import.meta.url));

// `@/registry/...` and `@/lib/...` resolve to the manicat package, exactly as they do once the ports are installed in a project.
export default defineConfig({
  // Absolute URLs in the Usage snippets (such as /product.png) are the reader's public files, not modules to bundle.
  plugins: [vue({ template: { transformAssetUrls: { includeAbsolute: false } } })],
  resolve: { alias: { "@": root } },
  server: { fs: { allow: [root, fileURLToPath(new URL("..", import.meta.url))] } },
});
