<script lang="ts">
  // @manicat-dependencies bits-ui
  import { Popover } from "bits-ui";
  import type { PopoverTriggerProps } from "bits-ui";

  /** The trigger anchors the panel, so it opts out of press-scale: a scaled rect measured on open would shift the panel as the trigger springs back. */
  let { class: className, classNames, children, ...rest }: PopoverTriggerProps & { classNames?: { anchor?: string } } = $props();
</script>

<Popover.Trigger {...rest} class={["mc-popover__anchor", className, classNames?.anchor]}>{@render children?.()}</Popover.Trigger>
