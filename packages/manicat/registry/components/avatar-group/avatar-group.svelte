<script lang="ts" module>
  export interface AvatarGroupMember {
    name: string;
    src?: string;
    status?: "online" | "offline";
  }
</script>

<script lang="ts">
  // @manicat-dependencies motion
  import Avatar from "@/registry/components/avatar/avatar.svelte";
  import { poseTransition, sizeTransition } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  interface Props {
    members: AvatarGroupMember[];
    max?: number;
    size?: "sm" | "md" | "lg";
    label?: string;
    /** Extend the inner, named parts of the group: slot, lift, avatar, tip, overflow or count. */
    classNames?: { slot?: string; lift?: string; avatar?: string; tip?: string; overflow?: string; count?: string };
  }

  let { members, max = 4, size = "md", label = "Team members", classNames }: Props = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const visible = $derived(members.slice(0, Math.max(0, max)));
  const overflow = $derived(Math.max(0, members.length - visible.length));
  // More people roll the count up from below; fewer drop it in from above.
  let direction = 1;
  let previous = 0;
  $effect.pre(() => {
    direction = overflow < previous ? -1 : 1;
    previous = overflow;
  });

  // A person joining or leaving opens or closes their slot, so the rest of the stack slides instead of jumping.
  const slot = sizeTransition("width", reduced ? { duration: 0 } : { spring: "morph" }, { opacity: 0, scale: 0.9 });
  const em = (node: Element, amount: number) => amount * parseFloat(getComputedStyle(node).fontSize);
  const blur = reduced ? undefined : motionTokens.blur.subtle;
  function rise(node: HTMLElement, { out = false }: { out?: boolean }) {
    const offset = reduced ? 0 : em(node, (out ? -0.4 : 0.4) * direction);
    return poseTransition({ opacity: 0, y: offset, blur }, { opacity: 1, y: 0, blur: blur === undefined ? undefined : 0 }, reduced ? { duration: motionTokens.duration.instant } : out ? { duration: motionTokens.duration.fast, ease: "standard" } : { duration: motionTokens.duration.standard, ease: "enter" }, { pop: out })(node);
  }
</script>

<div class={["mc-avatar-group__group", `mc-avatar-group__${size}`]} role="group" aria-label={label} style={`--count: ${visible.length + (overflow > 0 ? 1 : 0)}`}>
  {#each visible as member, index (member.name)}
    <span class={["mc-avatar-group__slot", classNames?.slot]} style={`--index: ${index}`} in:slot out:slot>
      <span class={["mc-avatar-group__lift", classNames?.lift]}>
        <Avatar class={["mc-avatar-group__avatar", classNames?.avatar].filter(Boolean).join(" ")} name={member.name} src={member.src} status={member.status} {size} />
        <span class={["mc-avatar-group__tip", classNames?.tip]} aria-hidden="true">{member.name}</span>
      </span>
    </span>
  {/each}
  {#if overflow > 0}
    <span class={["mc-avatar-group__slot", classNames?.slot]} style={`--index: ${visible.length}`} in:slot out:slot>
      <span class={["mc-avatar-group__lift", "mc-avatar-group__overflow", `mc-avatar-group__${size}`, classNames?.overflow]} role="img" aria-label={`${overflow} more ${label.toLowerCase()}`}>
        {#key overflow}
          <span class={["mc-avatar-group__count", classNames?.count]} aria-hidden="true" in:rise={{}} out:rise={{ out: true }}>+{overflow}</span>
        {/key}
      </span>
    </span>
  {/if}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-avatar-group__group { --avatar-size: 36px; display: inline-flex; height: var(--avatar-size); align-items: center; padding-left: 6px; }
.mc-avatar-group__group.mc-avatar-group__sm { --avatar-size: 28px; }
.mc-avatar-group__group.mc-avatar-group__lg { --avatar-size: 48px; }
/* Each slot is the avatar's visible width, so a slot that opens or closes moves the rest of the stack smoothly. */
.mc-avatar-group__slot { position: relative; display: inline-flex; flex: 0 0 auto; height: var(--avatar-size); align-items: center; }
/* One wrapper per person carries every hover move as a single translate, so the stack never changes size. */
.mc-avatar-group__lift { --fan: 0px; --aside: 0px; --rise: 0px; position: relative; display: inline-flex; margin-left: -6px; border-radius: var(--radius-pill); transform: translate(calc(var(--fan) + var(--aside)), var(--rise)); transition: transform var(--duration-standard) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard); }
.mc-avatar-group__avatar, .mc-avatar-group__overflow { border: 2px solid var(--surface); box-shadow: 0 0 0 1px var(--border); transition: box-shadow var(--duration-fast) var(--ease-standard); }
.mc-avatar-group__overflow { position: relative; display: inline-grid; place-items: center; overflow: hidden; border-radius: var(--radius-pill); background: var(--surface-muted); color: var(--text-secondary); font-size: var(--text-xs); font-weight: 500; font-variant-numeric: tabular-nums; }
.mc-avatar-group__count { display: inline-block; }
.mc-avatar-group__overflow.mc-avatar-group__sm { width: 28px; height: 28px; font-size: 10px; }
.mc-avatar-group__overflow.mc-avatar-group__md { width: 36px; height: 36px; }
.mc-avatar-group__overflow.mc-avatar-group__lg { width: 48px; height: 48px; font-size: var(--text-sm); }
/* The name floats above the stack, outside the layout, so showing it never moves anything. */
.mc-avatar-group__tip { position: absolute; z-index: 2; bottom: calc(100% + 8px); left: 50%; padding: 4px 8px; border-radius: var(--radius-pill); background: var(--foreground); color: var(--background); font-size: var(--text-xs); font-weight: 500; line-height: var(--leading-body); white-space: nowrap; pointer-events: none; opacity: 0; transform: translate(-50%, 3px); transition: opacity var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-standard); }
/* Pointing at the stack loosens its overlap from the center; the person under the pointer lifts with a crisp ring and names themselves, and their neighbors ease aside. */
@media (hover: hover) and (pointer: fine) {
  .mc-avatar-group__group:hover .mc-avatar-group__lift { --fan: calc((var(--index) - (var(--count) - 1) / 2) * 4px); }
  .mc-avatar-group__slot:hover { z-index: 1; }
  .mc-avatar-group__slot:hover .mc-avatar-group__lift { --rise: -2px; }
  .mc-avatar-group__slot:hover ~ .mc-avatar-group__slot .mc-avatar-group__lift { --aside: 3px; }
  .mc-avatar-group__slot:has(~ .mc-avatar-group__slot:hover) .mc-avatar-group__lift { --aside: -3px; }
  .mc-avatar-group__slot:hover .mc-avatar-group__avatar, .mc-avatar-group__slot:hover .mc-avatar-group__overflow { box-shadow: 0 0 0 1px var(--border-strong); }
  .mc-avatar-group__slot:hover .mc-avatar-group__tip { opacity: 1; transform: translate(-50%, 0); transition-delay: 60ms; }
}
/* Reduced motion keeps the stack still; the ring and name still answer the pointer. */
@media (prefers-reduced-motion: reduce) { .mc-avatar-group__lift { transform: none !important; transition: none; } .mc-avatar-group__tip { transform: translate(-50%, 0); transition: none; } }
}
</style>
