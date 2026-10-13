<script lang="ts">
  import SlopeChart from "@/registry/components/slope-chart/slope-chart.svelte";
</script>

<div style="width: min(460px, 100%)">
  <SlopeChart
    label="Plan adoption"
    startLabel="Q1"
    endLabel="Q2"
    ranks
    data={[{ key: "free", label: "Free", start: 62, end: 54 }, { key: "pro", label: "Pro", start: 28, end: 37 }, { key: "scale", label: "Scale", start: 10, end: 9 }]}
    formatValue={(n) => `${n}%`}
  />
</div>
