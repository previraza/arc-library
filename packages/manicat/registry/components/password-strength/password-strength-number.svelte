<script lang="ts">
  // @manicat-dependencies motion
  import { onMount } from "svelte";
  import { rolling } from "@/lib/field-message";

  /** A count that turns like a counter: a shrinking count drops in from above, a growing one rises from below. */
  let { value }: { value: number } = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let host: HTMLElement;
  let roller: ReturnType<typeof rolling> | undefined;

  onMount(() => {
    roller = rolling(host, String(value), { column: "mc-password-strength__place" }, reduced);
  });
  let first = true;
  $effect(() => {
    const next = String(value);
    if (first) {
      first = false;
      return;
    }
    roller?.set(next);
  });
</script>

<span bind:this={host} class="mc-password-strength__number"></span>
