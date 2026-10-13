import { mount } from "svelte";
import "@/registry/foundation.css";
import "./viewer.css";
import App from "./App.svelte";

mount(App, { target: document.getElementById("app")! });
