import { createRoot } from "react-dom/client";
import "@/registry/foundation.css";
import "../../viewer-shared/viewer.css";
import "./phone.css";
import { App } from "./App";

// Stand-ins for the reader's own app, which the Usage snippets call into.
const wait = <T,>(done: () => T) => new Promise<T>((resolve) => setTimeout(() => resolve(done()), 600));
Object.assign(globalThis, {
  api: { subscribe: (email: string) => wait(() => console.info("subscribe", email)).then(() => undefined), signup: (details: unknown) => wait(() => console.info("signup", details)).then(() => undefined) },
  startOAuth: (provider: string) => console.info("startOAuth", provider),
});

createRoot(document.getElementById("root")!).render(<App />);
