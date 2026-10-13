<script lang="ts">
  import ResizablePanels from "@/registry/components/resizable-panels/resizable-panels.svelte";
</script>

<div style="height: 180px; width: min(520px, 100%)">
  <ResizablePanels panels={[{ id: "nav", label: "Navigation", defaultSize: 30, minSize: 15 }, { id: "main", label: "Content", defaultSize: 70 }]}>
    {#snippet panel(id)}<div style="padding: 12px">{id === "nav" ? "Navigation" : "Content"}</div>{/snippet}
  </ResizablePanels>
</div>
