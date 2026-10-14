<script lang="ts" module>
  /** Where the control is in its life: resting, asking, working, finished, or failed. */
  export type ConfirmMorphState = "idle" | "confirming" | "pending" | "done" | "error";
</script>

<script lang="ts">
  // @manicat-dependencies motion @lucide/svelte
  import { animate, motionValue } from "motion";
  import type { AnimationPlaybackControls } from "motion";
  import { onMount, tick } from "svelte";
  import type { Snippet } from "svelte";
  import { CircleAlert, LoaderCircle } from "@lucide/svelte";
  import { motionTokens } from "@/lib/motion-tokens";

  interface Props {
    /** The resting label, such as "Delete". */
    label: string;
    /** A plain icon before the resting label. */
    icon?: Snippet;
    /** The question shown while confirming, such as "Delete 3 files?". Defaults to the label with a question mark. */
    prompt?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    /** Shown beside the spinner while `onConfirm` resolves. */
    pendingLabel?: string;
    doneLabel?: string;
    errorLabel?: string;
    retryLabel?: string;
    undoLabel?: string;
    /** Shown beside the spinner while `onUndo` resolves. */
    undoingLabel?: string;
    /** `danger` colours the resting label red and gives the pill a faint red edge; the confirm button always follows the accent. `neutral` keeps the resting label on the foreground for important, reversible actions. */
    tone?: "danger" | "neutral";
    /** Runs on confirm. Return a promise to show the pending face; a rejection shows the error face with Retry. */
    onConfirm?: () => void | Promise<unknown>;
    /** Offering it adds Undo to the result. Return a promise to show a pending face while it runs. */
    onUndo?: () => void | Promise<unknown>;
    onCancel?: () => void;
    /** Where the control is. Bind it with `bind:state`; without it the control keeps its own, starting at `defaultState`. */
    state?: ConfirmMorphState;
    defaultState?: ConfirmMorphState;
    onStateChange?: (state: ConfirmMorphState) => void;
    /** Milliseconds before an unanswered question returns to rest. Resting the pointer on the control pauses it. 0 turns it off. */
    confirmTimeout?: number;
    /** Milliseconds a result stays before returning to rest. Resting the pointer on the control pauses it. 0 turns it off. */
    resultTimeout?: number;
    /** A press outside the control cancels an open question. Defaults to true. */
    cancelOnOutsidePress?: boolean;
    disabled?: boolean;
    class?: string;
    /** Extend the inner, named parts of the confirm morph: prompt, secondary, primary, status, spinner, statusText, trigger, icon or surface. */
    classNames?: { prompt?: string; secondary?: string; primary?: string; status?: string; spinner?: string; statusText?: string; trigger?: string; icon?: string; surface?: string };
  }

  let { label, icon, prompt, confirmLabel = "Delete", cancelLabel = "Cancel", pendingLabel = "Deleting", doneLabel = "Deleted", errorLabel = "Couldn’t finish", retryLabel = "Retry", undoLabel = "Undo", undoingLabel = "Restoring", tone = "danger", onConfirm, onUndo, onCancel, state: stateProp = $bindable(), defaultState = "idle", onStateChange, confirmTimeout = 6000, resultTimeout = 5000, cancelOnOutsidePress = true, disabled = false, class: className, classNames }: Props = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { blur } = motionTokens;
  const TRAVEL = 12;
  const enterEase = [...motionTokens.ease.enter] as [number, number, number, number];
  /** Duration springs restated as stiffness and damping so a retarget keeps the velocity already in flight. */
  const physical = (visualDuration: number, bounce: number) => {
    const root = (2 * Math.PI) / (visualDuration * 1.2);
    return { type: "spring" as const, stiffness: root * root, damping: 2 * (1 - bounce) * root, mass: 1 };
  };
  const GROW = physical(0.44, 0.18);
  const SHRINK = physical(0.34, 0);
  const SLIDE = physical(0.36, 0.06);
  const uid = $props.id();
  const promptId = `${uid}-prompt`;
  let root: HTMLElement;
  let surface: HTMLElement;
  let inner = $state<ConfirmMorphState>(defaultState);
  const current = $derived(stateProp ?? inner);
  let direction = 1;
  let working = $state<"confirm" | "undo">("confirm");
  let announcement = $state("");
  let live: ConfirmMorphState = current;
  let pendingFocus = false;
  let runToken = 0;

  function go(next: ConfirmMorphState) {
    if (next === live) return;
    // Focus follows the control between faces, but only when it was already inside; a timeout never steals focus from elsewhere.
    pendingFocus = !!root && (root.contains(document.activeElement) || document.activeElement === document.body);
    // Every step moves forward except the return to rest, which comes back from the left.
    direction = next === "idle" ? -1 : 1;
    live = next;
    inner = next;
    stateProp = next;
    onStateChange?.(next);
  }
  const toIdle = () => { runToken++; go("idle"); };
  async function perform(kind: "confirm" | "undo") {
    const handler = kind === "confirm" ? onConfirm : onUndo;
    const token = ++runToken;
    working = kind;
    let result: void | Promise<unknown> | undefined;
    try { result = handler?.(); }
    catch { go("error"); announcement = errorLabel; return; }
    if (result && typeof (result as Promise<unknown>).then === "function") {
      go("pending");
      announcement = kind === "confirm" ? pendingLabel : undoingLabel;
      try { await result; }
      catch {
        if (token !== runToken) return;
        go("error");
        announcement = errorLabel;
        return;
      }
      if (token !== runToken) return;
    }
    if (kind === "undo") { go("idle"); announcement = "Undone"; return; }
    go("done");
    announcement = onUndo ? `${doneLabel}. ${undoLabel} is available.` : doneLabel;
  }
  function cancel() {
    onCancel?.();
    toIdle();
    announcement = "Cancelled";
  }
  const expire = () => (live === "confirming" ? cancel() : toIdle());

  // The shape: one surface whose width springs to whichever face is current. At rest it is auto.
  const width = motionValue<number | "auto">("auto");
  width.on("change", (value) => surface && (surface.style.width = typeof value === "number" ? `${value}px` : value));
  let target = 0;
  let flight = 0;
  function onFaceSize(id: ConfirmMorphState, w: number) {
    if (id !== live || Math.abs(w - target) < 0.5) return;
    const from = target;
    target = w;
    if (!from || reduced) return void width.jump("auto");
    if (width.get() === "auto") width.jump(from);
    const token = ++flight;
    animate(width as never, w, (w > from ? GROW : SHRINK) as never).then(() => { if (token === flight) width.jump("auto"); });
  }
  /** Measures the natural width of a face, not the width a tight container squeezes it to, so squeezing never feeds back into the spring. */
  function watchFace(node: HTMLElement, id: ConfirmMorphState) {
    const report = () => {
      if (node.dataset.leaving !== undefined) return;
      const flex = node.style.flex;
      node.style.flex = "none";
      const natural = node.offsetWidth;
      node.style.flex = flex;
      onFaceSize(id, natural);
    };
    report();
    const observer = new ResizeObserver(report);
    observer.observe(node);
    return { destroy: () => observer.disconnect() };
  }

  // The timeout runs as an invisible clock. A pointer resting on the control holds it, and so does a hidden tab.
  const drain = motionValue(1);
  let clock: AnimationPlaybackControls | null = null;
  const holds = { hover: false, hidden: false };
  const timeout = $derived(current === "confirming" ? confirmTimeout : current === "done" || current === "error" ? resultTimeout : 0);
  function sync() {
    if (!clock) return;
    if (holds.hover || holds.hidden) clock.pause();
    else clock.play();
  }
  $effect(() => {
    current;
    if (clock) { clock.stop(); clock = null; }
    if (!timeout) return;
    drain.jump(1);
    const control = animate(drain as never, 0, { duration: timeout / 1000, ease: "linear" } as never);
    clock = control;
    control.then(() => { if (clock === control) { clock = null; expire(); } });
    sync();
    return () => { if (clock === control) clock = null; control.stop(); };
  });
  onMount(() => {
    const onVisibility = () => { holds.hidden = document.hidden; sync(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  });
  // An outside press answers the question with no.
  $effect(() => {
    if (current !== "confirming" || !cancelOnOutsidePress) return;
    const down = (event: PointerEvent) => { if (!root.contains(event.target as Node)) cancel(); };
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
  });
  // Focus lands on the safe choice: Cancel while asking, Undo or Retry on a result, the root while working, the trigger at rest.
  $effect(() => {
    const value = current;
    tick().then(() => {
      if (!pendingFocus) return;
      pendingFocus = false;
      const face = root.querySelector<HTMLElement>(`[data-face="${value}"]`);
      const autofocus = face?.querySelector<HTMLElement>("[data-autofocus]:not(:disabled)");
      (autofocus ?? root).focus({ preventScroll: true });
    });
  });

  function onkeydown(event: KeyboardEvent) {
    if (event.key !== "Escape") return;
    if (current === "confirming") { event.preventDefault(); event.stopPropagation(); cancel(); }
    else if (current === "done" || current === "error") { event.preventDefault(); event.stopPropagation(); toIdle(); }
  }

  // Forward steps arrive from the right, backward steps from the left; the old face leaves the other way, blurred, so the eye reads one morph.
  function faceIn(node: HTMLElement) {
    if (reduced) {
      animate(node, { opacity: [0, 1] }, { duration: 0.14 });
      return { duration: 140 };
    }
    animate(node, { x: [direction * TRAVEL, 0] } as never, SLIDE as never);
    animate(node, { opacity: [0, 1], filter: [`blur(${blur.soft}px)`, "blur(0px)"] } as never, { opacity: { duration: 0.2, ease: enterEase, delay: 0.04 }, filter: { duration: 0.22, ease: enterEase, delay: 0.04 } } as never);
    // The success disc pops in with a tick drawing across it, the moment the action lands.
    const disc = node.querySelector<SVGCircleElement>("[data-disc]");
    const tick = node.querySelector<SVGPathElement>("[data-tick]");
    if (disc) animate(disc, { scale: [0.4, 1], opacity: [0, 1] } as never, { scale: physical(0.34, 0.3), opacity: { duration: 0.12 } } as never);
    if (tick) animate(tick, { pathLength: [0, 1] } as never, { duration: 0.28, ease: enterEase, delay: 0.12 } as never);
    return { duration: 260 };
  }
  function faceOut(node: HTMLElement) {
    node.dataset.leaving = "";
    node.setAttribute("inert", "");
    if (reduced) {
      animate(node, { opacity: 0 }, { duration: 0.1 });
      return { duration: 100 };
    }
    animate(node, { x: direction * -TRAVEL * 0.6 } as never, SLIDE as never);
    animate(node, { opacity: 0, filter: `blur(${blur.soft}px)` } as never, { opacity: { duration: 0.12, ease: [...motionTokens.ease.standard] }, filter: { duration: 0.12, ease: [...motionTokens.ease.standard] } } as never);
    return { duration: 120 };
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_static_element_interactions -->
<div bind:this={root} class={["mc-confirm-morph__root", className]} data-state={current} data-tone={tone} data-disabled={disabled || undefined} tabindex="-1" aria-busy={current === "pending" || undefined} {onkeydown} onpointerenter={() => { holds.hover = true; sync(); }} onpointerleave={() => { holds.hover = false; sync(); }} onpointercancel={() => { holds.hover = false; sync(); }}>
  <div bind:this={surface} class={["mc-confirm-morph__surface", classNames?.surface]}>
    {#key current}
      <div class="mc-confirm-morph__face" data-face={current} role={current === "confirming" ? "group" : undefined} aria-labelledby={current === "confirming" ? promptId : undefined} use:watchFace={current} in:faceIn out:faceOut>
        {#if current === "confirming"}
          <span id={promptId} class={["mc-confirm-morph__prompt", classNames?.prompt]}>{prompt ?? `${label}?`}</span>
          <button type="button" class={["mc-confirm-morph__secondary", classNames?.secondary]} data-autofocus onclick={cancel}>{cancelLabel}</button>
          <button type="button" class={["mc-confirm-morph__primary", classNames?.primary]} onclick={() => perform("confirm")}>{confirmLabel}</button>
        {:else if current === "pending"}
          <span class={["mc-confirm-morph__status", classNames?.status]}>
            <LoaderCircle class={["mc-confirm-morph__spinner", classNames?.spinner]} size={16} strokeWidth={1.75} aria-hidden="true" />
            <span>{working === "undo" ? undoingLabel : pendingLabel}</span>
          </span>
        {:else if current === "done"}
          <span class={["mc-confirm-morph__status", classNames?.status]} data-tone="success">
            <svg class="mc-confirm-morph__check" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle data-disc class="mc-confirm-morph__checkDisc" cx="9" cy="9" r="8" style="transform-origin: 9px 9px" /><path data-tick class="mc-confirm-morph__checkTick" d="M5.6 9.3 7.8 11.4 12.4 6.7" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" /></svg>
            <span class={["mc-confirm-morph__statusText", classNames?.statusText]}>{doneLabel}</span>
          </span>
          {#if onUndo}<button type="button" class={["mc-confirm-morph__secondary", classNames?.secondary]} data-autofocus onclick={() => perform("undo")}>{undoLabel}</button>{/if}
        {:else if current === "error"}
          <span class={["mc-confirm-morph__status", classNames?.status]} data-tone="danger"><CircleAlert size={16} strokeWidth={1.75} aria-hidden="true" /><span class={["mc-confirm-morph__statusText", classNames?.statusText]}>{errorLabel}</span></span>
          <button type="button" class={["mc-confirm-morph__secondary", classNames?.secondary]} data-autofocus onclick={() => perform(working)}>{retryLabel}</button>
        {:else}
          <button type="button" class={["mc-confirm-morph__trigger", classNames?.trigger]} data-autofocus {disabled} onclick={() => { announcement = prompt ?? ""; go("confirming"); }}>
            {#if icon}<span class={["mc-confirm-morph__icon", classNames?.icon]} aria-hidden="true">{@render icon()}</span>{/if}
            <span>{label}</span>
          </button>
        {/if}
      </div>
    {/key}
  </div>
  <span class="mc-confirm-morph__srOnly" role="status" aria-live="polite">{announcement}</span>
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* The root holds the control in the flow of the page; the surface inside it springs between faces. */
.mc-confirm-morph__root {
  position: relative;
  display: inline-flex;
  min-width: 0;
  max-width: 100%;
  vertical-align: middle;
  color: var(--foreground);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  letter-spacing: var(--tracking-body);
  line-height: 1;
  -webkit-tap-highlight-color: transparent;
}

/* One pill for every state. The current face sits in the flow and centres itself; the border is an overlay so it never changes a measurement. */
.mc-confirm-morph__surface {
  position: relative;
  display: flex;
  height: var(--control-height-sm);
  max-width: 100%;
  justify-content: center;
  overflow: clip;
  border-radius: var(--radius-pill);
  background: var(--surface-raised);
  box-shadow: var(--shadow-resting);
  /* Release springs back; the press itself is quick (below). */
  transition: background-color var(--duration-standard) var(--ease-standard), box-shadow var(--duration-standard) var(--ease-standard), transform var(--duration-spring) var(--ease-spring);
}
.mc-confirm-morph__surface::after { content: ""; position: absolute; inset: 0; border: 1px solid var(--border); border-radius: inherit; pointer-events: none; transition: border-color var(--duration-standard) var(--ease-standard); }
/* Danger stays quiet: red text and a faint red edge on a neutral pill. The confirm button follows the accent like every other primary action. */
.mc-confirm-morph__root[data-tone="danger"] .mc-confirm-morph__surface { background: color-mix(in oklab, var(--danger) 4%, var(--surface-raised)); box-shadow: none; }
.mc-confirm-morph__root[data-tone="danger"] .mc-confirm-morph__surface::after { border-color: color-mix(in oklab, var(--danger) 18%, var(--border)); }
.mc-confirm-morph__root[data-tone="danger"][data-state="confirming"] .mc-confirm-morph__surface { background: var(--surface-raised); box-shadow: var(--shadow-resting); }
.mc-confirm-morph__root[data-tone="danger"][data-state="confirming"] .mc-confirm-morph__surface::after { border-color: color-mix(in oklab, var(--danger) 24%, var(--border)); }
.mc-confirm-morph__root[data-tone="danger"]:is([data-state="pending"], [data-state="done"]) .mc-confirm-morph__surface { background: var(--surface-raised); box-shadow: var(--shadow-resting); }
.mc-confirm-morph__root[data-tone="danger"]:is([data-state="pending"], [data-state="done"]) .mc-confirm-morph__surface::after { border-color: var(--border); }
.mc-confirm-morph__root[data-disabled][data-state="idle"] .mc-confirm-morph__surface { background: var(--surface-raised); box-shadow: none; }
.mc-confirm-morph__root[data-disabled][data-state="idle"] .mc-confirm-morph__surface::after { border-color: var(--border-subtle); }
.mc-confirm-morph__root:has(.mc-confirm-morph__trigger:active:not(:disabled)) .mc-confirm-morph__surface { transform: scale(.96); transition-duration: var(--duration-standard), var(--duration-standard), 90ms; transition-timing-function: var(--ease-standard), var(--ease-standard), ease-out; }

.mc-confirm-morph__face { display: flex; min-width: 0; height: 100%; flex: 0 1 auto; align-items: center; gap: 2px; padding: 0 4px; white-space: nowrap; will-change: transform, filter; }
.mc-confirm-morph__face[data-face="idle"] { padding: 0; }
/* A leaving face steps out of the flow and stays centred while the surface springs to the next one. */
.mc-confirm-morph__face[inert] { position: absolute; top: 0; left: 50%; translate: -50% 0; pointer-events: none; }

.mc-confirm-morph__trigger {
  display: inline-flex;
  height: 100%;
  align-items: center;
  gap: 8px;
  padding: 0 15px 0 13px;
  border: 0;
  border-radius: inherit;
  background: transparent;
  color: var(--foreground);
  cursor: pointer;
  font: inherit;
  font-weight: 500;
  transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard);
}
.mc-confirm-morph__face[data-face="idle"] { border-radius: var(--radius-pill); }
.mc-confirm-morph__root[data-tone="danger"] .mc-confirm-morph__trigger { color: var(--danger); }
.mc-confirm-morph__trigger:disabled { color: var(--text-muted) !important; cursor: not-allowed; }
.mc-confirm-morph__trigger:disabled .mc-confirm-morph__icon { opacity: .7; }
.mc-confirm-morph__icon { display: grid; width: 16px; height: 16px; place-items: center; }
.mc-confirm-morph__icon > svg { width: 16px; height: 16px; }

.mc-confirm-morph__prompt { min-width: 3ch; flex: 0 1 auto; max-width: 16rem; overflow: hidden; padding: 0 6px 0 11px; color: var(--foreground); font-weight: 500; font-variant-numeric: tabular-nums; line-height: 1.3; text-overflow: ellipsis; }

.mc-confirm-morph__secondary,
.mc-confirm-morph__primary {
  display: inline-flex;
  flex: none;
  height: calc(var(--control-height-sm) - 8px);
  align-items: center;
  padding: 0 11px;
  border: 0;
  border-radius: var(--radius-pill);
  cursor: pointer;
  font: inherit;
  font-weight: 500;
  transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), transform var(--duration-spring) var(--ease-spring);
}
.mc-confirm-morph__secondary { background: transparent; color: var(--text-secondary); }
.mc-confirm-morph__face:is([data-face="done"], [data-face="error"]) .mc-confirm-morph__secondary { color: var(--foreground); }
.mc-confirm-morph__primary { background: var(--accent); color: var(--accent-foreground); }
.mc-confirm-morph__secondary:active,
.mc-confirm-morph__primary:active { transform: scale(.95); transition-duration: var(--duration-fast), var(--duration-fast), 90ms; }

.mc-confirm-morph__status { display: inline-flex; align-items: center; gap: 7px; padding: 0 8px 0 10px; color: var(--foreground); font-weight: 500; font-variant-numeric: tabular-nums; }
.mc-confirm-morph__status > svg { flex: none; }
.mc-confirm-morph__status[data-tone="success"] > svg { color: var(--success); }
.mc-confirm-morph__face[data-face="done"]:not(:has(.mc-confirm-morph__secondary)) .mc-confirm-morph__status { padding-right: 12px; }
.mc-confirm-morph__status[data-tone="danger"] > svg { color: var(--danger); }
.mc-confirm-morph__statusText { line-height: 1.3; }
.mc-confirm-morph__face[data-face="pending"] .mc-confirm-morph__status { padding-inline: 14px 16px; color: var(--text-secondary); }
.mc-confirm-morph__check { width: 18px; height: 18px; }
.mc-confirm-morph__checkDisc { fill: var(--success); }
.mc-confirm-morph__checkTick { stroke: var(--background); }
.mc-confirm-morph__spinner { animation: mc-confirm-morph-spin .7s linear infinite; }
@keyframes mc-confirm-morph-spin { to { transform: rotate(360deg); } }

.mc-confirm-morph__srOnly { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }

@media (hover: hover) and (pointer: fine) {
  .mc-confirm-morph__trigger:hover:not(:disabled) { background: color-mix(in oklab, var(--foreground) 5%, transparent); }
  .mc-confirm-morph__root[data-tone="danger"] .mc-confirm-morph__trigger:hover:not(:disabled) { background: color-mix(in oklab, var(--danger) 8%, transparent); }
  .mc-confirm-morph__secondary:hover { background: color-mix(in oklab, var(--foreground) 7%, transparent); color: var(--foreground); }
  .mc-confirm-morph__primary:hover { background: var(--accent-strong); }
}
/* Keyboard focus reads through fill, never a ring. */
.mc-confirm-morph__trigger:focus-visible { background: color-mix(in oklab, var(--foreground) 6%, transparent); }
.mc-confirm-morph__root[data-tone="danger"] .mc-confirm-morph__trigger:focus-visible { background: color-mix(in oklab, var(--danger) 9%, transparent); }
.mc-confirm-morph__secondary:focus-visible { background: color-mix(in oklab, var(--foreground) 8%, transparent); color: var(--foreground); }
.mc-confirm-morph__primary:focus-visible { background: var(--accent-strong); }

@media (prefers-reduced-motion: reduce) {
  .mc-confirm-morph__surface, .mc-confirm-morph__trigger, .mc-confirm-morph__secondary, .mc-confirm-morph__primary { transition-duration: 0ms; }
  .mc-confirm-morph__spinner { animation-duration: 1.6s; }
  .mc-confirm-morph__root:has(.mc-confirm-morph__trigger:active) .mc-confirm-morph__surface, .mc-confirm-morph__secondary:active, .mc-confirm-morph__primary:active { transform: none; }
}

@media (prefers-contrast: more) {
  .mc-confirm-morph__surface::after { border-color: var(--border-strong); }
}
}
</style>
