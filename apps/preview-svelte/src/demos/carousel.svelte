<script lang="ts">
  import Carousel from "@/registry/components/carousel/carousel.svelte";
  const colors = ["#7747ff", "#2563eb", "#22c55e", "#f59e0b"];
</script>

<div style="width: min(460px, 100%)">
  <Carousel label="Highlights" count={colors.length}>
    {#each colors as color, at (color)}
      <div style="height: 140px; border-radius: 16px; background: {color}; color: white; display: grid; place-items: center; font-weight: 600">Slide {at + 1}</div>
    {/each}
  </Carousel>
</div>
