<script lang="ts">
  // @manicat-dependencies bits-ui
  import { Popover } from "bits-ui";
  import type { PopoverCloseProps } from "bits-ui";

  let { children, ...rest }: PopoverCloseProps = $props();
</script>

<Popover.Close {...rest}>{@render children?.()}</Popover.Close>
