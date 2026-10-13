<script lang="ts">
  // @manicat-dependencies bits-ui
  import { Dialog } from "bits-ui";
  import type { DialogCloseProps } from "bits-ui";

  let { children, ...rest }: DialogCloseProps = $props();
</script>

<Dialog.Close {...rest}>{@render children?.()}</Dialog.Close>
