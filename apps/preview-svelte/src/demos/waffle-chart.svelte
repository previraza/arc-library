<script lang="ts">
  import WaffleChart from "@/registry/components/waffle-chart/waffle-chart.svelte";
</script>

<div style="width: min(320px, 100%)">
  <WaffleChart label="Traffic by source" unit="visits" data={[{ key: "search", label: "Search", value: 52 }, { key: "direct", label: "Direct", value: 31 }, { key: "social", label: "Social", value: 17 }]} />
</div>
