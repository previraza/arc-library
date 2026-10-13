<script lang="ts">
  import FilterToolbar, { type FilterChip } from "@/registry/components/filter-toolbar/filter-toolbar.svelte";
  let filters = $state<FilterChip[]>([{ id: "status", label: "Open", value: "open" }]);
</script>

<FilterToolbar bind:filters fields={[{ id: "status", label: "Status", options: ["Open", "Closed"] }, { id: "owner", label: "Owner", options: [{ value: "ada", label: "Ada", hint: 4 }, { value: "lin", label: "Lin", hint: 2 }] }]} />
