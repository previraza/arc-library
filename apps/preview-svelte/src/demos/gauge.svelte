<script lang="ts">
  import Gauge from "@/registry/components/gauge/gauge.svelte";
  let value = $state(64);
</script>

<div style="display: grid; gap: 12px; justify-items: start">
  <Gauge {value} label="CPU" thresholds={[{ from: 0, tone: "success", label: "Healthy" }, { from: 60, tone: "warning", label: "Busy" }, { from: 85, tone: "danger", label: "Overloaded" }]} />
  <input type="range" min="0" max="100" bind:value aria-label="Value" />
</div>
