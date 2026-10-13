<script lang="ts">
  import DonutChart from "@/registry/components/donut-chart/donut-chart.svelte";
</script>

<DonutChart label="Revenue by plan" unit="$" data={[{ key: "free", label: "Free", value: 120 }, { key: "pro", label: "Pro", value: 640 }, { key: "scale", label: "Scale", value: 410 }, { key: "ent", label: "Enterprise", value: 230 }]} />
