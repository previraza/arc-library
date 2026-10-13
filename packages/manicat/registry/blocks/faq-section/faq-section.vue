<script lang="ts">
const exampleItems: FaqItem[] = [
  { question: "What is Manicat UI?", answer: "Manicat UI is a library of React components and blocks built on Motion and Radix. You copy the source into your project, so every line is yours to change.", category: "General" },
  { question: "Does it work with my design system?", answer: "Yes. Components read semantic tokens such as surface, border, and accent, so mapping them to your palette takes one stylesheet.", category: "General" },
  { question: "Is reduced motion supported?", answer: "Every animation has a reduced motion branch. It keeps the final state, focus, and feedback while removing travel and looping.", category: "General" },
  { question: "Which frameworks are supported?", answer: "Manicat UI targets React 19 and Next.js 16. The components are client components and also run in Vite and React Router apps.", category: "Technical" },
  { question: "How do I install a component?", answer: "Run the shadcn CLI with the component name, or copy the files by hand. Each page lists the packages it needs.", category: "Technical" },
  { question: "How do updates work?", answer: "New components and fixes ship in small releases. Run the CLI again to pull the latest version of anything you installed.", category: "Technical" },
  { question: "Can I use Manicat UI in client projects?", answer: "Yes. Free components are MIT licensed, and a Pro license covers commercial work for you or your team.", category: "Licensing" },
  { question: "What happens when my plan ends?", answer: "You keep every component you installed. Renewing only matters for new releases and updates.", category: "Licensing" },
];
</script>

<script setup lang="ts">
import { computed, ref } from "vue";
import SearchField from "@/registry/components/search-field/search-field.vue";
import SegmentedControl from "@/registry/components/segmented-control/segmented-control.vue";

export type FaqSectionVariant = "accordion" | "columns" | "search";
export interface FaqItem {
  id?: string;
  question: string;
  /** Plain text answer; it is also what search matches. */
  answer: string;
  category?: string;
}

const props = withDefaults(
  defineProps<{
    variant?: FaqSectionVariant;
    title?: string;
    description?: string;
    items?: FaqItem[];
    multiple?: boolean;
    /** A way to reach a person when the answer isn't here. Pass null to hide it. */
    contact?: { label: string; description?: string } | null;
    /** Extend the inner, named parts of the block: title, description, item, question or answer. */
    classNames?: { title?: string; description?: string; item?: string; question?: string; answer?: string };
  }>(),
  {
    variant: "accordion",
    title: "Frequently asked questions",
    description: "Everything you need to know before you install your first component.",
    items: () => exampleItems,
    contact: () => ({ label: "Still have a question?", description: "Our team replies within a day." }),
  },
);
const emit = defineEmits<{ contact: []; change: [open: string[]] }>();

const keyOf = (item: FaqItem) => item.id ?? item.question;
const normalize = (text: string) => text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const current = ref<string[]>(props.items[0] ? [keyOf(props.items[0])] : []);
const categories = computed(() => Array.from(new Set(props.items.map((item) => item.category ?? "General"))));
const category = ref(categories.value[0] ?? "General");
const query = ref("");
const needle = computed(() => normalize(query.value.trim()));

const shown = computed(() => {
  if (props.variant === "columns") return props.items.filter((item) => (item.category ?? "General") === category.value);
  if (props.variant === "search" && needle.value) return props.items.filter((item) => normalize(`${item.question} ${item.answer}`).includes(needle.value));
  return props.items;
});

function toggle(key: string) {
  const next = current.value.includes(key) ? current.value.filter((entry) => entry !== key) : props.multiple ? [...current.value, key] : [key];
  current.value = next;
  emit("change", next);
}
const slug = (text: string) => text.replace(/[^a-zA-Z0-9_-]/g, "");
</script>

