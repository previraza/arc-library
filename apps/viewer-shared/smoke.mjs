/**
 * Opens a built viewer in headless Chromium, visits every demo and reports the ones that throw or draw nothing.
 *
 *   pnpm --filter @manicat/preview-vue build
 *   pnpm --filter @manicat/preview-vue exec vite preview --port 4002 &
 *   node apps/viewer-shared/smoke.mjs http://localhost:4002
 *
 * The viewers list their demos in the sidebar, so the list comes from the page itself.
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const url = process.argv[2];
if (!url) {
  console.error("Usage: smoke.mjs <viewer-url>");
  process.exit(1);
}

const port = 9300 + Math.floor(Math.random() * 500);
const browser = spawn(process.env.CHROMIUM ?? "chromium", ["--headless=new", "--no-sandbox", "--disable-gpu", `--remote-debugging-port=${port}`, "--window-size=1280,900", "about:blank"], { stdio: "ignore" });
const stop = () => browser.kill();
process.on("exit", stop);

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
let problems = [];
socket.onmessage = ({ data }) => {
  const message = JSON.parse(data);
  if (message.id && pending.has(message.id)) return pending.get(message.id)(message.result ?? message.error), pending.delete(message.id);
  if (message.method === "Runtime.exceptionThrown") problems.push(message.params.exceptionDetails.exception?.description?.split("\n")[0] ?? message.params.exceptionDetails.text);
  if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") problems.push(message.params.args.map((arg) => arg.value ?? arg.description ?? "").join(" ").split("\n")[0]);
};
const send = (method, params = {}) => new Promise((resolve) => (pending.set(++id, resolve), socket.send(JSON.stringify({ id, method, params }))));
const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result?.value;

await send("Runtime.enable");
await send("Page.enable");
await send("Page.navigate", { url });
await sleep(1500);

const names = await evaluate(`[...document.querySelectorAll(".viewer__nav a")].filter((link) => !link.querySelector("small")).map((link) => link.getAttribute("href").slice(1))`);
// The React frame is the docs site, which has its own console; only the port under test matters here.
await evaluate(`document.querySelector(".viewer__bar button[aria-pressed=true]")?.click()`);
const failures = [];
for (const name of names) {
  problems = [];
  await evaluate(`location.hash = ${JSON.stringify(name)}`);
  await sleep(450);
  const drawn = await evaluate(`(() => { const stage = document.querySelector(".viewer__stage"); return stage ? stage.innerText.trim().length + stage.querySelectorAll("*").length : 0; })()`);
  const own = problems.filter((text) => !/favicon|Failed to load resource|ERR_CONNECTION_REFUSED|frame\/demo/.test(text));
  if (own.length || !drawn) failures.push(`${name}: ${own[0] ?? "drew nothing"}`);
}

console.log(`${names.length} demos visited, ${failures.length} failing.`);
failures.forEach((failure) => console.log(`  - ${failure}`));
stop();
process.exit(failures.length ? 1 : 0);
