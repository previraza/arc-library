<script lang="ts" module>
  export type StepperOrientation = "horizontal" | "vertical";
  export type StepperStatus = "complete" | "current" | "upcoming" | "error";
  export interface StepperStep {
    /** Stable key, so each step keeps its own motion when the list changes. */
    id: string;
    label: string;
    /** A short hint under the label. */
    description?: string;
    /** Marks the step as failed: the marker morphs into an alert and this message replaces the description. */
    error?: string;
  }
</script>

<script lang="ts">
  // @manicat-dependencies motion
  import { onMount } from "svelte";
  import StepperText from "@/registry/components/stepper/stepper-text.svelte";
  import { drawGlyph, moveFill } from "@/lib/stepper";
  import { poseTransition } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  interface Props {
    steps: StepperStep[];
    /** Index of the step in progress. `steps.length` marks the whole flow complete. */
    current: number;
    orientation?: StepperOrientation;
    /** Called with the index of a completed step when it is chosen. Without it the stepper is a read-only indicator. */
    onStepSelect?: (index: number) => void;
    /** `current` shows only the active step's description, for tight spaces. Errors always show. */
    details?: "all" | "current";
    /** Markers only; labels stay available to assistive tech. Horizontal steppers switch to this below 30rem on their own and show the current step's label underneath. */
    compact?: boolean;
    /** Accessible name for the stepper. */
    label?: string;
    /** Announced, and shown in the compact caption, once every step is complete. */
    completeLabel?: string;
    class?: string;
    /** Extend the inner, named parts of the stepper: root, list, item, text, label, srOnly, connector, fill, head, caption, captionLabel. */
    classNames?: { root?: string; list?: string; item?: string; text?: string; label?: string; srOnly?: string; connector?: string; fill?: string; head?: string; caption?: string; captionLabel?: string };
  }

  let { steps, current, orientation = "horizontal", onStepSelect, details = "all", compact = false, label = "Progress", completeLabel = "All steps complete", class: className, classNames }: Props = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { duration } = motionTokens;
  let root = $state<HTMLElement>();

  const count = $derived(steps.length);
  const active = $derived(Math.min(Math.max(Math.round(current), 0), count));
  // Remember where progress came from, so a jump across several steps fills or drains its connectors one after another.
  let from = active;
  let lastActive = active;
  $effect.pre(() => {
    if (lastActive !== active) {
      from = lastActive;
      lastActive = active;
    }
  });
  const gap = motionTokens.stagger.line;
  const delayAt = (index: number) => {
    if (reduced) return 0;
    if (active > from) return index >= from && index < active ? (index - from) * gap : 0;
    return index >= active && index < from ? (from - 1 - index) * gap : 0;
  };
  const ringDelay = () => (reduced ? 0 : Math.max(0, Math.abs(active - from) - 1) * gap + 0.12);
  const interactive = $derived(Boolean(onStepSelect));
  const vertical = $derived(orientation === "vertical");
  const done = $derived(active >= count);
  const now = $derived(done ? undefined : steps[active]);
  const statusText: Record<StepperStatus, string> = { complete: "Completed", current: "", upcoming: "Not started", error: "Error" };
  const statusOf = (step: StepperStep, index: number): StepperStatus => (step.error ? "error" : index < active ? "complete" : index === active ? "current" : "upcoming");
  const kindOf = (step: StepperStep, index: number) => (step.error ? "error" : index < active ? "check" : "number");

  // The connectors fill along their track on a spring; the first paint lands without motion.
  let placed = false;
  $effect(() => {
    active;
    vertical;
    count;
    root?.querySelectorAll<HTMLElement>("[data-fill]").forEach((fill) => {
      const index = Number(fill.dataset.fill);
      moveFill(fill, { vertical, on: index < active, delay: delayAt(index), reduced, instant: !placed });
    });
    if (root) placed = true;
  });
  onMount(() => {
    // The strokes of checks that are already there draw themselves once.
    root?.querySelectorAll("svg[data-glyph]").forEach((svg) => drawGlyph(svg, 0, reduced));
  });

  /** Arrow keys move between the steps you can reach; Home and End jump to the first and the current one. */
  function onkeydown(event: KeyboardEvent) {
    const list = event.currentTarget as HTMLElement;
    const rtl = !vertical && getComputedStyle(list).direction === "rtl";
    const back = ["ArrowUp", rtl ? "ArrowRight" : "ArrowLeft"];
    const ahead = ["ArrowDown", rtl ? "ArrowLeft" : "ArrowRight"];
    if (![...back, ...ahead, "Home", "End"].includes(event.key)) return;
    const targets = Array.from(list.querySelectorAll<HTMLButtonElement>("button[data-reachable]"));
    const at = targets.indexOf(event.target as HTMLButtonElement);
    if (at < 0) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? targets.length - 1 : back.includes(event.key) ? Math.max(0, at - 1) : Math.min(targets.length - 1, at + 1);
    targets[next]?.focus();
  }

  // The number, check, and alert share one spot: the outgoing glyph shrinks away while the next one pops in and draws its stroke.
  const delayOf = (node: HTMLElement) => Number(node.dataset.delay ?? 0);
  const glyphIn = (node: HTMLElement) => {
    const delay = delayOf(node);
    if (node instanceof SVGElement) queueMicrotask(() => drawGlyph(node, delay, reduced));
    return poseTransition(reduced ? {} : { opacity: 0, scale: 0.5, blur: motionTokens.blur.subtle }, { opacity: 1, scale: 1, blur: 0 }, reduced ? { duration: 0 } : { spring: "snappy", fade: duration.fast, delay, fadeDelay: delay })(node);
  };
  const glyphOut = (node: HTMLElement) => poseTransition(reduced ? {} : { opacity: 0, scale: 0.5, blur: motionTokens.blur.subtle }, { opacity: 1, scale: 1, blur: 0 }, reduced ? { duration: 0 } : { duration: duration.fast, ease: "standard" })(node);
  // The ring grows out from behind the disc once progress arrives, so the eye lands on the new step after the connector fills.
  const ringIn = (node: HTMLElement) => poseTransition(reduced ? {} : { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1 }, reduced ? { duration: 0 } : { spring: "snappy", fade: duration.fast, delay: ringDelay(), fadeDelay: ringDelay() })(node);
  const ringOut = poseTransition(reduced ? {} : { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1 }, reduced ? { duration: 0 } : { duration: duration.fast, ease: "standard" });
