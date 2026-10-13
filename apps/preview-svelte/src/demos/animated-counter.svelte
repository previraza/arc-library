<script lang="ts">
  import AnimatedCounter from "@/registry/components/animated-counter/animated-counter.svelte";
  let revenue = $state(12480);
</script>

<div style="display: grid; gap: 12px; justify-items: start">
  <AnimatedCounter label="Revenue" prefix="$" value={revenue} />
  <button type="button" onclick={() => (revenue += 2500)}>Add $2,500</button>
</div>
