import { createApp } from "vue";
import "@fontsource-variable/geist";
import "@fontsource-variable/inter";
import "@/registry/foundation.css";
import "../../viewer-shared/viewer.css";
import App from "./App.vue";

// Stand-ins for the reader's own app, which the Usage snippets call into.
const app = createApp(App);
app.config.globalProperties.$router = { push: (to: string) => console.info("router.push", to) };
app.config.globalProperties.startOAuth = (provider: string) => console.info("startOAuth", provider);
Object.assign(globalThis, {
  api: {
    subscribe: (email: string) => new Promise<void>((resolve) => setTimeout(() => (console.info("subscribe", email), resolve()), 600)),
    signup: (details: unknown) => new Promise<void>((resolve) => setTimeout(() => (console.info("signup", details), resolve()), 600)),
  },
});
app.mount("#app");
