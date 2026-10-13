<script lang="ts">
  import SortableDataTable from "@/registry/components/sortable-data-table/sortable-data-table.svelte";
  let selected = $state<string[]>([]);
  const rows = [
    { id: "1", name: "Ada Lovelace", role: "Engineer", seats: 12 },
    { id: "2", name: "Lin Chen", role: "Designer", seats: 4 },
    { id: "3", name: "Grace Hopper", role: "Admiral", seats: 30 },
  ];
</script>

<div style="width: min(520px, 100%)">
  <SortableDataTable {rows} rowKey="id" selectable bind:selected defaultSort={{ key: "name", direction: "asc" }} columns={[{ key: "name", label: "Name", sortable: true }, { key: "role", label: "Role", sortable: true }, { key: "seats", label: "Seats", sortable: true, numeric: true }]} />
</div>
