<script lang="ts" module>
  export type EmptyScene = "search" | "offline" | "inbox" | "map";
  type Phase = "idle" | "loading" | "done";
</script>

<script lang="ts">
  import Button from "@/registry/components/button/button.svelte";
  import SegmentedControl from "@/registry/components/segmented-control/segmented-control.svelte";

  const COPY = {
    search: {
      idle: { title: "No results for “Q3 roadmap”", line: "Two filters are on: owner is Emma Collins and status is archived.", action: "Clear filters" },
      done: { title: "12 results for “Q3 roadmap”", line: "Filters cleared. Showing matches from every owner and status.", action: "Restore filters" },
      loading: "", wait: 0, glyph: "⌕",
    },
    offline: {
      idle: { title: "You are offline", line: "Edits are saved on this device and sync when the connection returns.", action: "Try again" },
      done: { title: "Back online", line: "Three edits synced to the Northwind workspace just now.", action: "Go offline" },
      loading: "Reaching sync.northwind.example…", wait: 1400, glyph: "⌁",
    },
    inbox: {
      idle: { title: "All caught up", line: "You have read every message in Inbox. New mail lands here first.", action: "Check for mail" },
      done: { title: "Still all caught up", line: "Checked just now. Nothing new since 8:30 this morning.", action: "Check again" },
      loading: "Checking for new mail…", wait: 1100, glyph: "✓",
    },
    map: {
      idle: { title: "Page not found", line: "The link to /projects/atlas-2023 is broken, or the page has moved.", action: "Find the page" },
      done: { title: "Found it in Archive", line: "Atlas 2023 roadmap moved to /archive/atlas-2023 in March.", action: "Show broken link" },
      loading: "Searching the workspace for Atlas…", wait: 1200, glyph: "?",
    },
  };
  const SCENES = [
    { value: "search", label: "No results" },
    { value: "offline", label: "Offline" },
    { value: "inbox", label: "Caught up" },
    { value: "map", label: "Not found" },
  ];

  interface Props {
    /** Scene shown first. */
    defaultScene?: EmptyScene;
    /** Called when a scene's primary action finishes. */
    onaction?: (scene: EmptyScene, phase: Phase) => void;
    /** Extend the inner, named parts of the block: art, glyph, title or line. */
    classNames?: { art?: string; glyph?: string; title?: string; line?: string };
  }

  let { defaultScene = "search", onaction, classNames }: Props = $props();

  // svelte-ignore state_referenced_locally
  let scene = $state<EmptyScene>(defaultScene);
  let phase = $state<Phase>("idle");
  const entry = $derived(COPY[scene]);
  const copy = $derived(phase === "done" ? entry.done : entry.idle);
  let timer: ReturnType<typeof setTimeout> | undefined;

  function settle() {
    phase = "done";
    onaction?.(scene, "done");
  }
  function act() {
    if (phase === "loading") return;
    if (phase === "done") return void (phase = "idle");
    if (entry.wait === 0) return settle();
    phase = "loading";
    timer = setTimeout(settle, entry.wait);
  }
  function pick(next: string | undefined) {
    clearTimeout(timer);
    scene = (next ?? "search") as EmptyScene;
    phase = "idle";
  }

  $effect(() => () => clearTimeout(timer));
</script>

<section class="mc-empty" aria-label="Empty states">
  <SegmentedControl bind:value={() => scene, pick} label="Empty state" options={SCENES} />
  <div class={["mc-empty__art", classNames?.art]}>
    <span class={["mc-empty__glyph", { "mc-empty__glyph--done": phase === "done" }, classNames?.glyph]} aria-hidden="true">{entry.glyph}</span>
  </div>
  <h2 class={["mc-empty__title", classNames?.title]}>{copy.title}</h2>
  <p class={["mc-empty__line", classNames?.line]} aria-live="polite">{phase === "loading" ? entry.loading : copy.line}</p>
  <Button size="sm" loading={phase === "loading"} onclick={act}>{copy.action}</Button>
</section>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-empty { display: grid; justify-items: center; gap: 14px; max-width: 440px; color: var(--foreground); text-align: center; }
.mc-empty__art { display: grid; place-items: center; align-self: stretch; height: 180px; border: 1px solid var(--border); border-radius: 28px; background: var(--surface-muted); }
.mc-empty__glyph { color: var(--text-muted); font-size: 64px; line-height: 1; transition: color var(--duration-standard) var(--ease-standard), transform var(--duration-standard) var(--ease-standard); }
.mc-empty__glyph--done { color: var(--success); transform: scale(1.08); }
.mc-empty__title { margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -.03em; }
.mc-empty__line { margin: 0; color: var(--text-secondary); font-size: var(--text-sm); }
}
</style>
