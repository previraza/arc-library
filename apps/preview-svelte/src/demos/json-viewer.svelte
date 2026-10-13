<script lang="ts">
  import JsonViewer from "@/registry/components/json-viewer/json-viewer.svelte";
  const data = { name: "manicat", version: "2.0.0", private: false, tags: ["ui", "registry"], author: { name: "Ada", links: { site: "https://example.com" } } };
</script>

<div style="width: min(420px, 100%)">
  <JsonViewer {data} defaultExpandDepth={2} />
</div>
