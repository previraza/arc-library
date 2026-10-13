<script lang="ts">
  import MorphSelect from "@/registry/components/morph-select/morph-select.svelte";
  let zone = $state<string | null>("paris");
</script>

<MorphSelect label="Time zone" bind:value={zone} items={[{ label: "Europe", options: [{ value: "paris", label: "Paris", meta: "UTC+1" }, { value: "london", label: "London", meta: "UTC+0" }] }, { label: "Americas", options: [{ value: "ny", label: "New York", meta: "UTC-5" }, { value: "sf", label: "San Francisco", meta: "UTC-8" }] }]} />
