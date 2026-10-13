<script lang="ts">
  import NumberField from "@/registry/components/number-field/number-field.svelte";
  let seats = $state(5);
</script>

<div style="width: min(260px, 100%)">
  <NumberField label="Seats" min={1} max={50} suffix={(n) => (n === 1 ? "seat" : "seats")} bind:value={seats} />
</div>
