<script lang="ts">
  import ExpandingButtonGroup from "@/registry/components/expanding-button-group/expanding-button-group.svelte";
</script>

{#snippet icon(id: string)}<span aria-hidden="true">{id === "archive" ? "▣" : id === "star" ? "★" : "✕"}</span>{/snippet}

<ExpandingButtonGroup
  label="Message actions"
  {icon}
  items={[{ id: "archive", label: "Archive", doneLabel: "Archived" }, { id: "star", label: "Star", doneLabel: "Starred" }, { id: "delete", label: "Delete", tone: "danger" }]}
/>
