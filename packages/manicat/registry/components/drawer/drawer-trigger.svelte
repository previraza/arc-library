<script lang="ts">
  // @manicat-dependencies bits-ui
  import { Dialog } from "bits-ui";
  import type { DialogTriggerProps } from "bits-ui";

  let { children, ...rest }: DialogTriggerProps = $props();
</script>

<Dialog.Trigger {...rest}>{@render children?.()}</Dialog.Trigger>
