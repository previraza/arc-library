<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

export interface AnnouncementAction {
  label: string;
  href?: string;
}

export interface Announcement {
  id: string;
  message: string;
  action?: AnnouncementAction;
}

const props = withDefaults(
  defineProps<{
    messages: Announcement[];
    /** Milliseconds each message stays before the next one. */
    interval?: number;
    autoPlay?: boolean;
    /** Extend the inner, named parts of the bar: message, action or dismiss. */
    classNames?: { bar?: string; message?: string; action?: string; dismiss?: string };
  }>(),
  { interval: 6000, autoPlay: true },
);

/** `v-model:open` binds visibility; the bar closes itself when dismissed. */
const open = defineModel<boolean>("open", { default: true });
const emit = defineEmits<{ action: [id: string] }>();
const index = ref(0);
const current = computed(() => props.messages[index.value % Math.max(1, props.messages.length)]);
let timer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  if (props.autoPlay && props.messages.length > 1) timer = setInterval(() => (index.value = (index.value + 1) % props.messages.length), props.interval);
});
onBeforeUnmount(() => clearInterval(timer));
</script>

<template>
  <div v-if="open && current" role="region" aria-label="Announcement" :class="['mc-announce', classNames?.bar]">
    <Transition name="mc-announce" mode="out-in">
      <p :key="current.id" class="mc-announce__copy">
        <span :class="['mc-announce__message', classNames?.message]">{{ current.message }}</span>
        <a v-if="current.action?.href" :href="current.action.href" :class="['mc-announce__action', classNames?.action]">{{ current.action.label }}</a>
        <button v-else-if="current.action" type="button" :class="['mc-announce__action', classNames?.action]" @click="emit('action', current.id)">{{ current.action.label }}</button>
      </p>
    </Transition>
    <button type="button" :class="['mc-announce__dismiss', classNames?.dismiss]" aria-label="Dismiss announcement" @click="open = false">
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" /></svg>
    </button>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-announce { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); padding: var(--space-3) var(--space-4); background: var(--foreground); color: var(--background); font-size: var(--text-sm); }
.mc-announce__copy { display: flex; flex: 1; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--space-2); margin: 0; text-align: center; }
.mc-announce__action { padding: 0; border: 0; background: transparent; color: inherit; font: inherit; font-weight: 600; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.mc-announce__dismiss { display: grid; place-items: center; width: 28px; height: 28px; border: 0; border-radius: var(--radius-pill); background: transparent; color: inherit; cursor: pointer; opacity: .8; }
@media (hover: hover) and (pointer: fine) { .mc-announce__dismiss:hover { opacity: 1; background: color-mix(in oklab, var(--background) 16%, transparent); } }
.mc-announce-enter-active { transition: opacity .3s var(--ease-enter), transform .3s var(--ease-enter); }
.mc-announce-leave-active { transition: opacity .16s var(--ease-standard), transform .16s var(--ease-standard); }
.mc-announce-enter-from { opacity: 0; transform: translateY(.5em); } .mc-announce-leave-to { opacity: 0; transform: translateY(-.5em); }
@media (prefers-reduced-motion: reduce) { .mc-announce-enter-active, .mc-announce-leave-active { transition: opacity .12s linear; } .mc-announce-enter-from, .mc-announce-leave-to { transform: none; } }
</style>
