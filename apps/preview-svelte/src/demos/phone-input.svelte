<script lang="ts">
  import PhoneInput from "@/registry/components/phone-input/phone-input.svelte";
  let phone = $state("");
</script>

<div style="width: min(340px, 100%); display: grid; gap: 8px">
  <PhoneInput label="Phone" description="Include the country code." bind:value={phone} />
  <small>{phone || "No number yet"}</small>
</div>
