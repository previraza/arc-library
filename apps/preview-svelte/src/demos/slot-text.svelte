<script lang="ts">
  import SlotText from "@/registry/components/slot-text/slot-text.svelte";
  let count = $state(1284);
</script>

<div style="display: flex; gap: 12px; align-items: center; font-size: 28px">
  <SlotText value={count} />
  <button type="button" onclick={() => (count += Math.round(Math.random() * 900))}>Add</button>
</div>
