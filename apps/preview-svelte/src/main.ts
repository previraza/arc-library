import { mount } from "svelte";
import "tailwindcss/preflight.css";
import "@fontsource-variable/geist";
import "@fontsource-variable/inter";
import "@/registry/foundation.css";
import "../../viewer-shared/viewer.css";
import App from "./App.svelte";

// index.html holds a loading skeleton in #app; Svelte appends instead of replacing, so clear it first.
const target = document.getElementById("app")!;
target.replaceChildren();
mount(App, { target });