<template>
  <section class="mc-faq">
    <h2 :class="['mc-faq__title', classNames?.title]">{{ title }}</h2>
    <p v-if="description" :class="['mc-faq__description', classNames?.description]">{{ description }}</p>
    <SegmentedControl v-if="variant === 'columns'" v-model="category" label="Question topics" :options="categories.map((entry) => ({ value: entry, label: entry }))" />
    <template v-if="variant === 'search'">
      <SearchField v-model="query" label="Search questions" placeholder="Try install, license, or motion" />
      <p class="mc-faq__count" aria-live="polite">{{ needle ? `${shown.length} ${shown.length === 1 ? "answer" : "answers"}` : `${items.length} questions` }}</p>
    </template>
    <ul class="mc-faq__list">
      <li v-for="item in shown" :key="keyOf(item)" :class="['mc-faq__item', classNames?.item]" :data-open="current.includes(keyOf(item)) || undefined">
        <h3 class="mc-faq__heading">
          <button type="button" :id="`${slug(keyOf(item))}-q`" :class="['mc-faq__trigger', classNames?.question]" :aria-expanded="current.includes(keyOf(item))" :aria-controls="`${slug(keyOf(item))}-a`" @click="toggle(keyOf(item))">
            <span>{{ item.question }}</span><span class="mc-faq__icon" aria-hidden="true">+</span>
          </button>
        </h3>
        <div :id="`${slug(keyOf(item))}-a`" class="mc-faq__panel" role="region" :aria-labelledby="`${slug(keyOf(item))}-q`">
          <p :class="['mc-faq__answer', classNames?.answer]">{{ item.answer }}</p>
        </div>
      </li>
    </ul>
    <div v-if="variant === 'search' && needle && !shown.length" class="mc-faq__empty">
      <p>No answers mention “{{ query.trim() }}”.</p>
      <button type="button" class="mc-faq__clear" @click="query = ''">Clear search</button>
    </div>
    <button v-if="contact" type="button" class="mc-faq__contact" @click="emit('contact')">
      <span><strong>{{ contact.label }}</strong><small v-if="contact.description">{{ contact.description }}</small></span><span aria-hidden="true">→</span>
    </button>
  </section>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-faq { display: grid; gap: 16px; max-width: 720px; color: var(--foreground); }
.mc-faq__title { margin: 0; font-size: 30px; font-weight: 600; letter-spacing: -.04em; }
.mc-faq__description { margin: 0; color: var(--text-secondary); }
.mc-faq__count { margin: 0; color: var(--text-muted); font-size: var(--text-xs); }
.mc-faq__list { margin: 0; padding: 0; list-style: none; border-top: 1px solid var(--border); }
.mc-faq__item { border-bottom: 1px solid var(--border); }
.mc-faq__heading { margin: 0; }
.mc-faq__trigger { display: flex; width: 100%; align-items: center; justify-content: space-between; gap: 12px; border: 0; padding: 18px 0; background: none; color: inherit; font: inherit; font-weight: 500; text-align: start; cursor: pointer; }
.mc-faq__icon { color: var(--text-muted); transition: transform var(--duration-standard) var(--ease-standard); }
.mc-faq__item[data-open] .mc-faq__icon { transform: rotate(45deg); }
.mc-faq__panel { display: grid; grid-template-rows: 0fr; transition: grid-template-rows var(--duration-standard) var(--ease-standard); }
.mc-faq__item[data-open] .mc-faq__panel { grid-template-rows: 1fr; }
.mc-faq__answer { overflow: hidden; margin: 0; color: var(--text-secondary); font-size: var(--text-sm); line-height: 1.6; }
.mc-faq__item[data-open] .mc-faq__answer { padding-bottom: 18px; }
.mc-faq__empty { display: grid; justify-items: center; gap: 6px; color: var(--text-secondary); }
.mc-faq__clear { border: 0; background: none; color: var(--foreground); font: inherit; font-weight: 500; cursor: pointer; }
.mc-faq__contact { display: flex; align-items: center; justify-content: space-between; border: 1px solid var(--border); border-radius: 20px; padding: 14px 16px; background: var(--surface-muted); color: inherit; font: inherit; text-align: start; cursor: pointer; }
.mc-faq__contact span:first-child { display: grid; }
.mc-faq__contact small { color: var(--text-secondary); }
@media (prefers-reduced-motion: reduce) { .mc-faq__panel, .mc-faq__icon { transition-duration: var(--duration-instant); } }
</style>
