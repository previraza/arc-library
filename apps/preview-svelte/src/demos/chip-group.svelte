<script lang="ts">
  import ChipGroup from "@/registry/components/chip-group/chip-group.svelte";
  let value = $state(["design"]);
  const options = ["Design", "Code", "Docs", "Tests", "Release"].map((label) => ({ value: label.toLowerCase(), label }));
</script>

<ChipGroup label="Topics" {options} maxVisible={4} bind:value />
