<script lang="ts">
  // @manicat-dependencies motion
  import { onMount } from "svelte";
  import { animateCheckbox, checkboxPath } from "@/lib/motion-dom";

  /** The checkbox of a row: a real input under a drawn box whose fill springs in and whose check morphs into a dash. */
  let { checked, mixed = false, label, nav, ontoggle, input = $bindable() }: { checked: boolean; mixed?: boolean; label: string; nav: "head" | "row"; ontoggle: (extend: boolean) => void; input?: HTMLInputElement } = $props();
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let fill = $state<HTMLElement>();
  let path = $state<SVGPathElement>();
  let ready = false;
  onMount(() => {
    animateCheckbox({ fill: fill!, path: path! }, mixed ? "indeterminate" : checked, { reduced, animated: false });
    ready = true;
  });
  $effect(() => {
    const next = mixed ? "indeterminate" : checked;
    if (input) input.indeterminate = mixed;
    if (ready) animateCheckbox({ fill: fill!, path: path! }, next, { reduced, animated: true });
  });
</script>

<label class="mc-sortable-data-table__selectHit">
  <input bind:this={input} type="checkbox" class="mc-sortable-data-table__selectInput" {checked} aria-label={label} data-nav={nav} onclick={(event) => ontoggle(event.shiftKey === true)} />
  <span class="mc-sortable-data-table__selectBox" data-on={checked || mixed || undefined} aria-hidden="true">
    <span bind:this={fill} class="mc-sortable-data-table__selectFill"></span>
    <svg class="mc-sortable-data-table__selectMark" viewBox="0 0 18 18" fill="none" focusable="false">
      <path bind:this={path} d={checkboxPath} stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </span>
</label>
