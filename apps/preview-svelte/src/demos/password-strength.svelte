<script lang="ts">
  import PasswordStrength from "@/registry/components/password-strength/password-strength.svelte";
  let password = $state("");
</script>

<div style="width: min(340px, 100%)">
  <PasswordStrength label="New password" bind:value={password} />
</div>
