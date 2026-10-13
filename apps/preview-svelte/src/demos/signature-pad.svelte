<script lang="ts">
  import SignaturePad, { type InkStroke } from "@/registry/components/signature-pad/signature-pad.svelte";
  let strokes = $state<InkStroke[]>([]);
</script>

<div style="width: min(420px, 100%)">
  <SignaturePad signer="Ada Lovelace" bind:strokes />
  <small>{strokes.length} stroke{strokes.length === 1 ? "" : "s"}</small>
</div>
