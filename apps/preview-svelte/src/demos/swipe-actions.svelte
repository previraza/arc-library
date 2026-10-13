<script lang="ts">
  import SwipeActions from "@/registry/components/swipe-actions/swipe-actions.svelte";
  let last = $state("");
</script>

<div style="width: min(380px, 100%); display: grid; gap: 8px">
  <SwipeActions label="Message from Ada" leading={[{ label: "Pin", tone: "accent", onSelect: () => (last = "Pinned") }]} trailing={[{ label: "Archive", onSelect: () => (last = "Archived") }, { label: "Delete", tone: "danger", onSelect: () => (last = "Deleted") }]}>
    <div style="padding: 14px 16px"><strong>Ada</strong><br />Swipe or use the arrow keys.</div>
  </SwipeActions>
  <small>{last}</small>
</div>
