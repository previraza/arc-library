"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Code2, Eye, Maximize2, Minimize2, RotateCw, Scan, Smartphone } from "lucide-react";

type Size = "fit" | "mobile";

/** 1 is portrait, 0 landscape. */
type Orientation = 1 | 0;
const nextOrientation: Record<Orientation, Orientation> = { 1: 0, 0: 1 };
const orientationName: Record<Orientation, string> = { 1: "portrait", 0: "landscape" };

const sizes: { id: Size; label: string; Icon: typeof Scan }[] = [
  { id: "fit", label: "Fit", Icon: Scan },
  { id: "mobile", label: "Mobile", Icon: Smartphone },
];

export type PreviewShellProps = {
  /** The live example. */
  children: ReactNode;
  /** The code pane. Without it the Preview/Code tabs are not shown. */
  code?: ReactNode;
  /** Accessible name, e.g. "Morph select preview". */
  label: string;
  /** Plain surface without the dot grid, for examples that draw their own background. */
  bare?: boolean;
};

/**
 * The viewer around a live example: Preview/Code tabs, a Fit/Mobile width switch and a fullscreen toggle.
 * The preview stays mounted in every mode (fullscreen only re-positions it), so the example never loses its state.
 */
export function PreviewShell({ children, code, label, bare }: PreviewShellProps) {
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [size, setSize] = useState<Size>("fit");
  const [full, setFull] = useState(false);
  const [orientation, setOrientation] = useState<Orientation>(1);
  const titleId = useId();
  const [stageWidth, setStageWidth] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setStageWidth(entry.contentRect.width));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!full) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setFull(false);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [full]);

  const showCode = tab === "code" && code;

  return (
    <div
      role={full ? "dialog" : undefined}
      aria-modal={full || undefined}
      aria-labelledby={full ? titleId : undefined}
      className={
        full
          ? "arc-fullscreen-in fixed inset-0 z-[60] flex flex-col gap-3 bg-fd-background p-3 sm:p-5"
          : "flex flex-col gap-3"
      }
    >
      <span id={titleId} className="sr-only">
        {label}
      </span>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {code ? (
          <div role="tablist" aria-label={label} className="inline-flex rounded-[var(--radius-pill)] border border-fd-border p-0.5">
            {(
              [
                { id: "preview", text: "Preview", Icon: Eye },
                { id: "code", text: "Code", Icon: Code2 },
              ] as const
            ).map(({ id, text, Icon }) => (
              <button
                key={id}
                role="tab"
                type="button"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className="flex items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1 text-xs text-fd-muted-foreground transition-colors hover:text-fd-foreground aria-selected:bg-fd-accent aria-selected:text-fd-foreground"
              >
                <Icon className="size-3.5" aria-hidden /> {text}
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-3">
          <span className="hidden text-[11px] text-fd-muted-foreground sm:inline">Live · keyboard ready</span>
          <div role="radiogroup" aria-label="Preview size" className="inline-flex rounded-[var(--radius-pill)] border border-fd-border p-0.5">
            {sizes.map(({ id, label: text, Icon }) => (
              <button
                key={id}
                role="radio"
                type="button"
                aria-checked={size === id}
                aria-label={text}
                title={text}
                onClick={() => {
                  setSize(id);
                  setTab("preview");
                }}
                className="grid size-7 place-items-center rounded-[var(--radius-pill)] text-fd-muted-foreground transition-colors hover:text-fd-foreground aria-checked:bg-fd-accent aria-checked:text-fd-foreground"
              >
                <Icon className="size-3.5" aria-hidden />
              </button>
            ))}
          </div>
          {size === "mobile" && (
            <button
              type="button"
              aria-label={`Rotate device, now ${orientationName[orientation]}`}
              title={`Rotate (${orientationName[orientation]})`}
              onClick={() => setOrientation((current) => nextOrientation[current])}
              className="arc-fade-in grid size-8 place-items-center rounded-[var(--radius-pill)] border border-fd-border text-fd-muted-foreground transition-colors hover:text-fd-foreground"
            >
              <RotateCw className="size-3.5" aria-hidden />
            </button>
          )}
          <button
            type="button"
            aria-label={full ? "Exit fullscreen" : "Fullscreen preview"}
            title={full ? "Exit fullscreen (Esc)" : "Fullscreen"}
            aria-haspopup="dialog"
            onClick={() => setFull((value) => !value)}
            className="grid size-8 place-items-center rounded-[var(--radius-pill)] border border-fd-border text-fd-muted-foreground transition-colors hover:text-fd-foreground"
          >
            {full ? <Minimize2 className="size-3.5" aria-hidden /> : <Maximize2 className="size-3.5" aria-hidden />}
          </button>
        </div>
      </div>

      {/* Both panes stay mounted: switching tabs or size must not reset the example's state. */}
      <div hidden={Boolean(showCode)} className={full ? "arc-fade-in min-h-0 flex-1" : "arc-fade-in"}>
        <div
          ref={stageRef}
          className={`relative flex items-center justify-center overflow-auto rounded-[var(--radius-surface)] border border-fd-border bg-fd-background p-6 transition-[min-height] duration-500 ease-[var(--ease-standard)] motion-reduce:transition-none sm:p-10 ${
            full ? "h-full" : size === "mobile" ? "min-h-[720px]" : "min-h-56"
          }`}
          style={
            bare
              ? undefined
              : {
                  backgroundImage:
                    "radial-gradient(color-mix(in oklab, var(--color-fd-foreground) 8%, transparent) 1px, transparent 1px)",
                  backgroundSize: "16px 16px",
                }
          }
        >
          <Device mobile={size === "mobile"} full={full} orientation={orientation} stageWidth={stageWidth}>
            {children}
          </Device>
        </div>
      </div>
      {code && (
        <div hidden={!showCode} className={full ? "arc-fade-in min-h-0 flex-1 overflow-auto" : "arc-fade-in"}>
          {code}
        </div>
      )}
    </div>
  );
}

const ease = "ease-[var(--ease-standard)]";

/**
 * One element that is either the plain preview column or a phone. The phone is sized from the real screen in pixels
 * (1170 × 2532) divided by `--mobile-ratio`, and `--mobile-orientation` turns it: 1 portrait, 0 landscape.
 * Width, height and the bezel are transitions, so the phone grows around the example and turns when rotated.
 */
function Device({
  mobile,
  full,
  orientation,
  stageWidth,
  children,
}: {
  mobile: boolean;
  full: boolean;
  orientation: Orientation;
  stageWidth: number;
  children: ReactNode;
}) {
  const angle = "var(--mobile-angle)";
  const turned = (portrait: string, landscape: string) =>
    `calc(${portrait} * abs(cos(${angle})) + ${landscape} * abs(sin(${angle})))`;
  // How much of the 44px island side and 20px home-bar side each edge of the screen gives up, for any angle.
  const edge = (island: string, home: string) => `calc(16px + 52px * max(${island}, 0) + 24px * max(${home}, 0))`;
  const c = `cos(${angle})`;
  const sn = `sin(${angle})`;

  // Turned on its side the phone is 2532/ratio wide: shrink the ratio's scale until it fits the stage (stage padding is 48px a side).
  const base = full ? 3.4 : 3.6;
  const fits = stageWidth > 0 ? 2532 / Math.max(stageWidth - 96, 320) : 0;
  const ratio = orientation === 0 ? Math.max(base, fits) : base;

  const frame = {
    "--mobile-ratio": ratio,
    "--mobile-orientation": orientation,
    "--mobile-angle": "calc((var(--mobile-orientation) - 1) * 90deg)",
    "--device-width": "calc(1170px / var(--mobile-ratio))",
    "--device-height": "calc(2532px / var(--mobile-ratio))",
    interpolateSize: "allow-keywords",
    width: mobile ? turned("var(--device-width)", "var(--device-height)") : "min(100%, 42rem)",
    height: mobile ? turned("var(--device-height)", "var(--device-width)") : "auto",
    padding: mobile ? 9 : 0,
    borderRadius: mobile ? "2.75rem" : "0rem",
    backgroundColor: mobile ? "color-mix(in oklab, var(--color-fd-foreground) 90%, transparent)" : "transparent",
    boxShadow: mobile
      ? "0 0 0 1px rgb(0 0 0 / 0.12), 0 30px 70px -24px rgb(0 0 0 / 0.45)"
      : "0 0 0 0 rgb(0 0 0 / 0), 0 0 0 0 rgb(0 0 0 / 0)",
  } as CSSProperties;

  const content = {
    paddingTop: mobile ? edge(c, `-1 * ${c}`) : 0,
    paddingBottom: mobile ? edge(`-1 * ${c}`, c) : 0,
    paddingLeft: mobile ? edge(`-1 * ${sn}`, sn) : 0,
    paddingRight: mobile ? edge(sn, `-1 * ${sn}`) : 0,
  } as CSSProperties;

  // The chrome keeps the portrait proportions and turns around the centre of the screen.
  const chrome = {
    width: "var(--device-width)",
    height: "var(--device-height)",
    transform: `translate(-50%, -50%) rotate(${angle})`,
  } as CSSProperties;

  const fade = `transition-opacity duration-300 ${ease} motion-reduce:transition-none ${mobile ? "opacity-100" : "opacity-0"}`;

  return (
    <div
      className={`relative z-10 shrink-0 transition-[width,height,padding,border-radius,background-color,box-shadow] duration-500 ${ease} motion-reduce:transition-none`}
      style={frame}
    >
      <div
        className={`relative h-full w-full overflow-hidden bg-fd-background transition-[border-radius] duration-500 ${ease} motion-reduce:transition-none`}
        style={{ borderRadius: mobile ? "2.3rem" : "0rem" }}
      >
        <div
          className={`flex h-full w-full items-center justify-center transition-[padding] duration-500 ${ease} motion-reduce:transition-none ${mobile ? "overflow-auto p-4" : ""}`}
          style={content}
        >
          <div className="flex w-full items-center justify-center">{children}</div>
        </div>

        <div aria-hidden className={`pointer-events-none absolute left-1/2 top-1/2 transition-[transform,opacity] duration-500 ${ease} motion-reduce:transition-none ${mobile ? "opacity-100" : "opacity-0"}`} style={chrome}>
          <span className="absolute left-1/2 top-2 h-[22px] w-[84px] -translate-x-1/2 rounded-full bg-fd-foreground/90" />
          <span className="absolute left-7 top-2 flex h-[22px] items-center text-[11px] font-medium leading-none text-fd-foreground">9:41</span>
          <span className="absolute right-7 top-2 flex h-[22px] items-center text-[11px] leading-none tracking-widest text-fd-foreground">●●●</span>
          <span className="absolute bottom-2 left-1/2 h-1 w-28 -translate-x-1/2 rounded-full bg-fd-foreground/80" />
        </div>
      </div>

      <span aria-hidden className={`absolute -left-[3px] top-24 h-8 w-[3px] rounded-l bg-fd-foreground/70 ${fade}`} />
      <span aria-hidden className={`absolute -left-[3px] top-36 h-12 w-[3px] rounded-l bg-fd-foreground/70 ${fade}`} />
      <span aria-hidden className={`absolute -right-[3px] top-32 h-16 w-[3px] rounded-r bg-fd-foreground/70 ${fade}`} />
    </div>
  );
}
