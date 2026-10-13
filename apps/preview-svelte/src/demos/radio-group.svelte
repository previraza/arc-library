<script lang="ts">
  import RadioGroup from "@/registry/components/radio-group/radio-group.svelte";
  let plan = $state("pro");
</script>

<RadioGroup label="Plan" bind:value={plan} options={[{ value: "free", label: "Free", description: "For side projects" }, { value: "pro", label: "Pro", description: "For teams" }, { value: "scale", label: "Scale" }]} />
