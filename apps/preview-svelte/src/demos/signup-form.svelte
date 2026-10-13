<script lang="ts">
  import SignupForm from "@/registry/blocks/signup-form/signup-form.svelte";
</script>

<div style="width: min(420px, 100%)">
  <SignupForm onSubmit={() => new Promise((resolve) => setTimeout(resolve, 800))} />
</div>
