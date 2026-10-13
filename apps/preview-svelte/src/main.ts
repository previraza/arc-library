import { mount } from "svelte";
import "tailwindcss/preflight.css";
import "@fontsource-variable/geist";
import "@fontsource-variable/inter";
import "@/registry/foundation.css";
import "../../viewer-shared/viewer.css";
import App from "./App.svelte";

mount(App, { target: document.getElementById("app")! });
