<script lang="ts">
  // @manicat-dependencies motion @lucide/svelte
  import { animate } from "motion";
  import { X } from "@lucide/svelte";
  import { createFieldMessage } from "@/lib/field-message";
  import type { FieldMessage } from "@/lib/field-message";
  import { createFlip, poseTransition } from "@/lib/motion-dom";
  import { createPickRing, followShell } from "@/lib/tag-input";
  import { motionTokens } from "@/lib/motion-tokens";

  interface Props {
    label: string;
    /** The list of tags. Bind it with `bind:value`. Enter or a comma adds one; Backspace or the arrow keys pick a tag first, and the next Backspace removes it. */
    value?: string[];
    placeholder?: string;
    description?: string;
    id?: string;
    /** Extend the inner, named parts of the tag input: control, content, ring, placeholder, tag, tagLabel, messageSlot, hint, words or word. */
    classNames?: { control?: string; content?: string; ring?: string; placeholder?: string; tag?: string; tagLabel?: string; messageSlot?: string; hint?: string; words?: string; word?: string };
  }

  let { label, value = $bindable([]), placeholder = "Add a tag", description, id, classNames }: Props = $props();

  const generated = $props.id();
  const inputId = $derived(id ?? generated);
  const hintId = $derived(description ? `${inputId}-description` : undefined);
  let draft = $state("");
  let picked = $state<string | null>(null);
  let notice = $state("");
  const active = $derived(picked !== null && value.includes(picked) ? picked : null);
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { duration, ease, blur } = motionTokens;

  let control: HTMLElement;
  let content: HTMLElement;
  let input: HTMLInputElement;
  let ring: HTMLElement;
  let hintHost: HTMLElement;
  let pickRing: ReturnType<typeof createPickRing> | undefined;
  let hint: FieldMessage | undefined;

  // The shell follows its wrapped rows, the input and the tags glide when a neighbour comes or goes, and the ring finds the picked tag.
  const flip = createFlip(() => [...(content?.querySelectorAll<HTMLElement>("[data-tag]") ?? []), ...(input ? [input] : [])], { reduced });
  $effect.pre(() => {
    value.length;
    flip.measure();
  });
  $effect(() => {
    value.length;
    flip.play();
  });
  $effect(() => {
    pickRing?.sync(active);
    value.length;
  });
  $effect(() => {
    const stop = followShell(control, content, reduced);
    pickRing = createPickRing(ring, content, reduced);
    hint = createFieldMessage(hintHost, {
      id: hintId,
      classes: { messageSlot: ["mc-tag-input__messageSlot", classNames?.messageSlot].filter(Boolean).join(" "), copy: ["mc-tag-input__hint", classNames?.hint].filter(Boolean).join(" "), srOnly: "mc-tag-input__srOnly", words: ["mc-tag-input__words", classNames?.words].filter(Boolean).join(" "), word: ["mc-tag-input__word", classNames?.word].filter(Boolean).join(" "), column: "mc-tag-input__column" },
      reduced,
    });
    return () => {
      stop();
      hint?.destroy();
    };
  });
  $effect(() => hint?.set(description));

  const say = (message: string) => (notice = notice === message ? `${message}\u00a0` : message);
  const pick = (tag: string | null) => {
    picked = tag;
    if (tag !== null) say(`${tag} selected. Press Backspace to remove it.`);
  };
  function add() {
    const tag = draft.trim();
    if (!tag) return;
    const existing = value.find((item) => item.toLowerCase() === tag.toLowerCase());
    // A duplicate pulses the tag that already exists, so the ignored Enter still gets an answer.
    if (existing) {
      const node = [...content.querySelectorAll<HTMLElement>("[data-tag]")].find((el) => el.dataset.tag === existing);
      if (node && !reduced) animate(node, { scale: [1, 1.06, 1] }, { duration: duration.standard + duration.instant, ease: [...ease.inOut] });
      say(`${existing} is already added`);
      return;
    }
    value = [...value, tag];
    draft = "";
    picked = null;
    say(`Added ${tag}`);
  }
  function remove(tag: string) {
    value = value.filter((item) => item !== tag);
    picked = null;
    say(`Removed ${tag}`);
    input.focus();
  }
  function onkeydown(event: KeyboardEvent) {
    const { key } = event;
    const field = event.currentTarget as HTMLInputElement;
    const atStart = field.selectionStart === 0 && field.selectionEnd === 0;
    const index = active === null ? value.length : value.indexOf(active);
    let handled = true;
    if (key === "Enter" || key === ",") add();
    else if ((key === "Backspace" || key === "Delete") && active !== null) remove(active);
    else if (key === "Backspace" && atStart && value.length) pick(value[value.length - 1]);
    else if (key === "ArrowLeft" && (atStart || active !== null) && index > 0) pick(value[index - 1]);
    else if (key === "ArrowRight" && active !== null) pick(value[index + 1] ?? null);
    else if (key === "Escape" && active !== null) pick(null);
    else handled = false;
    if (handled) event.preventDefault();
  }
  // A click on a tag picks it without taking focus from the field. The remove button keeps its own press.
  function onTagPointer(event: MouseEvent, tag?: string) {
    if ((event.target as HTMLElement).closest("button")) return;
    if (!tag) return void event.preventDefault();
    pick(active === tag ? null : tag);
    input.focus();
  }

  // A new tag blurs in where its text was typed; a removed one leaves its slot, so the rest glide in.
  const em = (node: Element, amount: number) => amount * parseFloat(getComputedStyle(node).fontSize);
  const tagIn = poseTransition(reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9, blur: blur.soft }, { opacity: 1, scale: 1, blur: 0 }, reduced ? { duration: duration.instant } : { spring: "morph", fade: duration.fast });
  const tagOut = (node: HTMLElement) => poseTransition(reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9, blur: blur.subtle }, { opacity: 1, scale: 1, blur: 0 }, reduced ? { duration: 0 } : { duration: duration.instant, ease: "standard" }, { pop: true })(node);
  const placeholderIn = (node: HTMLElement) => poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: em(node, 0.3), blur: blur.soft }, { opacity: 1, y: 0, blur: 0 }, reduced ? { duration: duration.instant } : { duration: duration.standard, ease: "enter" })(node);
  const placeholderOut = () => ({ duration: 0 });
