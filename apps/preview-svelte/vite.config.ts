import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

const root = fileURLToPath(new URL("../../packages/manicat", import.meta.url));

// `@/registry/...` and `@/lib/...` resolve to the manicat package, exactly as they do once the ports are installed in a project.
export default defineConfig({
  plugins: [svelte()],
  resolve: { alias: { "@": root } },
  server: { fs: { allow: [root, fileURLToPath(new URL(".", import.meta.url))] } },
});
