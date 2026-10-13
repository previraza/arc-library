<script lang="ts">
  // @manicat-dependencies motion @lucide/svelte
  import { onMount } from "svelte";
  import type { Snippet } from "svelte";
  import { ChevronDown } from "@lucide/svelte";
  import { createExpandableCard } from "@/lib/expandable-card";
  import { poseTransition } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  interface Props {
    title: string;
    description?: string;
    children?: Snippet;
    /** Whether the details are showing. Bind it with `bind:expanded`. */
    expanded?: boolean;
    defaultExpanded?: boolean;
    /** Collapsed width cap in px. The card is centered and never wider than its container. Fills the container when omitted. */
    width?: number;
    /** Expanded width cap in px, so the card can grow sideways into more room. Defaults to `width`. */
    expandedWidth?: number;
    class?: string;
    style?: string;
    onkeydown?: (event: KeyboardEvent) => void;
    /** Extend the inner, named parts of the expandable card: track, trigger, copy, description, arrow, panel or panelInner. */
    classNames?: { track?: string; trigger?: string; copy?: string; description?: string; arrow?: string; panel?: string; panelInner?: string };
    [key: string]: unknown;
  }

  let { title, description, children, expanded = $bindable(), defaultExpanded = false, width, expandedWidth, class: className, style, onkeydown, classNames, ...rest }: Props = $props();

  let internal = $state(defaultExpanded);
  const panelId = $props.id();
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { duration, blur } = motionTokens;
  let track: HTMLElement;
  let card: HTMLElement;
  let trigger: HTMLElement;
  let arrow: HTMLElement;
  let panel: HTMLElement;
  let inner: HTMLElement;
  let controller: ReturnType<typeof createExpandableCard> | undefined;

  const isOpen = $derived(expanded ?? internal);
  const toggle = (next: boolean) => {
    internal = next;
    expanded = next;
  };
  // Caps for the first paint, before the room is measured.
  const openCap = $derived(expandedWidth ?? width);
  const caps = $derived(`${width ? `--expandable-card-width: ${width}px;` : ""}${openCap ? `--expandable-card-expanded-width: ${openCap}px;` : ""}${style ?? ""}`);
  function handleKeydown(event: KeyboardEvent) {
    onkeydown?.(event);
    if (event.defaultPrevented || event.key !== "Escape" || !isOpen) return;
    event.preventDefault();
    toggle(false);
    trigger.focus();
  }

  onMount(() => {
    controller = createExpandableCard({ track, card, arrow, panel, inner }, { reduced });
    return () => controller?.destroy();
  });
  $effect(() => {
    controller?.sync(isOpen, { width, expandedWidth });
  });

  // Changed words in the summary rise in; unchanged words hold still.
  const em = (node: Element, amount: number) => amount * parseFloat(getComputedStyle(node).fontSize);
  const wordIn = (node: HTMLElement) => poseTransition({ opacity: 0, y: em(node, 0.35), blur: blur.soft }, { opacity: 1, y: 0, blur: 0 }, { duration: duration.standard, ease: "enter" })(node);
  const wordOut = (node: HTMLElement) => poseTransition({ opacity: 0, y: em(node, -0.3), blur: blur.subtle }, { opacity: 1, y: 0, blur: 0 }, { duration: duration.fast, ease: "standard" }, { pop: true })(node);
  const words = $derived((description ?? "").split(/(\s+)/));
</script>

<div bind:this={track} class={["mc-expandable-card__track", classNames?.track]}>
  <article {...rest} bind:this={card} class={["mc-expandable-card__card", className]} data-expanded={isOpen} style={caps} onkeydown={handleKeydown}>
    <button bind:this={trigger} type="button" class={["mc-expandable-card__trigger", classNames?.trigger]} aria-expanded={isOpen} aria-controls={panelId} onclick={() => toggle(!isOpen)}>
      <span class={["mc-expandable-card__copy", classNames?.copy]}><strong>{title}</strong>{#if description}<span class={["mc-expandable-card__description", classNames?.description]}>
        <span class="mc-expandable-card__roll">
          <span class="mc-expandable-card__srOnly">{description}</span>
          <span aria-hidden="true">{#each words as word, index (`${index}:${word}`)}<span class="mc-expandable-card__word" in:wordIn out:wordOut>{word}</span>{/each}</span>
        </span>
      </span>{/if}</span>
      <span bind:this={arrow} class={["mc-expandable-card__arrow", classNames?.arrow]}><ChevronDown width={18} height={18} aria-hidden="true" /></span>
    </button>
    <!-- The panel stays mounted so a second click mid-animation reverses from where it is; inert keeps closed details out of reach. -->
    <div id={panelId} bind:this={panel} class={["mc-expandable-card__panel", classNames?.panel]} inert={!isOpen}>
      <div bind:this={inner} class={["mc-expandable-card__panelInner", classNames?.panelInner]}>{@render children?.()}</div>
    </div>
  </article>
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* The track centers the card and measures the room it may grow into. */
.mc-expandable-card__track { display: flex; width: 100%; min-width: 0; justify-content: center; }
.mc-expandable-card__card { width: 100%; max-width: var(--expandable-card-width, 100%); overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-surface); background: var(--surface); box-shadow: var(--shadow-resting); }
.mc-expandable-card__card[data-expanded="true"] { max-width: var(--expandable-card-expanded-width, var(--expandable-card-width, 100%)); }
/* Once measured, the width is animated in px, so the CSS cap steps aside and never clamps the morph. */
.mc-expandable-card__card[data-measured] { max-width: 100%; }
/* The card clips the header to its corners, so the header's hover fill never changes shape while the card opens or closes. */
.mc-expandable-card__trigger { display: flex; width: 100%; min-height: 64px; align-items: center; justify-content: space-between; gap: var(--space-5); border: 0; padding: var(--space-4) var(--space-5); background: transparent; color: var(--foreground); font: inherit; text-align: left; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: background-color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-expandable-card__trigger:hover { background: var(--surface-muted); } .mc-expandable-card__trigger:hover .mc-expandable-card__arrow { color: var(--foreground); } }
.mc-expandable-card__trigger:active { background: var(--surface-muted); }
.mc-expandable-card__copy { min-width: 0; }
.mc-expandable-card__copy strong { display: block; font-size: var(--text-sm); font-weight: 500; }
.mc-expandable-card__description { display: block; margin-top: 4px; color: var(--text-muted); font-size: var(--text-xs); font-variant-numeric: tabular-nums; }
.mc-expandable-card__roll { position: relative; display: block; }
.mc-expandable-card__word { display: inline-block; white-space: pre; }
.mc-expandable-card__srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.mc-expandable-card__arrow { display: inline-flex; flex: 0 0 auto; align-items: center; justify-content: center; color: var(--text-muted); transition: color var(--duration-fast) var(--ease-standard); }
.mc-expandable-card__card[data-expanded="true"] .mc-expandable-card__arrow { color: var(--foreground); }
/* The divider is an inset line rather than a border, so a collapsed panel is truly zero height and nothing pops at the end of the close. */
.mc-expandable-card__panel { overflow: hidden; box-shadow: inset 0 1px 0 var(--border); background: var(--surface-muted); color: var(--text-secondary); font-size: var(--text-sm); }
.mc-expandable-card__panelInner { max-width: none; padding: var(--space-4) var(--space-5) var(--space-5); }
@media (prefers-reduced-motion: reduce) { .mc-expandable-card__trigger, .mc-expandable-card__arrow { transition: none; } }
}
</style>
