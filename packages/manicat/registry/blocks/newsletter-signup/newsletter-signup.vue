<script setup lang="ts">
import { computed, ref } from "vue";
import Button from "@/registry/components/button/button.vue";
import Input from "@/registry/components/input/input.vue";

export type NewsletterVariant = "inline" | "card";

const copy = {
  inline: { title: "Five minutes on interface craft, every Friday", description: "Three links worth your time and one short essay on the details that make software feel right." },
  card: { title: "Get the next issue on Friday", description: "Three links and one short essay on interface craft. Five minutes, once a week." },
};
const messages = { empty: "Enter your email address", format: "Enter an email like name@company.com", failed: "That didn't go through. Your email is kept, so try again." };

const props = withDefaults(
  defineProps<{
    variant?: NewsletterVariant;
    title?: string;
    description?: string;
    placeholder?: string;
    buttonLabel?: string;
    privacyNote?: string;
    privacyLink?: { label: string; href: string } | null;
    /** Social proof beside the form: a reader count and image URLs for the faces. */
    readers?: { count: number; faces: string[] } | null;
    /** Receives the address once it is valid. Reject to show the failure message and keep the email. */
    onSubscribe?: (email: string) => void | Promise<void>;
    /** Extend the inner, named parts of the block: title, description, form or note. */
    classNames?: { title?: string; description?: string; form?: string; note?: string };
  }>(),
  { variant: "inline", placeholder: "you@company.com", buttonLabel: "Subscribe", privacyNote: "No tracking pixels. Unsubscribe with one click.", privacyLink: () => ({ label: "Privacy policy", href: "#privacy" }), readers: null },
);

const email = ref("");
const error = ref("");
const busy = ref(false);
const done = ref(false);
const text = computed(() => copy[props.variant]);

async function submit() {
  if (busy.value) return;
  const value = email.value.trim();
  if (!value) return void (error.value = messages.empty);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return void (error.value = messages.format);
  error.value = "";
  busy.value = true;
  try {
    await props.onSubscribe?.(value);
    done.value = true;
  } catch {
    error.value = messages.failed;
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <section :class="['mc-news', `mc-news--${variant}`]" :aria-label="title ?? text.title">
    <h2 :class="['mc-news__title', classNames?.title]">{{ title ?? text.title }}</h2>
    <p :class="['mc-news__description', classNames?.description]">{{ description ?? text.description }}</p>
    <p v-if="done" class="mc-news__done" role="status">✓ Check your inbox to confirm.</p>
    <form v-else :class="['mc-news__form', classNames?.form]" novalidate @submit.prevent="submit">
      <Input v-model="email" label="Email" type="email" inputmode="email" autocomplete="email" :placeholder="placeholder" :error="error" @input="error = ''" />
      <Button type="submit" :loading="busy">{{ buttonLabel }}</Button>
    </form>
    <p v-if="readers" class="mc-news__readers">
      <span class="mc-news__faces" aria-hidden="true"><img v-for="src in readers.faces.slice(0, 4)" :key="src" :src="src" alt="" width="24" height="24" /></span>
      {{ readers.count.toLocaleString("en-US") }} readers
    </p>
    <p :class="['mc-news__note', classNames?.note]">{{ privacyNote }} <a v-if="privacyLink" :href="privacyLink.href">{{ privacyLink.label }}</a></p>
  </section>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-news { display: grid; gap: 14px; max-width: 520px; color: var(--foreground); }
.mc-news--card { border: 1px solid var(--border); border-radius: 28px; padding: 24px; background: var(--surface); }
.mc-news__title { margin: 0; font-size: 26px; font-weight: 600; letter-spacing: -.04em; }
.mc-news__description { margin: 0; color: var(--text-secondary); font-size: var(--text-sm); }
.mc-news__form { display: grid; gap: 12px; }
.mc-news--inline .mc-news__form { grid-template-columns: 1fr auto; align-items: end; }
.mc-news__done { margin: 0; color: var(--success); font-weight: 500; }
.mc-news__readers { display: flex; align-items: center; gap: 8px; margin: 0; color: var(--text-secondary); font-size: var(--text-xs); }
.mc-news__faces img { width: 24px; height: 24px; margin-inline-start: -6px; border: 2px solid var(--background); border-radius: 50%; }
.mc-news__faces img:first-child { margin-inline-start: 0; }
.mc-news__note { margin: 0; color: var(--text-muted); font-size: var(--text-xs); }
.mc-news__note a { color: inherit; }
@media (max-width: 480px) { .mc-news--inline .mc-news__form { grid-template-columns: 1fr; } }
</style>
