<script lang="ts">
  import TreeView from "@/registry/components/tree-view/tree-view.svelte";
  let expanded = $state(["src"]);
  const nodes = [
    { id: "src", label: "src", children: [{ id: "app", label: "app.ts" }, { id: "lib", label: "lib", children: [{ id: "chart", label: "chart.ts" }] }] },
    { id: "pkg", label: "package.json" },
  ];
</script>

<div style="width: min(280px, 100%)">
  <TreeView {nodes} bind:expanded />
</div>
