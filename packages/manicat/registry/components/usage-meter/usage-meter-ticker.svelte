<script lang="ts">
  // @manicat-dependencies motion
  import { onMount } from "svelte";
  import { createCounter } from "@/lib/counter";

  /** A number that rolls to each new value. It is decoration over text that screen readers get elsewhere. */
  let { value, decimals, classNames }: { value: number; decimals: number; classNames?: Record<string, string | undefined> } = $props();
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let host = $state<HTMLElement>();
  let counter = $state.raw<ReturnType<typeof createCounter>>();
  const cn = (base: string, key: string) => (classNames?.[key] ? `${base} ${classNames[key]}` : base);
  const options = () => ({
    value,
    prefix: "",
    suffix: "",
    decimals,
    locale: "en-US",
    animateOnView: false,
    reduced,
    hideOffWheel: false,
    classes: { value: "", symbol: cn("mc-usage-meter__symbol", "symbol"), column: cn("mc-usage-meter__column", "column"), glyph: cn("mc-usage-meter__glyph", "glyph"), sizer: "mc-usage-meter__sizer" },
  });
  onMount(() => {
    const made = createCounter(host!, document.createElement("span"), options());
    counter = made;
    return () => made.destroy();
  });
  $effect(() => {
    void [value, decimals];
    counter?.update(options());
  });
</script>

<span bind:this={host} class={cn("mc-usage-meter__ticker", "ticker")} aria-hidden="true"></span>
