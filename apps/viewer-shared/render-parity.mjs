/**
 * Checks that a port renders the same thing as the React version. For every demo (the Usage snippet) and every example that a
 * framework has a file for, it opens the React frame of the docs and the framework's viewer in headless Chromium and compares
 * what is on screen: the number of buttons and controls, and every visible word. A port that differs is listed with what is
 * missing from it and what it adds.
 *
 *   pnpm dev                                  # the docs (3000) and the viewers (3001 to 3003)
 *   node apps/viewer-shared/render-parity.mjs [--fw vue,svelte,react-native] [--only button,badge] [--examples]
 *
 * Exit code 1 when something differs. Swift has no web viewer, so it is checked by the token and naming checks instead.
 * Set DOCS, VUE, SVELTE and REACT_NATIVE to other origins when the servers are elsewhere.
 */
import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const content = here("../docs/content/");
const args = process.argv.slice(2);
const flag = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);

const docs = process.env.DOCS ?? "http://localhost:3000";
const viewers = {
  vue: `${process.env.VUE ?? "http://localhost:3002"}/preview/vue/?embed#`,
  svelte: `${process.env.SVELTE ?? "http://localhost:3001"}/preview/svelte/?embed#`,
  "react-native": `${process.env.REACT_NATIVE ?? "http://localhost:3003"}/preview/react-native/?embed#`,
};
const frameworks = (flag("--fw")?.split(",") ?? Object.keys(viewers)).filter((id) => viewers[id]);
const only = flag("--only")?.split(",");
const wantExamples = !args.includes("--demos-only");

const jobs = [];
for (const fw of frameworks) {
  for (const file of readdirSync(`${content}usage`).filter((name) => name.endsWith(`.${fw}.txt`))) {
    const item = file.slice(0, -`.${fw}.txt`.length);
    if (!only || only.includes(item)) jobs.push({ fw, label: item, react: `${docs}/frame/demo/${item}`, port: `${viewers[fw]}${item}` });
  }
  if (wantExamples && existsSync(`${content}examples`)) {
    for (const file of readdirSync(`${content}examples`).filter((name) => name.endsWith(`.${fw}.txt`))) {
      const example = file.slice(0, -`.${fw}.txt`.length);
      if (!only || only.some((item) => example.toLowerCase().startsWith(item.replace(/-/g, "")))) {
        jobs.push({ fw, label: `example ${example}`, react: `${docs}/frame/example/${example}`, port: `${viewers[fw]}example:${example}` });
      }
    }
  }
}

const port = 9300 + Math.floor(Math.random() * 500);
const browser = spawn(process.env.CHROMIUM ?? "chromium", ["--headless=new", "--no-sandbox", "--disable-gpu", `--remote-debugging-port=${port}`, "--window-size=1000,900", "about:blank"], { stdio: "ignore" });
process.on("exit", () => browser.kill());

let target;
for (let tries = 0; tries < 50 && !target; tries += 1) {
  await sleep(200);
  target = await fetch(`http://127.0.0.1:${port}/json/list`).then((res) => res.json()).then((list) => list.find((entry) => entry.type === "page")).catch(() => undefined);
}
if (!target) {
  console.error("Could not reach Chromium.");
  process.exit(1);
}
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve) => (socket.onopen = resolve));
let id = 0;
const pending = new Map();
socket.onmessage = ({ data }) => {
  const message = JSON.parse(data);
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message.result ?? message.error);
    pending.delete(message.id);
  }
};
const send = (method, params = {}) => new Promise((resolve) => { pending.set(++id, resolve); socket.send(JSON.stringify({ id, method, params })); });
await send("Runtime.enable");
await send("Page.enable");

const probe = `(() => {
  const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !el.closest("[aria-hidden=true],[hidden],[inert]"); };
  const root = document.querySelector("main") || document.querySelector(".phone__screen") || document.querySelector(".viewer__stage") || document.body;
  const count = (selector) => [...root.querySelectorAll(selector)].filter(visible).length;
  const words = (root.innerText || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\\s+/).filter(Boolean);
  return { buttons: count("button,[role=button],[role=tab],[role=switch],[role=checkbox],[role=radio]"), fields: count("input,textarea,select,[role=textbox],[role=combobox],[role=slider]"), words: [...new Set(words)].sort() };
})()`;

async function look(url, wait) {
  // A hash-only change does not reload the page, so always come from a blank one.
  await send("Page.navigate", { url: "about:blank" });
  await send("Page.navigate", { url });
  await sleep(wait);
  return (await send("Runtime.evaluate", { expression: probe, returnByValue: true }))?.result?.value;
}

const reactCache = new Map();
let differing = 0;
for (const job of jobs) {
  if (!reactCache.has(job.react)) reactCache.set(job.react, await look(job.react, 1000));
  const react = reactCache.get(job.react);
  const port = await look(job.port, 1000);
  if (!react || !port) {
    differing += 1;
    console.log(`${job.label} [${job.fw}] could not be read (${react ? "viewer" : "React frame"})`);
    continue;
  }
  const missing = react.words.filter((word) => !port.words.includes(word));
  const extra = port.words.filter((word) => !react.words.includes(word));
  if (react.buttons !== port.buttons || react.fields !== port.fields || missing.length || extra.length) {
    differing += 1;
    console.log(`${job.label} [${job.fw}] React ${react.buttons} buttons, ${react.fields} fields; port ${port.buttons}, ${port.fields}${missing.length ? `; missing: ${missing.slice(0, 8).join(" ")}` : ""}${extra.length ? `; extra: ${extra.slice(0, 8).join(" ")}` : ""}`);
  }
}
console.log(`${jobs.length} renders compared, ${differing} differ.`);
process.exit(differing ? 1 : 0);
