<script lang="ts">
const comparisonColumns: ComparisonColumn[] = [
  { id: "relay", name: "Relay", caption: "$10 per seat", highlight: true },
  { id: "suite", name: "Legacy suite", caption: "$24 per seat" },
  { id: "sheets", name: "Spreadsheets", caption: "Free" },
  { id: "point", name: "Point tools", caption: "$16 per seat" },
];

const comparisonSections: ComparisonSection[] = [
  {
    id: "planning", title: "Planning", rows: [
      { id: "projects", feature: "Projects", values: { relay: "Unlimited", suite: "Up to 50", sheets: "Unlimited", point: "Up to 10" } },
      { id: "roadmaps", feature: "Timelines and roadmaps", values: { relay: true, suite: true, sheets: false, point: { value: "partial", note: "Timeline only" } } },
      { id: "dependencies", feature: "Dependencies", hint: "Blocked work moves when its blocker does", values: { relay: true, suite: true, sheets: false, point: false } },
      { id: "templates", feature: "Templates", values: { relay: true, suite: true, sheets: { value: "partial", note: "Manual copies" }, point: true } },
    ],
  },
  {
    id: "collaboration", title: "Collaboration", rows: [
      { id: "realtime", feature: "Real time editing", values: { relay: true, suite: false, sheets: true, point: true } },
      { id: "guests", feature: "Free guest access", values: { relay: true, suite: false, sheets: true, point: { value: "partial", note: "Five guests" } } },
      { id: "comments", feature: "Comments and mentions", values: { relay: true, suite: true, sheets: true, point: true } },
      { id: "offline", feature: "Offline mode", hint: "Edits sync when you reconnect", values: { relay: true, suite: false, sheets: { value: "partial", note: "Desktop app only" }, point: false } },
    ],
  },
  {
    id: "automation", title: "Automation", rows: [
      { id: "rules", feature: "Rules and triggers", values: { relay: true, suite: true, sheets: false, point: { value: "partial", note: "Paid add on" } } },
      { id: "ai", feature: "AI summaries", values: { relay: true, suite: false, sheets: false, point: false } },
      { id: "api", feature: "Public API", values: { relay: true, suite: true, sheets: true, point: true } },
    ],
  },
  {
    id: "security", title: "Security", rows: [
      { id: "sso", feature: "SAML single sign on", values: { relay: true, suite: true, sheets: { value: "partial", note: "Enterprise plan" }, point: false } },
      { id: "audit", feature: "Audit log", values: { relay: true, suite: true, sheets: false, point: false } },
      { id: "residency", feature: "EU data residency", values: { relay: true, suite: { value: "partial", note: "Enterprise plan" }, sheets: true, point: false } },
    ],
  },
];
</script>

<script setup lang="ts">
import { computed, ref } from "vue";
import Button from "@/registry/components/button/button.vue";
import Switch from "@/registry/components/switch/switch.vue";

export type ComparisonValue = boolean | "partial" | string | { value: boolean | "partial" | string; note?: string };
export type ComparisonColumn = { id: string; name: string; caption?: string; highlight?: boolean };
export type ComparisonRow = { id: string; feature: string; hint?: string; values: Record<string, ComparisonValue> };
export type ComparisonSection = { id: string; title: string; rows: ComparisonRow[] };

const props = withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    columns?: ComparisonColumn[];
    sections?: ComparisonSection[];
    /** Call to action under your column. */
    cta?: { label: string; doneLabel?: string };
    /** Extend the inner, named parts of the block: title, description, section, row or feature. */
    classNames?: { title?: string; description?: string; section?: string; row?: string; feature?: string };
  }>(),
  {
    title: "How Relay compares",
    description: "Everything a growing team needs, without the enterprise price or the spreadsheet sprawl.",
    columns: () => comparisonColumns,
    sections: () => comparisonSections,
  },
);
const emit = defineEmits<{ cta: [] }>();

/** `v-model` binds the "only differences" switch. */
const differencesOnly = defineModel<boolean>({ default: false });
const own = computed(() => props.columns.find((column) => column.highlight) ?? props.columns[0]);
const others = computed(() => props.columns.filter((column) => column !== own.value));
const compareWith = ref(others.value[0]?.id ?? own.value.id);
const done = ref(false);
// Narrow screens stack the table into a two column comparison, handled in CSS by hiding the other columns.
const normalize = (value: ComparisonValue | undefined) => (value === undefined ? { value: false as boolean | string } : typeof value === "object" ? value : { value });
const note = (value: ComparisonValue | undefined) => (typeof value === "object" ? value.note : undefined);
const differs = (values: Record<string, ComparisonValue>) => new Set(props.columns.map((column) => JSON.stringify(normalize(values[column.id]).value))).size > 1;
const rowsOf = (section: ComparisonSection) => (differencesOnly.value ? section.rows.filter((row) => differs(row.values)) : section.rows);
const isText = (value: ComparisonValue | undefined) => typeof normalize(value).value === "string" && normalize(value).value !== "partial";

