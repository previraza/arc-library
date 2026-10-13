<script lang="ts">
  // @manicat-dependencies motion @lucide/svelte
  import { animate } from "motion";
  import { onMount } from "svelte";
  import { ChevronDown, FileCode2 } from "@lucide/svelte";
  import CopyButton from "@/registry/components/copy-button/copy-button.svelte";
  import { createCodeHeight, createFileWidth, highlight, normaliseLanguage } from "@/lib/code-block";
  import { poseTransition } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  interface Props {
    /** Source shown in the block and copied by the action. */
    code: string;
    /** File name displayed in the header. */
    filename?: string;
    /** Used for the header label and lightweight syntax highlighting. */
    language?: string;
    /** Collapse longer sources to this many lines, with a toggle that expands the rest in place. */
    maxLines?: number;
    class?: string;
    /** Extend the inner, named parts of the code block: block, header, file, language, viewport, pre, code, expand, swap, swapStack, srOnly or filename. */
    classNames?: { block?: string; header?: string; file?: string; language?: string; viewport?: string; pre?: string; code?: string; expand?: string; swap?: string; swapStack?: string; srOnly?: string; filename?: string };
    [key: string]: unknown;
  }

  let { code, filename, language = "tsx", maxLines, class: className, classNames, ...rest }: Props = $props();

  const preId = $props.id();
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { duration, blur } = motionTokens;
  let expanded = $state(false);
  let viewport: HTMLElement;
  let pre: HTMLElement;
  let nameBox: HTMLElement;
  let sizer: HTMLElement;
  let chevron = $state<HTMLElement>();
  let heightControl: ReturnType<typeof createCodeHeight> | undefined;
  let fileWidth: ReturnType<typeof createFileWidth> | undefined;

  const displayLanguage = $derived(normaliseLanguage(language));
  const name = $derived(filename ?? "Source code");
  const lineCount = $derived(code.split("\n").length);
  const collapsible = $derived(maxLines != null && maxLines > 0 && lineCount > maxLines);
  const open = $derived(!collapsible || expanded);
  const tokens = $derived(highlight(code, displayLanguage));
  const expandLabels = $derived([`Show all ${lineCount} lines`, "Show fewer lines"]);
  const expandLabel = $derived(expandLabels[expanded ? 1 : 0]);

  onMount(() => {
    heightControl = createCodeHeight(viewport, pre, { maxLines, open, reduced });
    fileWidth = createFileWidth(nameBox, sizer, reduced);
    return () => {
      heightControl?.destroy();
      fileWidth?.destroy();
    };
  });
  $effect(() => {
    heightControl?.setOpen(open);
  });
  let lastName = name;
  $effect(() => {
    if (lastName === name) return;
    lastName = name;
    fileWidth?.update();
  });
  let firstChevron = true;
  $effect(() => {
    const next = expanded;
    if (!chevron) return;
    if (firstChevron) {
      firstChevron = false;
      return;
    }
    animate(chevron, { rotate: next ? 180 : 0 } as never, (reduced ? { duration: 0 } : motionTokens.spring.snappy) as never);
  });

  // Text that changes in place: the new words rise in with a soft blur while the old ones leave upward, faster.
  const em = (node: Element, amount: number) => amount * parseFloat(getComputedStyle(node).fontSize);
  const textIn = (node: HTMLElement) => poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: em(node, 0.3), blur: blur.soft }, { opacity: 1, y: 0, blur: 0 }, reduced ? { duration: 0 } : { duration: duration.standard, ease: "enter" })(node);
  const textOut = (node: HTMLElement) => poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: em(node, -0.3), blur: blur.subtle }, { opacity: 1, y: 0, blur: 0 }, reduced ? { duration: 0 } : { duration: duration.instant, ease: "standard" })(node);
  const codeIn = (node: HTMLElement) => poseTransition(reduced ? {} : { opacity: 0, y: 4 }, { opacity: 1, y: 0 }, reduced ? { duration: 0 } : { duration: duration.standard, ease: "enter" })(node);
  const codeOut = (node: HTMLElement) => poseTransition({ opacity: 0 }, { opacity: 1 }, reduced ? { duration: 0 } : { duration: duration.instant, ease: "standard" }, { pop: true })(node);
