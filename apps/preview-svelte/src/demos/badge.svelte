<script lang="ts">
  import Badge from "@/registry/components/badge/badge.svelte";
</script>

<div style="display: flex; flex-wrap: wrap; gap: 8px;">
  <Badge>Draft</Badge>
  <Badge tone="success">Live</Badge>
  <Badge tone="info" size="sm">New</Badge>
  <Badge tone="warning">Review</Badge>
  <Badge tone="danger">Failed</Badge>
</div>
