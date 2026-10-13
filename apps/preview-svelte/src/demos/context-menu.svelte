<script lang="ts">
  import ContextMenu from "@/registry/components/context-menu/context-menu.svelte";
  let last = $state("");
</script>

<ContextMenu onselect={(id) => (last = id)} items={[{ id: "copy", label: "Copy" }, { id: "paste", label: "Paste" }, { id: "grid", label: "Show grid", checked: true }, { id: "delete", label: "Delete", destructive: true }]}>
  <div style="display: grid; place-items: center; width: min(320px, 100%); height: 120px; border: 1px dashed var(--border); border-radius: 16px">Right-click here {last && `· ${last}`}</div>
</ContextMenu>