</script>

<div class="mc-tag-input__field">
  <label for={inputId}>{label}</label>
  <div bind:this={control} class={["mc-tag-input__control", classNames?.control]}>
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div bind:this={content} class={["mc-tag-input__content", classNames?.content]} onclick={(event) => { if (event.target === event.currentTarget) input.focus(); }}>
      <span bind:this={ring} class={["mc-tag-input__ring", classNames?.ring]} aria-hidden="true"></span>
      {#if !draft && !value.length}
        <span class={["mc-tag-input__placeholder", classNames?.placeholder]} aria-hidden="true" in:placeholderIn out:placeholderOut>{placeholder}</span>
      {/if}
      {#each value as tag (tag)}
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
        <span class={["mc-tag-input__tag", classNames?.tag]} data-tag={tag} data-picked={tag === active || undefined} onmousedown={(event) => onTagPointer(event)} onclick={(event) => onTagPointer(event, tag)} in:tagIn out:tagOut>
          <span class={["mc-tag-input__tagLabel", classNames?.tagLabel]}>{tag}</span>
          <button type="button" aria-label={`Remove ${tag}`} onclick={() => remove(tag)}><X width={14} height={14} aria-hidden="true" /></button>
        </span>
      {/each}
      <input id={inputId} bind:this={input} bind:value={draft} placeholder={value.length ? "" : placeholder} aria-describedby={hintId} oninput={() => (picked = null)} {onkeydown} onblur={() => { add(); picked = null; }} />
    </div>
  </div>
  <span class="mc-tag-input__srOnly" aria-live="polite">{notice}</span>
  <span bind:this={hintHost} style="display: contents"></span>
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* No row gap: grid tracks clamp a negative margin at zero, so a closed message row would still pay the gap. Each row carries its own space instead. */
/* The field fills its column, so a new tag never widens it or re-centers it inside a centered layout. */
.mc-tag-input__field { display: grid; width: 100%; min-width: 0; }
.mc-tag-input__field label { margin-bottom: var(--space-2); font-size: var(--text-sm); font-weight: 500; }
/* The shell animates its height to .mc-tag-input__content, which carries the wrapping rows. The ring contracts onto the border on focus. */
.mc-tag-input__control { box-sizing: content-box; overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-control); background: var(--surface); box-shadow: 0 0 0 6px transparent; transition: border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-standard) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-tag-input__control:hover:not(:focus-within) { border-color: var(--border-strong); } }
.mc-tag-input__control:focus-within { border-color: var(--foreground); box-shadow: 0 0 0 3px var(--focus-ring); outline: 2px solid transparent; outline-offset: 2px; }
/* Equal 7px padding makes one row fill the minimum height exactly, so existing tags hold their line when a second row opens. */
.mc-tag-input__content { position: relative; display: flex; flex-wrap: wrap; align-items: center; align-content: flex-start; gap: 6px; min-height: calc(var(--control-height-md) - 2px); box-sizing: border-box; padding: 7px; cursor: text; }
.mc-tag-input__tag { position: relative; display: inline-flex; align-items: center; gap: 3px; min-height: 28px; box-sizing: border-box; border: 1px solid var(--border); border-radius: var(--radius-pill); padding: 0 4px 0 9px; background: var(--surface-muted); color: var(--foreground); font-size: var(--text-sm); white-space: nowrap; cursor: default; }
.mc-tag-input__tag button { display: grid; width: 22px; height: 22px; place-items: center; border: 0; border-radius: 50%; background: transparent; color: var(--text-secondary); cursor: pointer; transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), transform var(--duration-spring) var(--ease-spring); }
@media (hover: hover) and (pointer: fine) { .mc-tag-input__tag button:hover { background: var(--surface); color: var(--foreground); } }
.mc-tag-input__tag button:focus-visible { background: var(--surface); color: var(--foreground); outline: none; box-shadow: inset 0 0 0 1.5px var(--focus-ring); }
/* Quick press, spring release. */
.mc-tag-input__tag button:active { transform: scale(.96); transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), transform var(--duration-instant) var(--ease-standard); }
.mc-tag-input__content input { flex: 1 1 100px; min-width: 80px; min-height: 28px; box-sizing: border-box; border: 0; padding: 0 5px; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); }
.mc-tag-input__content input:focus, .mc-tag-input__content input:focus-visible { outline: none; }
.mc-tag-input__content input::placeholder { color: transparent; }
/* The visible placeholder is drawn here so it can rise in when the last tag leaves. The native one stays for assistive tech. Inset matches the content and input padding. */
.mc-tag-input__placeholder { position: absolute; inset: 0; display: flex; align-items: center; overflow: hidden; padding: 0 12px; color: var(--text-muted); font-size: var(--text-sm); white-space: nowrap; pointer-events: none; }
/* The pick ring rides above the pills and sizes itself to the picked tag, so it can glide between tags without scaling its border. */
.mc-tag-input__ring { position: absolute; top: 0; left: 0; z-index: 1; box-sizing: border-box; border: 1px solid var(--accent); border-radius: var(--radius-pill); background: var(--accent-subtle); opacity: 0; pointer-events: none; }
/* A resting tag is not a stacking context (its filter ends at none), so its label and button sit above the ring while its fill stays below. */
.mc-tag-input__tagLabel, .mc-tag-input__tag button { position: relative; z-index: 2; }
.mc-tag-input__tag[data-picked] button { color: var(--foreground); }
/* The row's space is padding inside the clipped slot, so the height animates from a true zero. */
.mc-tag-input__messageSlot { display: block; overflow: hidden; }
.mc-tag-input__hint { display: block; padding-top: var(--space-2); color: var(--text-muted); font-size: var(--text-xs); line-height: var(--leading-body); }
/* Words are measured against this box when they pop out to leave, so it must be the positioned parent. */
.mc-tag-input__words { position: relative; display: block; }
.mc-tag-input__word { display: inline-block; white-space: pre; }
.mc-tag-input__srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media (prefers-reduced-motion: reduce) { .mc-tag-input__control, .mc-tag-input__tag button { transition: none; } .mc-tag-input__tag button:active { transform: none; } }
}
</style>
