<script lang="ts">
  import FloatingButtonGroup from "@/registry/components/floating-button-group/floating-button-group.svelte";
  let last = $state("");
</script>

<div style="display: grid; gap: 8px; justify-items: start">
  <FloatingButtonGroup
    label="Editor"
    variant="floating"
    onaction={(id) => (last = id)}
    items={[{ id: "bold", label: "Bold", shortcut: "⌘B" }, { id: "italic", label: "Italic", shortcut: "⌘I" }, { type: "separator" }, { id: "link", label: "Link" }]}
  />
  <small>{last ? `Pressed ${last}` : ""}</small>
</div>
