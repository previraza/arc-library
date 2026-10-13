<script lang="ts">
  import Streamgraph from "@/registry/components/streamgraph/streamgraph.svelte";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const data = months.map((label, i) => ({ key: label, label, axisLabel: label, values: { web: 20 + i * 4, ios: 12 + (i % 3) * 5, api: 8 + i * 2 } }));
</script>

<div style="width: min(480px, 100%)">
  <Streamgraph label="Requests by client" {data} series={[{ key: "web", label: "Web" }, { key: "ios", label: "iOS" }, { key: "api", label: "API" }]} />
</div>
