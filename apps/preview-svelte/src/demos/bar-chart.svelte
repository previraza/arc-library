<script lang="ts">
  import BarChart from "@/registry/components/bar-chart/bar-chart.svelte";
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const data = days.map((label, index) => ({ key: label, label, axisLabel: label[0], value: [320, 540, 410, 620, 780, 290, 350][index] }));
</script>

<div style="width: min(440px, 100%)">
  <BarChart label="Visits" period="This week" unit="visits" showAverage {data} />
</div>
