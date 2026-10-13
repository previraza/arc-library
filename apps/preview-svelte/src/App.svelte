<script lang="ts">
  import type { Component } from "svelte";
  import { entries, loadDemo } from "./ports";

  const docsUrl = import.meta.env.VITE_DOCS_URL ?? "http://localhost:3000";
  const fromHash = () => decodeURIComponent(location.hash.slice(1)) || entries[0]?.name || "";

  let current = $state(fromHash());
  let dark = $state(matchMedia("(prefers-color-scheme: dark)").matches);
  let compare = $state(true);
  let demo = $state<Component | undefined>();

  $effect(() => {
    const onHash = () => (current = fromHash());
    addEventListener("hashchange", onHash);
    return () => removeEventListener("hashchange", onHash);
  });
  $effect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.documentElement.classList.toggle("dark", dark);
  });
  $effect(() => {
    const name = current;
    demo = undefined;
    void loadDemo(name).then((loaded) => {
      if (name === current) demo = loaded;
    });
  });

  const groups = $derived(["components", "blocks"].map((kind) => ({ kind, items: entries.filter((entry) => entry.kind === kind) })));
</script>

<div class="viewer">
  <nav class="viewer__nav" aria-label="Svelte ports">
    {#each groups as group (group.kind)}
      <h2>{group.kind} · {group.items.length}</h2>
      {#each group.items as item (item.name)}
        <a href={`#${item.name}`} aria-current={item.name === current ? "page" : undefined}>{item.name}{#if !item.hasDemo}<small>no demo</small>{/if}</a>
      {/each}
    {/each}
  </nav>
  <main class="viewer__main">
    <div class="viewer__bar">
      <h1>{current || "No Svelte port yet"}</h1>
      <button type="button" aria-pressed={compare} onclick={() => (compare = !compare)}>Compare with React</button>
      <button type="button" aria-pressed={dark} onclick={() => (dark = !dark)}>Dark</button>
    </div>
    <div class="viewer__panes">
      <section class="viewer__pane">
        <span>Svelte</span>
        <div class="viewer__stage">
          {#if demo}
            {@const Demo = demo}
            <Demo />
          {:else}
            <p class="viewer__empty">No demo yet: add <code>apps/docs/content/usage/{current}.svelte.txt</code>.</p>
          {/if}
        </div>
      </section>
      {#if compare}
        <section class="viewer__pane">
          <span>React (docs)</span>
          <div class="viewer__stage"><iframe title={`${current} in React`} src={`${docsUrl}/frame/demo/${current}`}></iframe></div>
        </section>
      {/if}
    </div>
  </main>
</div>
