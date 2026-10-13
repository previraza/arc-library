<script setup lang="ts">
import { computed, ref } from "vue";
import AvatarGroup from "@/registry/components/avatar-group/avatar-group.vue";
import Badge from "@/registry/components/badge/badge.vue";
import Button from "@/registry/components/button/button.vue";
import Progress from "@/registry/components/progress/progress.vue";
import SegmentedControl from "@/registry/components/segmented-control/segmented-control.vue";

type Section = "overview" | "issues" | "updates" | "files";
export type PageHeaderIssue = { id: string; title: string; owner: string; label: string };
export type PageHeaderUpdate = { id: string; author: string; date: string; tone: "success" | "warning"; status: string; body: string };
export type PageHeaderMilestone = { name: string; note: string; state: "done" | "active" | "planned" };

const members = [
  { name: "Emma Collins", src: "/media/people/emma-collins.jpg" },
  { name: "Marcus Johnson", src: "/media/people/marcus-johnson.jpg" },
  { name: "Ava Mitchell", src: "/media/people/ava-mitchell.jpg" },
  { name: "Sofia Ramirez", src: "/media/people/sofia-ramirez.jpg" },
  { name: "Jasmine Brooks", src: "/media/people/jasmine-brooks.jpg" },
];
const sections: { value: Section; label: string }[] = [{ value: "overview", label: "Overview" }, { value: "issues", label: "Issues" }, { value: "updates", label: "Updates" }, { value: "files", label: "Files" }];
const startingIssues: PageHeaderIssue[] = [
  { id: "CHK-138", title: "Saved card list clips the expiry date on small screens", owner: "Sofia Ramirez", label: "Bug" },
  { id: "CHK-136", title: "Add an edit link beside each section of the review step", owner: "Emma Collins", label: "Design" },
  { id: "CHK-135", title: "Wallet sheet opens twice after a failed card check", owner: "Marcus Johnson", label: "Bug" },
  { id: "CHK-133", title: "Show the delivery estimate before payment", owner: "Ava Mitchell", label: "Research" },
  { id: "CHK-131", title: "Promo code field loses focus after an invalid code", owner: "Sofia Ramirez", label: "Bug" },
];
const updates: PageHeaderUpdate[] = [
  { id: "u3", author: "Ava Mitchell", date: "Sep 12", tone: "success", status: "On track", body: "Five usability sessions are done. People trust a single review step as long as the total stays visible while they edit." },
  { id: "u2", author: "Marcus Johnson", date: "Sep 5", tone: "warning", status: "At risk", body: "Card tokenization is waiting on the payments team. We moved the review step ahead so the October date can hold." },
  { id: "u1", author: "Emma Collins", date: "Aug 29", tone: "success", status: "On track", body: "Kickoff. Scope is saved cards, one review step, and a staged rollout starting October 14." },
];
const files = [
  { name: "Checkout flows v3", kind: "Design file", size: "18.4 MB", date: "Sep 20" },
  { name: "Payments API notes", kind: "Document", size: "96 KB", date: "Sep 16" },
  { name: "Rollout plan", kind: "Slides", size: "4.8 MB", date: "Sep 11" },
  { name: "Launch checklist", kind: "Document", size: "54 KB", date: "Sep 2" },
];
const milestones: PageHeaderMilestone[] = [
  { name: "Saved payment methods", note: "Shipped Sep 18", state: "done" },
  { name: "Single review step", note: "In progress, due Oct 1", state: "active" },
  { name: "Staged rollout", note: "Planned for Oct 14", state: "planned" },
];
const DONE_AT_START = 31;

withDefaults(
  defineProps<{
    title?: string;
    breadcrumbs?: string[];
    /** Extend the inner, named parts of the block: title, tabs or row. */
    classNames?: { title?: string; tabs?: string; row?: string };
  }>(),
  { title: "Checkout redesign", breadcrumbs: () => ["Projects", "Northline"] },
);
/** Fires when the Share button is clicked. */
const emit = defineEmits<{ share: [] }>();

const section = ref<Section>("overview");
const issues = ref(startingIssues);
const done = ref(DONE_AT_START);
const tabs = computed(() => sections.map((item) => ({ value: item.value, label: item.value === "issues" ? `Issues ${issues.value.length}` : item.label })));
const toneIcon = { done: "●", active: "◐", planned: "○" };

