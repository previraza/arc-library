<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import type { Component } from "vue";
import { entries, loadDemo } from "./ports";

const docsUrl = import.meta.env.VITE_DOCS_URL ?? "http://localhost:3000";
const frameFor = (name: string) => (name.startsWith("example:") ? `example/${name.slice(8)}` : `demo/${name}`);
const fromHash = () => decodeURIComponent(location.hash.slice(1)) || entries[0]?.name || "";

const current = ref(fromHash());
const dark = ref(matchMedia("(prefers-color-scheme: dark)").matches);
const compare = ref(true);
const demo = shallowRef<Component | undefined>();
const loading = ref(true);

const onHash = () => (current.value = fromHash());
onMounted(() => addEventListener("hashchange", onHash));
onBeforeUnmount(() => removeEventListener("hashchange", onHash));

watch(
  dark,
  (value) => {
    document.documentElement.dataset.theme = value ? "dark" : "light";
    document.documentElement.classList.toggle("dark", value);
  },
  { immediate: true },
);
watch(
  current,
  async (name) => {
    demo.value = undefined;
    loading.value = true;
    const loaded = await loadDemo(name);
    if (name === current.value) {
      demo.value = loaded;
      loading.value = false;
    }
  },
  { immediate: true },
);

const groups = computed(() => ["components", "blocks"].map((kind) => ({ kind, items: entries.filter((entry) => entry.kind === kind) })));
</script>

<template>
  <div class="viewer">
    <nav class="viewer__nav" aria-label="Vue ports">
      <template v-for="group in groups" :key="group.kind">
        <h2>{{ group.kind }} · {{ group.items.length }}</h2>
        <a v-for="item in group.items" :key="item.name" :href="`#${item.name}`" :aria-current="item.name === current ? 'page' : undefined">{{ item.name }}<small v-if="!item.hasDemo">no demo</small></a>
      </template>
    </nav>
    <main class="viewer__main">
      <div class="viewer__bar">
        <h1>{{ current || "No Vue port yet" }}</h1>
        <button type="button" :aria-pressed="compare" @click="compare = !compare">Compare with React</button>
        <button type="button" :aria-pressed="dark" @click="dark = !dark">Dark</button>
      </div>
      <div class="viewer__panes">
        <section class="viewer__pane">
          <span>Vue</span>
          <div class="viewer__stage">
            <div v-if="demo" class="viewer__demo"><component :is="demo" /></div>
            <div v-else-if="loading" class="viewer__loading" aria-label="Loading"><span /><span /></div>
            <p v-else class="viewer__empty">No demo yet: add <code>apps/docs/content/usage/{{ current }}.vue.txt</code>.</p>
          </div>
        </section>
        <section v-if="compare" class="viewer__pane">
          <span>React (docs)</span>
          <div class="viewer__stage"><iframe :title="`${current} in React`" :src="`${docsUrl}/frame/${frameFor(current)}`" /></div>
        </section>
      </div>
    </main>
  </div>
</template>
