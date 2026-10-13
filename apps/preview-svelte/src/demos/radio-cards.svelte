<script lang="ts">
  import RadioCards from "@/registry/components/radio-cards/radio-cards.svelte";
  let plan = $state<string | null>("pro");
</script>

<div style="width: min(480px, 100%)">
  <RadioCards bind:value={plan} options={[{ value: "free", label: "Free", description: "For side projects", meta: "$0" }, { value: "pro", label: "Pro", description: "For teams", meta: "$12" }, { value: "scale", label: "Scale", description: "Custom", meta: "Talk to us", disabled: true }]} />
</div>
