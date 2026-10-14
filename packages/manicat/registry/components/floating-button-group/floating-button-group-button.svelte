<script lang="ts">
  // @manicat-dependencies motion
  import { getContext } from "svelte";
  import FloatingButtonGroupBody from "@/registry/components/floating-button-group/floating-button-group-body.svelte";
  import { groupKey } from "@/lib/floating-button-group";
  import type { GroupContext } from "@/lib/floating-button-group";

  let { action, iconOnly, ...rest }: { action: { id: string; label: string; icon?: import("svelte").Component; shortcut?: string; disabled?: boolean; pressed?: boolean; reserveLabels?: readonly string[] }; iconOnly: boolean; [key: string]: unknown } = $props();
  const group = getContext<GroupContext>(groupKey);
  const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);
</script>

<button
  {...rest}
  type="button"
  class={cn("mc-floating-button-group__item", group.classNames()?.item)}
  data-fbg-item
  data-fbg-item-id={action.id}
  data-active={group.activeId() === action.id ? "" : undefined}
  data-icon={action.icon ? "" : undefined}
  data-icon-only={iconOnly ? "" : undefined}
  aria-label={action.label}
  aria-pressed={action.pressed === undefined ? undefined : action.pressed}
  aria-disabled={action.disabled || undefined}
  tabindex={group.tabStop() === action.id ? 0 : -1}
  onpointermove={(event) => { if (event.pointerType === "mouse" || event.pointerType === "pen") group.hover(action.id); }}
  onpointerdown={(event) => { if (event.button === 0) group.press(action.id, !!action.disabled); }}
  onpointerup={() => group.release()}
  onpointercancel={() => group.release()}
  onpointerleave={() => group.release()}
  onkeydown={(event) => { if ((event.key === "Enter" || event.key === " ") && !event.repeat && !action.disabled) group.press(action.id, false); }}
  onkeyup={(event) => { if (event.key === "Enter" || event.key === " ") group.release(); }}
  onfocus={(event) => group.focus(event, action.id)}
  onclick={() => group.select(action.id)}
>
  <FloatingButtonGroupBody label={action.label} icon={action.icon} {iconOnly} reserve={action.reserveLabels ?? []} classNames={group.classNames()} />
</button>
