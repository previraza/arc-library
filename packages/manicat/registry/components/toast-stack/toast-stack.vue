<script lang="ts">
import { reactive } from "vue";

export type ToastType = "success" | "info" | "warning" | "error" | "loading";

export interface ToastAction {
  label: string;
  onClick: (id: string) => void;
}

export interface ToastOptions {
  id?: string;
  type?: ToastType;
  title: string;
  description?: string;
  action?: ToastAction;
  /** Milliseconds before it leaves. Pass 0 to keep it until dismissed. */
  duration?: number;
}

interface Entry extends ToastOptions {
  id: string;
}

// One queue for the whole app: call `toast()` from anywhere and render a single <ToastStack /> at the root.
const state = reactive<{ toasts: Entry[]; counter: number }>({ toasts: [], counter: 0 });

export function toast(options: ToastOptions): string {
  const id = options.id ?? `toast-${(state.counter += 1)}`;
  state.toasts = [{ duration: 5000, type: "info" as ToastType, ...options, id }, ...state.toasts.filter((entry) => entry.id !== id)].slice(0, 12);
  return id;
}

export function updateToast(id: string, patch: Partial<Omit<ToastOptions, "id">>) {
  state.toasts = state.toasts.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry));
}

export function dismissToast(id?: string) {
  state.toasts = id ? state.toasts.filter((entry) => entry.id !== id) : [];
}
</script>

<script setup lang="ts">
import { onBeforeUnmount, watch } from "vue";

const props = withDefaults(
  defineProps<{
    label?: string;
    position?: "bottom-right" | "bottom-center" | "bottom-left";
    /** How many toasts show at once; the rest wait their turn. */
    visibleToasts?: number;
    /** Extend the inner, named parts of the stack: toast, title, description or action. */
    classNames?: { toast?: string; title?: string; description?: string; action?: string };
  }>(),
  { label: "Notifications", position: "bottom-right", visibleToasts: 3 },
);

const timers = new Map<string, ReturnType<typeof setTimeout>>();

// Each toast gets one timer, set when it first appears and cleared when it goes.
watch(
  () => state.toasts.map((entry) => `${entry.id}:${entry.type}:${entry.duration}`).join("|"),
  () => {
    for (const entry of state.toasts) {
      clearTimeout(timers.get(entry.id));
      if (entry.duration && entry.type !== "loading") timers.set(entry.id, setTimeout(() => dismissToast(entry.id), entry.duration));
    }
  },
  { immediate: true },
);
onBeforeUnmount(() => timers.forEach((timer) => clearTimeout(timer)));
</script>

<template>
  <section :class="['mc-toasts', `mc-toasts--${position}`]" :aria-label="label" aria-live="polite">
    <TransitionGroup name="mc-toasts" tag="div" class="mc-toasts__list">
      <div v-for="entry in state.toasts.slice(0, props.visibleToasts)" :key="entry.id" role="status" :data-type="entry.type" :class="['mc-toasts__toast', classNames?.toast]">
        <span class="mc-toasts__icon" aria-hidden="true" />
        <div class="mc-toasts__copy">
          <span :class="['mc-toasts__title', classNames?.title]">{{ entry.title }}</span>
          <span v-if="entry.description" :class="['mc-toasts__description', classNames?.description]">{{ entry.description }}</span>
        </div>
        <button v-if="entry.action" type="button" :class="['mc-toasts__action', classNames?.action]" @click="entry.action.onClick(entry.id)">{{ entry.action.label }}</button>
        <button type="button" class="mc-toasts__close" aria-label="Dismiss" @click="dismissToast(entry.id)">
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" /></svg>
        </button>
      </div>
    </TransitionGroup>
  </section>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-toasts { position: fixed; z-index: 100; bottom: var(--space-6); width: min(calc(100vw - var(--space-8)), 24rem); pointer-events: none; }
.mc-toasts--bottom-right { right: var(--space-6); } .mc-toasts--bottom-left { left: var(--space-6); } .mc-toasts--bottom-center { left: 50%; transform: translateX(-50%); }
.mc-toasts__list { display: grid; gap: var(--space-2); }
.mc-toasts__toast { --mc-tone: var(--accent); display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-control); background: var(--surface-raised); box-shadow: var(--shadow-floating); pointer-events: auto; }
.mc-toasts__toast[data-type="success"] { --mc-tone: var(--success); } .mc-toasts__toast[data-type="error"] { --mc-tone: var(--danger); } .mc-toasts__toast[data-type="warning"] { --mc-tone: var(--warning); } .mc-toasts__toast[data-type="loading"] { --mc-tone: var(--text-muted); }
.mc-toasts__icon { flex: 0 0 auto; width: 8px; height: 8px; border-radius: 50%; background: var(--mc-tone); }
.mc-toasts__toast[data-type="loading"] .mc-toasts__icon { width: 14px; height: 14px; border: 1.5px solid var(--mc-tone); border-right-color: transparent; background: transparent; animation: mc-toasts-spin .7s linear infinite; }
.mc-toasts__copy { display: grid; flex: 1; gap: 2px; min-width: 0; }
.mc-toasts__title { font-size: var(--text-sm); font-weight: 500; }
.mc-toasts__description { color: var(--text-secondary); font-size: var(--text-xs); }
.mc-toasts__action { padding: 0; border: 0; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-xs); font-weight: 600; cursor: pointer; }
.mc-toasts__close { display: grid; place-items: center; width: 24px; height: 24px; border: 0; border-radius: var(--radius-pill); background: transparent; color: var(--text-muted); cursor: pointer; }
.mc-toasts-enter-active { transition: opacity .28s var(--ease-enter), transform .28s var(--ease-enter); } .mc-toasts-leave-active { transition: opacity .16s var(--ease-standard), transform .16s var(--ease-standard); position: absolute; width: 100%; } .mc-toasts-move { transition: transform .28s var(--ease-standard); }
.mc-toasts-enter-from, .mc-toasts-leave-to { opacity: 0; transform: translateY(12px) scale(.98); }
@keyframes mc-toasts-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .mc-toasts-enter-active, .mc-toasts-leave-active, .mc-toasts-move { transition: opacity .12s linear; } .mc-toasts-enter-from, .mc-toasts-leave-to { transform: none; } .mc-toasts__toast[data-type="loading"] .mc-toasts__icon { animation-duration: .01ms; animation-iteration-count: 1; } }
</style>
