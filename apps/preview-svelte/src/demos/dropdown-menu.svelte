<script lang="ts">
  import DropdownMenu from "@/registry/components/dropdown-menu/dropdown-menu.svelte";
  let last = $state("");
</script>

<div style="display: grid; gap: 8px; justify-items: start">
  <DropdownMenu label="Actions" items={[{ label: "Rename", onSelect: () => (last = "Rename") }, { label: "Duplicate", onSelect: () => (last = "Duplicate") }, { label: "Delete", destructive: true, separatorBefore: true, onSelect: () => (last = "Delete") }]} />
  <small>{last}</small>
</div>