function activate() {
  emit("cta");
  if (props.cta?.doneLabel) done.value = true;
}
</script>

<template>
  <section class="mc-compare" :style="{ '--columns': columns.length }">
    <header class="mc-compare__header">
      <div>
        <h2 :class="['mc-compare__title', classNames?.title]">{{ title }}</h2>
        <p v-if="description" :class="['mc-compare__description', classNames?.description]">{{ description }}</p>
      </div>
      <Switch v-model="differencesOnly" label="Only differences" />
    </header>
    <div v-if="others.length > 1" class="mc-compare__picker" role="group" :aria-label="`Compare ${own.name} with`">
      <button v-for="column in others" :key="column.id" type="button" class="mc-compare__pick" :aria-pressed="column.id === compareWith" @click="compareWith = column.id">{{ column.name }}</button>
    </div>
    <div class="mc-compare__table" role="table" :aria-label="title">
      <div class="mc-compare__row mc-compare__head" role="row">
        <div role="columnheader" class="mc-compare__feature"><span class="mc-compare__sr">Feature</span></div>
        <div v-for="column in columns" :key="column.id" role="columnheader" :class="['mc-compare__cell', { 'mc-compare__cell--own': column === own, 'mc-compare__cell--hidden': column !== own && column.id !== compareWith }]">
          <strong>{{ column.name }}</strong><small v-if="column.caption">{{ column.caption }}</small>
        </div>
      </div>
      <div v-for="section in sections" :key="section.id" role="rowgroup">
        <template v-if="rowsOf(section).length">
          <p :class="['mc-compare__section', classNames?.section]">{{ section.title }}</p>
          <div v-for="row in rowsOf(section)" :key="row.id" role="row" :class="['mc-compare__row', classNames?.row]">
            <div role="rowheader" class="mc-compare__feature"><span :class="classNames?.feature">{{ row.feature }}</span><small v-if="row.hint">{{ row.hint }}</small></div>
            <div v-for="column in columns" :key="column.id" role="cell" :class="['mc-compare__cell', { 'mc-compare__cell--own': column === own, 'mc-compare__cell--hidden': column !== own && column.id !== compareWith }]">
              <span v-if="isText(row.values[column.id])">{{ normalize(row.values[column.id]).value }}</span>
              <template v-else>
                <span v-if="normalize(row.values[column.id]).value === true" class="mc-compare__yes"><span aria-hidden="true">✓</span><span class="mc-compare__sr">Included</span></span>
                <span v-else-if="normalize(row.values[column.id]).value === 'partial'" class="mc-compare__partial"><span aria-hidden="true">◐</span><span class="mc-compare__sr">Partial</span></span>
                <span v-else class="mc-compare__no"><span aria-hidden="true">–</span><span class="mc-compare__sr">Not included</span></span>
                <small v-if="note(row.values[column.id])">{{ note(row.values[column.id]) }}</small>
              </template>
            </div>
          </div>
        </template>
      </div>
    </div>
    <Button v-if="cta" class="mc-compare__cta" @click="activate">{{ done ? `✓ ${cta.doneLabel}` : cta.label }}</Button>
  </section>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-compare { display: grid; gap: 20px; color: var(--foreground); }
.mc-compare__header { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 16px; }
.mc-compare__title { margin: 0; font-size: 30px; font-weight: 600; letter-spacing: -.04em; }
.mc-compare__description { margin: 6px 0 0; max-width: 52ch; color: var(--text-secondary); font-size: var(--text-sm); }
.mc-compare__picker { display: none; gap: 8px; }
.mc-compare__pick { border: 1px solid var(--border); border-radius: var(--radius-pill); padding: 6px 12px; background: none; color: inherit; font: inherit; cursor: pointer; }
.mc-compare__pick[aria-pressed="true"] { border-color: var(--foreground); background: var(--surface-muted); }
.mc-compare__row { display: grid; grid-template-columns: 1.6fr repeat(var(--columns), 1fr); align-items: center; gap: 8px; padding: 12px 0; border-top: 1px solid var(--border); font-size: var(--text-sm); }
.mc-compare__head { position: sticky; top: 0; z-index: 1; border-top: 0; background: var(--background); }
.mc-compare__cell { display: grid; justify-items: center; text-align: center; }
.mc-compare__cell small, .mc-compare__feature small { color: var(--text-muted); font-size: 11px; }
.mc-compare__cell--own { border-radius: 12px; background: var(--surface-muted); padding: 8px 4px; }
.mc-compare__feature { display: grid; }
.mc-compare__section { margin: 16px 0 0; color: var(--text-muted); font-size: 12px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; }
.mc-compare__yes { color: var(--success); font-size: 18px; }
.mc-compare__no { color: var(--text-muted); }
.mc-compare__partial { font-size: 18px; }
.mc-compare__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
@media (max-width: 640px) {
  .mc-compare__picker { display: flex; }
  .mc-compare__row { grid-template-columns: 1.6fr 1fr 1fr; }
  .mc-compare__cell--hidden { display: none; }
}
</style>
