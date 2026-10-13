import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { entries, loadDemo } from "./ports";
import { setColorScheme } from "./react-native";

const docsUrl = import.meta.env.VITE_DOCS_URL ?? "http://localhost:3000";
const frameFor = (name: string) => (name.startsWith("example:") ? `example/${name.slice(8)}` : `demo/${name}`);
const fromHash = () => decodeURIComponent(location.hash.slice(1)) || entries[0]?.name || "";

export function App() {
  const [current, setCurrent] = useState(fromHash);
  const [dark, setDark] = useState(() => matchMedia("(prefers-color-scheme: dark)").matches);
  const [compare, setCompare] = useState(true);
  const [loaded, setLoaded] = useState<{ name: string; component: ComponentType | undefined } | undefined>();
  // Until the new demo has loaded, the previous one is not shown.
  const Demo = loaded?.name === current && loaded.component ? { component: loaded.component } : undefined;

  useEffect(() => {
    const onHash = () => setCurrent(fromHash());
    addEventListener("hashchange", onHash);
    return () => removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.documentElement.classList.toggle("dark", dark);
    setColorScheme(dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    let live = true;
    void loadDemo(current).then((component) => live && setLoaded({ name: current, component }));
    return () => {
      live = false;
    };
  }, [current]);

  const groups = (["components", "blocks"] as const).map((kind) => ({ kind, items: entries.filter((entry) => entry.kind === kind) }));

  return (
    <div className="viewer">
      <nav className="viewer__nav" aria-label="React Native ports">
        {groups.map((group) => (
          <div key={group.kind}>
            <h2>
              {group.kind} · {group.items.length}
            </h2>
            {group.items.map((item) => (
              <a key={item.name} href={`#${item.name}`} aria-current={item.name === current ? "page" : undefined}>
                {item.name}
                {!item.hasDemo && <small>no demo</small>}
              </a>
            ))}
          </div>
        ))}
      </nav>
      <main className="viewer__main">
        <div className="viewer__bar">
          <h1>{current || "No React Native port yet"}</h1>
          <button type="button" aria-pressed={compare} onClick={() => setCompare(!compare)}>
            Compare with React
          </button>
          <button type="button" aria-pressed={dark} onClick={() => setDark(!dark)}>
            Dark
          </button>
        </div>
        <div className="viewer__panes">
          <section className="viewer__pane">
            <span>React Native (react-native-web)</span>
            <div className="viewer__stage viewer__stage--phone">
              <div className="phone">
                <div className="phone__screen">
                  {Demo ? <Demo.component /> : <p className="phone__empty">No demo yet: add apps/docs/content/usage/{current}.react-native.txt</p>}
                </div>
              </div>
            </div>
          </section>
          {compare && (
            <section className="viewer__pane">
              <span>React (docs)</span>
              <div className="viewer__stage">
                <iframe title={`${current} in React`} src={`${docsUrl}/frame/${frameFor(current)}`} />
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