</script>

<svelte:element this={interactive ? "nav" : "div"} bind:this={root} class={["mc-stepper__root", classNames?.root, vertical ? "mc-stepper__vertical" : "mc-stepper__horizontal", compact && "mc-stepper__compact", className]} aria-label={label} role={interactive ? undefined : "group"}>
  <ol class={["mc-stepper__list", classNames?.list]} style={vertical ? undefined : `grid-template-columns: ${count > 1 ? `repeat(${count - 1}, minmax(0, 1fr)) auto` : "auto"}`} onkeydown={interactive ? onkeydown : undefined}>
    {#each steps as step, index (step.id)}
      {@const status = statusOf(step, index)}
      {@const kind = kindOf(step, index)}
      <li class={["mc-stepper__item", classNames?.item]} data-status={status}>
        {#if index < count - 1}<span class={["mc-stepper__connector", classNames?.connector]} aria-hidden="true">{#key orientation}<span class={["mc-stepper__fill", classNames?.fill]} data-fill={index}></span>{/key}</span>{/if}
        <svelte:element this={interactive ? "button" : "span"} type={interactive ? "button" : undefined} class={["mc-stepper__head", classNames?.head]} data-clickable={(interactive && index < active) || undefined} data-reachable={(interactive && index <= active) || undefined} aria-current={index === active ? "step" : undefined} aria-disabled={interactive ? (index < active ? undefined : true) : undefined} tabindex={interactive && index >= active ? -1 : undefined} onclick={interactive && index < active ? () => onStepSelect?.(index) : undefined}>
          <span class="mc-stepper__marker" aria-hidden="true">
            {#if index === active}<span class="mc-stepper__ring" in:ringIn out:ringOut></span>{/if}
            <span class="mc-stepper__disc">
              {#key kind}
                {#if kind === "number"}
                  <span class="mc-stepper__glyph" data-delay={delayAt(index)} in:glyphIn out:glyphOut>{index + 1}</span>
                {:else if kind === "check"}
                  <svg data-glyph data-delay={delayAt(index)} class="mc-stepper__glyph mc-stepper__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" in:glyphIn out:glyphOut><path d="M5.5 12.5l4.25 4.25L18.5 8" /></svg>
                {:else}
                  <svg data-glyph data-delay={delayAt(index)} class="mc-stepper__glyph mc-stepper__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" in:glyphIn out:glyphOut><path d="M12 6.75v6.5" /><circle cx="12" cy="17.4" r="1.4" fill="currentColor" stroke="none" /></svg>
                {/if}
              {/key}
            </span>
          </span>
          <span class={["mc-stepper__text", classNames?.text]}>
            <span class={["mc-stepper__label", classNames?.label]}>{step.label}</span>
            {#if statusText[status]}<span class="mc-stepper__srOnly">, {statusText[status]}</span>{/if}
            <StepperText text={step.error ?? (details === "all" || index === active ? step.description : undefined)} className={step.error ? "mc-stepper__error" : "mc-stepper__description"} />
          </span>
        </svelte:element>
      </li>
    {/each}
  </ol>
  {#if !vertical}
    <span class={["mc-stepper__caption", classNames?.caption]} aria-hidden="true">
      <StepperText text={now?.label ?? completeLabel} className={["mc-stepper__captionLabel", classNames?.captionLabel].filter(Boolean).join(" ")} />
      <StepperText text={now?.error ?? now?.description} className={now?.error ? "mc-stepper__error" : "mc-stepper__description"} />
    </span>
  {/if}
  <span class="mc-stepper__srOnly" aria-live="polite">{now ? `Step ${active + 1} of ${count}: ${now.label}` : completeLabel}</span>
</svelte:element>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-stepper__root { --marker: 1.75rem; --halo: 4px; min-width: 0; color: var(--foreground); font-family: var(--font-body); letter-spacing: var(--tracking-body); }
/* A horizontal stepper spans its container, so it can safely measure itself and fold into markers when space runs out. */
.mc-stepper__horizontal { width: 100%; container: stepper / inline-size; }
.mc-stepper__list { display: grid; margin: 0; padding: 0; list-style: none; }
.mc-stepper__item { position: relative; min-width: 0; }
.mc-stepper__horizontal .mc-stepper__item:not(:last-child) { padding-inline-end: var(--space-4); }
.mc-stepper__vertical .mc-stepper__item:not(:last-child) { padding-bottom: var(--space-5); }
.mc-stepper__compact.mc-stepper__vertical .mc-stepper__item:not(:last-child) { padding-bottom: var(--space-6); }

/* Buttons and spans share one head, so a chosen step keeps focus as it becomes the current one. */
.mc-stepper__head { display: grid; margin: 0; padding: 0; border: 0; border-radius: var(--space-2); background: none; color: inherit; font: inherit; letter-spacing: inherit; text-align: start; cursor: default; -webkit-tap-highlight-color: transparent; }
.mc-stepper__head[data-clickable] { cursor: pointer; }
.mc-stepper__horizontal .mc-stepper__head { width: fit-content; max-width: 100%; justify-items: start; row-gap: var(--space-3); }
.mc-stepper__vertical .mc-stepper__head { width: 100%; grid-template-columns: var(--marker) minmax(0, 1fr); column-gap: var(--space-3); align-items: start; }
.mc-stepper__compact.mc-stepper__vertical .mc-stepper__head { grid-template-columns: var(--marker); column-gap: 0; }
.mc-stepper__head:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 4px; }
.mc-stepper__head:focus:not(:focus-visible) { outline: none; }

/* The ring sits behind the disc and grows out of it; the disc carries the state color and the glyph. */
.mc-stepper__marker { position: relative; display: grid; width: var(--marker); height: var(--marker); flex: none; place-items: center; }
.mc-stepper__ring { position: absolute; inset: calc(var(--halo) * -1); border-radius: var(--radius-pill); background: var(--accent-subtle); transition: background-color var(--duration-standard) var(--ease-standard); }
.mc-stepper__disc { position: relative; display: grid; width: 100%; height: 100%; place-items: center; border-radius: var(--radius-pill); background: var(--surface); box-shadow: inset 0 0 0 1px var(--border-strong); color: var(--text-muted); font-size: var(--text-xs); font-weight: 500; font-variant-numeric: tabular-nums; line-height: 1; transition: background-color var(--duration-standard) var(--ease-standard), box-shadow var(--duration-standard) var(--ease-standard), color var(--duration-standard) var(--ease-standard), transform var(--duration-spring) var(--ease-spring); }
.mc-stepper__glyph { display: grid; grid-area: 1 / 1; place-items: center; }
.mc-stepper__icon { width: .875rem; height: .875rem; }
.mc-stepper__item[data-status="current"] .mc-stepper__disc { box-shadow: inset 0 0 0 1.5px var(--accent); color: var(--foreground); }
.mc-stepper__item[data-status="complete"] .mc-stepper__disc { background: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); color: var(--accent-foreground); }
.mc-stepper__item[data-status="error"] .mc-stepper__disc { background: color-mix(in oklab, var(--danger) 10%, var(--surface)); box-shadow: inset 0 0 0 1.5px var(--danger); color: var(--danger); }
.mc-stepper__item[data-status="error"] .mc-stepper__ring { background: color-mix(in oklab, var(--danger) 16%, transparent); }

/* The track stays put; only the fill scales along it on a spring, from the step that was just finished. */
.mc-stepper__connector { position: absolute; overflow: hidden; border-radius: var(--radius-pill); background: var(--border); pointer-events: none; }
.mc-stepper__horizontal .mc-stepper__connector { top: calc(var(--marker) / 2 - 1px); inset-inline: calc(var(--marker) + var(--halo) + var(--space-1)) calc(var(--halo) + var(--space-1)); height: 2px; }
/* Both ends keep a clear gap from the markers, and from the current step's ring. */
.mc-stepper__vertical .mc-stepper__connector { top: calc(var(--marker) + var(--halo) + 2px); bottom: calc(var(--halo) + 2px); inset-inline-start: calc(var(--marker) / 2 - 1px); width: 2px; }
.mc-stepper__fill { position: absolute; inset: 0; border-radius: inherit; background: var(--accent); }
.mc-stepper__horizontal .mc-stepper__fill { transform-origin: left center; }
.mc-stepper__horizontal .mc-stepper__fill:dir(rtl) { transform-origin: right center; }
.mc-stepper__vertical .mc-stepper__fill { transform-origin: center top; }

.mc-stepper__text { display: grid; min-width: 0; }
/* Centers the first line of the label on the marker. */
.mc-stepper__vertical .mc-stepper__text { padding-top: .25rem; }
.mc-stepper__label { display: block; color: var(--text-muted); font-size: var(--text-sm); font-weight: 500; line-height: 1.25rem; overflow-wrap: break-word; transition: color var(--duration-standard) var(--ease-standard); }
.mc-stepper__item[data-status="complete"] .mc-stepper__label { color: var(--text-secondary); }
.mc-stepper__item[data-status="current"] .mc-stepper__label, .mc-stepper__item[data-status="error"] .mc-stepper__label { color: var(--foreground); }
/* Changing text pops out of flow against this box while it leaves, so it must be the positioned parent. */
.mc-stepper__slot { display: block; }
.mc-stepper__slotInner { position: relative; display: block; }
.mc-stepper__description, .mc-stepper__error { display: block; padding-top: 2px; font-size: var(--text-xs); font-weight: 400; line-height: var(--leading-body); overflow-wrap: break-word; }
.mc-stepper__description { color: var(--text-muted); }
.mc-stepper__error { color: var(--danger); }

.mc-stepper__caption { display: none; margin-top: var(--space-3); }
.mc-stepper__captionLabel { display: block; color: var(--foreground); font-size: var(--text-sm); font-weight: 500; line-height: 1.25rem; }

@media (hover: hover) and (pointer: fine) {
  .mc-stepper__head[data-clickable]:hover .mc-stepper__label { color: var(--foreground); }
  .mc-stepper__item[data-status="complete"] .mc-stepper__head[data-clickable]:hover .mc-stepper__disc { background: var(--accent-strong); box-shadow: inset 0 0 0 1px var(--accent-strong); }
  .mc-stepper__item[data-status="error"] .mc-stepper__head[data-clickable]:hover .mc-stepper__disc { background: color-mix(in oklab, var(--danger) 18%, var(--surface)); }
}
.mc-stepper__head[data-clickable]:active .mc-stepper__disc { transform: scale(.92); }

.mc-stepper__srOnly, .mc-stepper__compact .mc-stepper__text { position: absolute; width: 1px; height: 1px; margin: 0; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.mc-stepper__compact.mc-stepper__horizontal .mc-stepper__caption { display: grid; }
/* Four labels no longer fit side by side: keep the markers and name the current step underneath. */
@container stepper (max-width: 30rem) {
  .mc-stepper__horizontal .mc-stepper__text { position: absolute; width: 1px; height: 1px; margin: 0; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  .mc-stepper__horizontal .mc-stepper__caption { display: grid; }
}

@media (prefers-reduced-motion: reduce) {
  .mc-stepper__disc, .mc-stepper__ring, .mc-stepper__label { transition: none; }
  .mc-stepper__head[data-clickable]:active .mc-stepper__disc { transform: none; }
}
}
</style>