</script>

<section {...rest} class={["mc-code-block__block", className, classNames?.block]} aria-label={filename ? `${filename} source code` : `${displayLanguage} source code`} style={maxLines ? `--code-lines: ${maxLines}` : undefined}>
  <header class={["mc-code-block__header", classNames?.header]}>
    <div class={["mc-code-block__file", classNames?.file]}>
      <FileCode2 size={16} strokeWidth={1.75} aria-hidden="true" />
      <!-- A new file name swaps in while its box follows the new width on a spring, then returns to auto so it can still truncate. -->
      <span bind:this={nameBox} class="mc-code-block__swap mc-code-block__filename">
        <span bind:this={sizer} class="mc-code-block__sizer" aria-hidden="true">{name}</span>
        <span class="mc-code-block__swapStack" aria-hidden="true">{#key name}<span class="mc-code-block__swapText" in:textIn out:textOut>{name}</span>{/key}</span>
        <span class="mc-code-block__srOnly">{name}</span>
      </span>
      <span class={["mc-code-block__language", classNames?.language]}>{displayLanguage}</span>
    </div>
    <CopyButton value={code} label="Copy code" />
  </header>
  <div bind:this={viewport} class={["mc-code-block__viewport", classNames?.viewport]}>
    <pre bind:this={pre} id={preId} class={["mc-code-block__pre", classNames?.pre]} tabindex="0" aria-label="Selectable source code">{#key code}<code class={["mc-code-block__code", classNames?.code]} in:codeIn out:codeOut>{#each tokens as token}{#if token.kind}<span class={`mc-code-block__${token.kind}`}>{token.text}</span>{:else}{token.text}{/if}{/each}</code>{/key}</pre>
  </div>
  {#if collapsible}
    <button type="button" class={["mc-code-block__expand", classNames?.expand]} aria-expanded={expanded} aria-controls={preId} onclick={() => (expanded = !expanded)}>
      <!-- Both labels reserve the cell, so the chevron never moves when the words change. -->
      <span class={["mc-code-block__swap", classNames?.swap]} aria-hidden="true">{#each expandLabels as text (text)}<span class="mc-code-block__reserve">{text}</span>{/each}<span class={["mc-code-block__swapStack", classNames?.swapStack]}>{#key expandLabel}<span class="mc-code-block__swapText" in:textIn out:textOut>{expandLabel}</span>{/key}</span></span>
      <span class={["mc-code-block__srOnly", classNames?.srOnly]}>{expandLabel}</span>
      <span bind:this={chevron} class="mc-code-block__chevron" aria-hidden="true"><ChevronDown size={16} strokeWidth={1.75} /></span>
    </button>
  {/if}
</section>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-code-block__block { width: 100%; min-width: 0; max-width: 100%; overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface); }
.mc-code-block__header { display: flex; min-height: 52px; align-items: center; justify-content: space-between; gap: var(--space-3); border-bottom: 1px solid var(--border-subtle); padding: var(--space-2) var(--space-3) var(--space-2) var(--space-4); background: var(--surface-raised); }
/* Baseline alignment keeps the smaller mono language label on the file name's baseline; the icon centres on its own. */
.mc-code-block__file { display: flex; min-width: 0; align-items: baseline; gap: var(--space-2); color: var(--text-secondary); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 500; letter-spacing: var(--tracking-body); line-height: var(--leading-body); }
.mc-code-block__file > svg { flex: none; align-self: center; color: var(--text-muted); }
.mc-code-block__filename { position: relative; min-width: 0; overflow: hidden; color: var(--foreground); }
/* Changing text stacks old and new words in one cell; reserve spans hold the widest label so the cell never snaps. */
.mc-code-block__swap { display: inline-grid; min-width: 0; white-space: nowrap; }
.mc-code-block__swap > span, .mc-code-block__swapStack > span { grid-area: 1 / 1; min-width: 0; }
.mc-code-block__swapStack { display: grid; min-width: 0; }
.mc-code-block__swapText { display: block; overflow: hidden; text-overflow: ellipsis; }
.mc-code-block__reserve { visibility: hidden; }
.mc-code-block__sizer { position: absolute; top: 0; left: 0; white-space: nowrap; visibility: hidden; pointer-events: none; }
.mc-code-block__srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.mc-code-block__language { flex: none; color: var(--text-muted); font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace; font-size: var(--text-xs); font-weight: 400; }
.mc-code-block__language::before { content: "·"; margin-right: var(--space-2); color: var(--border-strong); }
/* The source area follows its content height on a spring. Before it measures, a collapsed block clips from CSS. */
.mc-code-block__viewport { --code-collapsed: calc(var(--code-lines, 0) * var(--text-sm) * 1.7 + var(--space-5) * 2); overflow: hidden; }
.mc-code-block__pre { position: relative; overflow: auto; margin: 0; padding: var(--space-5); color: var(--foreground); font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace; font-size: var(--text-sm); font-variant-ligatures: none; line-height: 1.7; tab-size: 2; white-space: pre; }
/* Block so new source can rise in with a transform; inline code ignores transforms. */
.mc-code-block__code { display: block; font-family: inherit; }
.mc-code-block__expand { display: flex; width: 100%; min-height: 44px; align-items: center; justify-content: center; gap: var(--space-2); border: 0; border-top: 1px solid var(--border-subtle); padding: 0 var(--space-4); background: var(--surface-raised); color: var(--text-secondary); font: inherit; font-size: var(--text-sm); font-weight: 500; cursor: pointer; transition: color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard); }
.mc-code-block__chevron { display: grid; flex: none; place-items: center; color: var(--text-muted); }
/* Each role has contrast in both themes; color supports, but never replaces, source text. */
.mc-code-block__comment { color: var(--text-muted); font-style: italic; }
.mc-code-block__string { color: oklch(46% .13 150); }
.mc-code-block__number { color: oklch(50% .14 55); }
.mc-code-block__keyword { color: oklch(48% .15 285); }
.mc-code-block__type { color: oklch(46% .13 230); }
.mc-code-block__function { color: oklch(43% .12 25); }
.mc-code-block__property { color: oklch(44% .12 85); }
.mc-code-block__tag { color: oklch(46% .13 230); }
.mc-code-block__punctuation { color: var(--text-secondary); }
:root[data-theme="dark"] .mc-code-block__string { color: oklch(77% .15 150); }
:root[data-theme="dark"] .mc-code-block__number { color: oklch(80% .14 75); }
:root[data-theme="dark"] .mc-code-block__keyword { color: oklch(78% .16 285); }
:root[data-theme="dark"] .mc-code-block__type { color: oklch(79% .13 230); }
:root[data-theme="dark"] .mc-code-block__function { color: oklch(80% .13 25); }
:root[data-theme="dark"] .mc-code-block__property { color: oklch(79% .12 85); }
:root[data-theme="dark"] .mc-code-block__tag { color: oklch(79% .13 230); }
@media (hover: hover) and (pointer: fine) { .mc-code-block__expand:hover { background: var(--surface-muted); color: var(--foreground); } .mc-code-block__expand:hover .mc-code-block__chevron { color: var(--foreground); } }
@media (max-width: 420px) { .mc-code-block__header { padding-left: var(--space-3); } .mc-code-block__header button { width: var(--control-height-sm); padding-inline: 0; } .mc-code-block__header button > span:last-of-type { display: none; } .mc-code-block__viewport { --code-collapsed: calc(var(--code-lines, 0) * var(--text-xs) * 1.7 + var(--space-4) * 2); } .mc-code-block__pre { padding: var(--space-4); font-size: var(--text-xs); } }
@media (prefers-reduced-motion: reduce) { .mc-code-block__expand { transition: none; } }
}
</style>
