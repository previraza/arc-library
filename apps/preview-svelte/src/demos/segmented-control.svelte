<script lang="ts">
  import SegmentedControl from "@/registry/components/segmented-control/segmented-control.svelte";
  let view = $state("list");
</script>

<SegmentedControl label="View" bind:value={view} options={[{ value: "list", label: "List" }, { value: "board", label: "Board" }, { value: "calendar", label: "Calendar" }]} />
