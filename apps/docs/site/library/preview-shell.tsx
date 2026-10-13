"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { Code2, Eye, Maximize2, Minimize2, Scan, Smartphone } from "lucide-react";

type Size = "fit" | "mobile";

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
  const titleId = useId();

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
          ? "fixed inset-0 z-[60] flex flex-col gap-3 bg-fd-background p-3 sm:p-5"
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
      <div hidden={Boolean(showCode)} className={full ? "min-h-0 flex-1" : undefined}>
        <div
          className={`relative flex items-center justify-center overflow-auto rounded-[var(--radius-surface)] border border-fd-border bg-fd-background p-6 sm:p-10 ${
            full ? "h-full" : "min-h-56"
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
          <div
            className={
              size === "mobile"
                ? "relative z-10 flex w-[390px] max-w-full items-center justify-center self-center rounded-[var(--radius-surface)] border border-fd-border bg-fd-background p-5 shadow-sm"
                : "relative z-10 flex w-full max-w-2xl items-center justify-center"
            }
          >
            {children}
          </div>
        </div>
      </div>
      {code && (
        <div hidden={!showCode} className={full ? "min-h-0 flex-1 overflow-auto" : undefined}>
          {code}
        </div>
      )}
    </div>
  );
}
