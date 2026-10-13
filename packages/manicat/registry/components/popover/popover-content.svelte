<script lang="ts">
  // @manicat-dependencies bits-ui
  import { Popover } from "bits-ui";
  import type { PopoverContentProps } from "bits-ui";

  let { class: className, classNames, align = "start", sideOffset = 6, collisionPadding = 10, children, ...rest }: PopoverContentProps & { classNames?: { content?: string } } = $props();
</script>

<Popover.Portal>
  <Popover.Content {...rest} {align} {sideOffset} {collisionPadding} class={["mc-popover__content", className, classNames?.content]}>{@render children?.()}</Popover.Content>
</Popover.Portal>
