<script setup lang="ts">
import { computed, ref } from "vue";
import Button from "@/registry/components/button/button.vue";

export interface CtaAction {
  label: string;
  /** Renders a link. */
  href?: string;
  /** With no href, the button confirms in place with this label, which suits previews. */
  confirmedLabel?: string;
}
export type CtaVariant = "centered" | "split" | "banner";

const copy: Record<CtaVariant, { title: string; description: string; primary: CtaAction; secondary?: CtaAction; note: string; points: string[] }> = {
  centered: { title: "Start building in minutes", description: "Set up a workspace, invite your team, and ship the first project this week. Free for 14 days.", primary: { label: "Start free trial", confirmedLabel: "Trial started" }, secondary: { label: "Talk to sales", confirmedLabel: "We'll email you" }, note: "No credit card required", points: [] },
  split: { title: "Your team, set up before lunch", description: "Import your projects, bring everyone in, and keep working the way you already do.", primary: { label: "Create a workspace", confirmedLabel: "Workspace created" }, secondary: { label: "Book a demo", confirmedLabel: "Demo requested" }, note: "", points: ["Import from any tracker in one step", "Single sign-on and audit logs included", "Cancel anytime from settings"] },
  banner: { title: "Workflows are here", description: "Automate handoffs between teams with no code.", primary: { label: "See how it works", confirmedLabel: "Opened" }, note: "", points: [] },
};

const props = withDefaults(
  defineProps<{
    variant?: CtaVariant;
    title?: string;
    description?: string;
    primaryAction?: CtaAction;
    /** Not shown in the banner variant. Pass null to hide it. */
    secondaryAction?: CtaAction | null;
    note?: string;
    /** Image URLs for the faces beside the note in the centered variant. */
    faces?: string[];
    points?: string[];
    /** Banner only: shows a dismiss button. */
    dismissible?: boolean;
    /** Extend the inner, named parts of the block: title, description, actions or note. */
    classNames?: { title?: string; description?: string; actions?: string; note?: string };
  }>(),
  { variant: "centered", faces: () => [] },
);
const emit = defineEmits<{ dismiss: [] }>();

const text = computed(() => copy[props.variant]);
const primary = computed(() => props.primaryAction ?? text.value.primary);
const secondary = computed(() => (props.secondaryAction === null ? null : props.secondaryAction ?? text.value.secondary));
const list = computed(() => props.points ?? text.value.points);
const open = ref(true);
const confirmed = ref<Record<string, boolean>>({});

function press(key: string) {
  confirmed.value = { ...confirmed.value, [key]: !confirmed.value[key] };
}
function dismiss() {
  open.value = false;
  emit("dismiss");
}
</script>

<template>
  <section v-if="variant !== 'banner' || open" :class="['mc-cta', `mc-cta--${variant}`]">
    <div v-if="variant === 'banner'" class="mc-cta__banner">
      <p class="mc-cta__bannerText"><strong>{{ title ?? text.title }}</strong> <span>{{ description ?? text.description }}</span></p>
      <a v-if="primary.href" :href="primary.href" class="mc-cta__link">{{ primary.label }}</a>
      <Button v-else size="sm" @click="press('primary')">{{ confirmed.primary ? `✓ ${primary.confirmedLabel ?? primary.label}` : primary.label }}</Button>
      <button v-if="dismissible" type="button" class="mc-cta__dismiss" aria-label="Dismiss" @click="dismiss">✕</button>
    </div>
    <div v-else class="mc-cta__body">
      <div class="mc-cta__copy">
        <h2 :class="['mc-cta__title', classNames?.title]">{{ title ?? text.title }}</h2>
        <p :class="['mc-cta__description', classNames?.description]">{{ description ?? text.description }}</p>
        <ul v-if="variant === 'split' && list.length" class="mc-cta__points"><li v-for="point in list" :key="point">✓ {{ point }}</li></ul>
        <div :class="['mc-cta__actions', classNames?.actions]">
          <a v-if="primary.href" :href="primary.href" class="mc-cta__link">{{ primary.label }}</a>
          <Button v-else size="lg" @click="press('primary')">{{ confirmed.primary ? `✓ ${primary.confirmedLabel ?? primary.label}` : primary.label }}</Button>
          <template v-if="secondary">
            <a v-if="secondary.href" :href="secondary.href" class="mc-cta__link mc-cta__link--secondary">{{ secondary.label }}</a>
            <Button v-else variant="secondary" size="lg" @click="press('secondary')">{{ confirmed.secondary ? `✓ ${secondary.confirmedLabel ?? secondary.label}` : secondary.label }}</Button>
          </template>
        </div>
        <p v-if="variant === 'centered'" :class="['mc-cta__note', classNames?.note]">
          <span class="mc-cta__faces" aria-hidden="true"><img v-for="src in faces.slice(0, 4)" :key="src" :src="src" alt="" width="26" height="26" /></span>
          {{ note ?? text.note }}
        </p>
      </div>
      <div v-if="variant === 'split'" class="mc-cta__stage"><slot name="visual" /></div>
    </div>
  </section>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-cta { color: var(--foreground); }
.mc-cta__body { display: grid; gap: 32px; }
.mc-cta--split .mc-cta__body { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); align-items: center; }
.mc-cta--centered .mc-cta__copy { display: grid; justify-items: center; text-align: center; }
.mc-cta__copy { display: grid; gap: 14px; }
.mc-cta__title { margin: 0; font-size: 34px; font-weight: 600; letter-spacing: -.04em; }
.mc-cta__description { margin: 0; max-width: 48ch; color: var(--text-secondary); }
.mc-cta__points { margin: 0; padding: 0; list-style: none; display: grid; gap: 6px; font-size: var(--text-sm); }
.mc-cta__actions { display: flex; flex-wrap: wrap; gap: 10px; }
.mc-cta__link { display: inline-flex; align-items: center; min-height: 50px; padding: 0 22px; border-radius: var(--radius-pill); background: var(--foreground); color: var(--background); font-weight: 500; text-decoration: none; }
.mc-cta__link--secondary { border: 1px solid var(--border); background: var(--surface); color: var(--foreground); }
.mc-cta__note { display: flex; align-items: center; gap: 8px; margin: 0; color: var(--text-muted); font-size: var(--text-sm); }
.mc-cta__faces { display: inline-flex; }
.mc-cta__faces img { width: 26px; height: 26px; margin-inline-start: -6px; border: 2px solid var(--background); border-radius: 50%; }
.mc-cta__faces img:first-child { margin-inline-start: 0; }
.mc-cta__banner { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; border: 1px solid var(--border); border-radius: 20px; padding: 10px 14px; background: var(--surface-muted); }
.mc-cta__bannerText { flex: 1; margin: 0; min-width: 200px; color: var(--text-secondary); font-size: var(--text-sm); }
.mc-cta__bannerText strong { color: var(--foreground); }
.mc-cta__dismiss { border: 0; background: none; color: var(--text-muted); cursor: pointer; }
</style>
