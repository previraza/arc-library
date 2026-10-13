<script lang="ts">
  import Ridgeline from "@/registry/components/ridgeline/ridgeline.svelte";
</script>

<div style="width: min(460px, 100%)">
  <Ridgeline
    label="Response time by region"
    unit="ms"
    tint
    series={[
      { id: "eu", label: "Europe", values: [12, 30, 44, 38, 20, 14, 9] },
      { id: "us", label: "US", values: [8, 14, 28, 52, 40, 22, 12] },
      { id: "ap", label: "Asia", values: [5, 9, 16, 24, 36, 41, 30] },
    ]}
  />
</div>