function complete(id: string) {
  issues.value = issues.value.filter((issue) => issue.id !== id);
  done.value += 1;
}
function reset() {
  issues.value = startingIssues;
  done.value = DONE_AT_START;
}
</script>

<template>
  <header class="mc-pageheader">
    <p class="mc-pageheader__crumbs">{{ breadcrumbs.join(" / ") }}</p>
    <div class="mc-pageheader__row">
      <h1 :class="['mc-pageheader__title', classNames?.title]">{{ title }}</h1>
      <Badge tone="success" size="sm">On track</Badge>
      <span class="mc-pageheader__spacer" />
      <AvatarGroup :members="members" :max="4" size="sm" />
      <Button variant="secondary" size="sm" @click="emit('share')">Share</Button>
    </div>
    <SegmentedControl v-model="section" label="Project sections" :options="tabs" :class-names="{ track: classNames?.tabs }" />

    <div v-if="section === 'overview'" class="mc-pageheader__panel">
      <Progress :value="done" :max="done + issues.length" :label="`${done} of ${done + issues.length} issues done`" show-value />
      <h2>Milestones</h2>
      <ol class="mc-pageheader__list">
        <li v-for="item in milestones" :key="item.name" :data-state="item.state"><span aria-hidden="true">{{ toneIcon[item.state] }}</span><span>{{ item.name }}</span><small>{{ item.note }}</small></li>
      </ol>
    </div>
    <div v-else-if="section === 'issues'" class="mc-pageheader__panel">
      <p v-if="!issues.length">Nothing left to do.</p>
      <ul class="mc-pageheader__list">
        <li v-for="issue in issues" :key="issue.id" :class="classNames?.row">
          <button type="button" class="mc-pageheader__check" :aria-label="`Mark ${issue.id} done`" @click="complete(issue.id)">○</button>
          <span><small>{{ issue.id }} · {{ issue.label }} · {{ issue.owner }}</small>{{ issue.title }}</span>
        </li>
      </ul>
      <Button variant="ghost" size="sm" @click="reset">Reset</Button>
    </div>
    <div v-else-if="section === 'updates'" class="mc-pageheader__panel">
      <article v-for="update in updates" :key="update.id">
        <small>{{ update.author }} · {{ update.date }} · <b :data-tone="update.tone">{{ update.status }}</b></small>
        <p>{{ update.body }}</p>
      </article>
    </div>
    <ul v-else class="mc-pageheader__panel mc-pageheader__list">
      <li v-for="file in files" :key="file.name"><span>{{ file.name }}<small>{{ file.kind }} · {{ file.size }}</small></span><small>{{ file.date }}</small></li>
    </ul>
  </header>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-pageheader { display: grid; gap: 14px; color: var(--foreground); }
.mc-pageheader__crumbs { margin: 0; color: var(--text-muted); font-size: var(--text-xs); }
.mc-pageheader__row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.mc-pageheader__spacer { flex: 1; }
.mc-pageheader__title { margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -.04em; }
.mc-pageheader__panel { display: grid; gap: 12px; margin: 0; padding: 0; }
.mc-pageheader__panel h2 { margin: 0; font-size: 15px; }
.mc-pageheader__panel p { margin: 0; color: var(--text-secondary); font-size: var(--text-sm); }
.mc-pageheader__list { margin: 0; padding: 0; list-style: none; display: grid; }
.mc-pageheader__list li { display: flex; align-items: center; justify-content: space-between; gap: 10px; border-bottom: 1px solid var(--border); padding: 10px 0; font-size: var(--text-sm); }
.mc-pageheader__list li[data-state="done"] > span:first-child { color: var(--success); }
.mc-pageheader__list small, .mc-pageheader__panel small { display: block; color: var(--text-muted); font-size: 11px; }
.mc-pageheader__check { border: 0; background: none; color: var(--text-muted); font-size: 20px; cursor: pointer; }
.mc-pageheader__panel b[data-tone="success"] { color: var(--success); }
.mc-pageheader__panel b[data-tone="warning"] { color: var(--warning); }
</style>
