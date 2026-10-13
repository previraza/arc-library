<script lang="ts">
  import OtpInput from "@/registry/components/otp-input/otp-input.svelte";
  let code = $state("");
</script>

<div style="display: grid; gap: 8px">
  <OtpInput label="Verification code" description="Sent by SMS." bind:value={code} />
  <small>{code.length === 6 ? "Complete" : `${code.length}/6`}</small>
</div>
