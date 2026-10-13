<script lang="ts">
  import BillingToggle from "@/registry/components/billing-toggle/billing-toggle.svelte";
  let period = $state("monthly");
</script>

<div style="display: grid; gap: 12px; justify-items: start">
  <BillingToggle bind:value={period} />
  <strong>{period === "monthly" ? "$12 / month" : "$115 / year"}</strong>
</div>
