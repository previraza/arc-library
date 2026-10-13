import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const root = fileURLToPath(new URL("../../packages/manicat", import.meta.url));
const shim = fileURLToPath(new URL("./src/react-native.ts", import.meta.url));
const stub = (name: string) => fileURLToPath(new URL(`./src/stubs/${name}.ts`, import.meta.url));
const extensions = [".web.tsx", ".web.ts", ".web.js", ".web.mjs", ".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"];

// Native modules the snippets use (clipboard, document picker) are replaced by their browser equivalents.
// The ports import from "react-native". Here that name is react-native-web, plus a color scheme the viewer can switch,
// which is what lets one browser tab show the light and dark tokens of a native screen.
export default defineConfig({
  plugins: [react()],
  define: { __DEV__: true, global: "globalThis" },
  resolve: { alias: [{ find: /^react-native$/, replacement: shim }, { find: "expo-clipboard", replacement: stub("expo-clipboard") }, { find: "expo-document-picker", replacement: stub("expo-document-picker") }, { find: "@", replacement: root }], extensions },
  optimizeDeps: { esbuildOptions: { resolveExtensions: extensions } },
  server: { fs: { allow: [root, fileURLToPath(new URL("..", import.meta.url))] } },
});
