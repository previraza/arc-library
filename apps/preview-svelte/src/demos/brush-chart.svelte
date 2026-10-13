<script lang="ts">
  import BrushChart from "@/registry/components/brush-chart/brush-chart.svelte";
  const start = Date.UTC(2026, 0, 1);
  const data = Array.from({ length: 60 }, (_, i) => ({ date: start + i * 86_400_000, value: 40 + Math.round(30 * Math.sin(i / 6)) + (i % 7) * 3 }));
</script>

<div style="width: min(520px, 100%)">
  <BrushChart label="Daily active users" {data} annotations={[{ date: start + 20 * 86_400_000, label: "Launch", description: "Version 2 shipped" }]} />
</div>
