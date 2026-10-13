<script lang="ts">
  // @manicat-dependencies bits-ui motion
  import { setContext } from "svelte";
  import type { Snippet } from "svelte";
  import { Tabs } from "bits-ui";
  import { createPanelMemory, tabsKey } from "@/lib/tabs-motion";
  import type { TabsClassNames, TabsState } from "@/lib/tabs-motion";

  interface Props {
    /** The active tab's value. Bind it with `bind:value`; without it the tabs keep their own, starting at `defaultValue`. */
    value?: string;
    defaultValue?: string;
    class?: string;
    children?: Snippet;
    /** Extend the inner, named parts of the tabs: listShell, scrollButton, viewport, list, trigger, selection, triggerLabel or content. */
    classNames?: TabsClassNames;
    [key: string]: unknown;
  }

  let { value = $bindable(), defaultValue, class: className, children, classNames, ...rest }: Props = $props();

  let internal = $state(defaultValue ?? "");
  let direction = $state(1);
  let root = $state<HTMLElement | null>(null);
  const memory = createPanelMemory();
  const active = () => value ?? internal;

  function change(next: string) {
    const frame = root;
    memory.leaving = frame?.querySelector(':scope > [role="tabpanel"][data-state="active"]')?.getBoundingClientRect() ?? null;
    const order = frame ? Array.from(frame.querySelectorAll<HTMLElement>('[role="tab"][data-value]')).filter((tab) => tab.closest(".mc-tabs__root") === frame).map((tab) => tab.dataset.value) : [];
    const from = order.indexOf(active());
    const to = order.indexOf(next);
    if (from >= 0 && to >= 0 && from !== to) direction = to > from ? 1 : -1;
    internal = next;
    value = next;
  }

  const tabs: TabsState = { active, direction: () => direction, classNames: () => classNames, memory };
  setContext(tabsKey, tabs);
</script>

<Tabs.Root {...rest} bind:ref={root} class={["mc-tabs__root", className]} value={active()} onValueChange={change}>{@render children?.()}</Tabs.Root>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* Positioned so an outgoing panel pops out exactly where it was while the next one takes its place. */
.mc-tabs__root { position: relative; }
.mc-tabs__listShell { position: relative; display: inline-flex; max-width: 100%; min-width: 0; align-items: center; isolation: isolate; border: 1px solid var(--border); border-radius: var(--radius-control); background: var(--surface-muted); }
.mc-tabs__viewport { min-width: 0; overflow-x: auto; border-radius: inherit; scrollbar-width: none; }
.mc-tabs__viewport::-webkit-scrollbar { display: none; }
.mc-tabs__listShell[data-left="true"] .mc-tabs__viewport { mask-image: linear-gradient(to right, transparent, black 35px, black); }
.mc-tabs__listShell[data-right="true"] .mc-tabs__viewport { mask-image: linear-gradient(to right, black, black calc(100% - 35px), transparent); }
.mc-tabs__listShell[data-left="true"][data-right="true"] .mc-tabs__viewport { mask-image: linear-gradient(to right, transparent, black 35px, black calc(100% - 35px), transparent); }
/* The list owns the stacking context so the gliding highlight passes under every label, not over earlier ones. */
.mc-tabs__list { isolation: isolate; display: inline-flex; width: max-content; align-items: center; gap: var(--space-1); padding: var(--space-1); }
.mc-tabs__scrollButton { position: absolute; z-index: 2; top: 0; bottom: 0; display: grid; width: 33px; place-items: center; border: 0; background: var(--surface-muted); color: var(--foreground); }
.mc-tabs__scrollLeft { left: 0; border-radius: var(--radius-control) 0 0 var(--radius-control); }
.mc-tabs__scrollRight { right: 0; border-radius: 0 var(--radius-control) var(--radius-control) 0; }
.mc-tabs__scrollButton:disabled { opacity: 0; pointer-events: none; }
.mc-tabs__scrollButton:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: -3px; }
.mc-tabs__trigger { position: relative; -webkit-tap-highlight-color: transparent; display: inline-grid; min-width: 5.5rem; place-items: center; flex: 0 0 auto; min-height: var(--control-height-sm); border: 0; border-radius: calc(var(--radius-control) - 3px); padding: 0 var(--space-3); background: transparent; color: var(--text-muted); font: inherit; font-size: var(--text-sm); font-weight: 500; white-space: nowrap; cursor: pointer; transition: color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-tabs__trigger:hover { color: var(--foreground); } }
.mc-tabs__trigger:active { color: var(--foreground); }.mc-tabs__trigger[data-state="active"] { color: var(--accent-strong); }
.mc-tabs__selection { position: absolute; z-index: -1; inset: 0; border: 1px solid var(--border); border-radius: inherit; background: var(--surface); box-shadow: var(--shadow-resting); will-change: transform; }
.mc-tabs__triggerLabel { position: relative; z-index: 1; }
.mc-tabs__trigger:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
.mc-tabs__trigger:disabled { cursor: not-allowed; opacity: .5; }
.mc-tabs__content { margin-top: var(--space-4); color: var(--text-secondary); font-size: var(--text-sm); line-height: var(--leading-body); }
/* The outgoing panel is lifted out of flow by the presence animation; drop its margin so it stays in place and ignore stray clicks. */
.mc-tabs__content[data-motion-pop-id] { margin-top: 0; }
.mc-tabs__content[data-state="inactive"] { pointer-events: none; }
.mc-tabs__content:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 3px; border-radius: var(--radius-control); }
@media (prefers-reduced-motion: reduce) { .mc-tabs__trigger { transition: none; } }
}
</style>
