<script lang="ts">
  import Slider from "@/registry/components/slider/slider.svelte";
  let volume = $state(40);
  let price = $state<[number, number]>([20, 70]);
</script>

<div style="display: grid; gap: 20px; width: min(340px, 100%)">
  <Slider label="Volume" bind:value={volume} />
  <Slider label="Price" bind:value={price} format={(n) => `$${n}`} />
</div>
