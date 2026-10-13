<script lang="ts">
export type UserStatus = "available" | "busy" | "away";

export const userStatuses: { value: UserStatus; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "busy", label: "Busy" },
  { value: "away", label: "Away" },
];

export interface UserMenuUser {
  name: string;
  email: string;
  plan?: string;
  avatarSrc?: string;
}

export interface UserMenuItem {
  label: string;
  onSelect?: () => void;
}
</script>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useId } from "vue";
import Avatar from "@/registry/components/avatar/avatar.vue";

const props = withDefaults(
  defineProps<{
    user: UserMenuUser;
    items?: UserMenuItem[];
    /** Shows the inline status switch. */
    showStatus?: boolean;
    /** Shows the sign out entry; it emits `signOut`. */
    signOut?: boolean;
    /** Extend the inner, named parts of the menu: trigger, content, header, item or status. */
    classNames?: { trigger?: string; content?: string; header?: string; item?: string; status?: string };
  }>(),
  { items: () => [], showStatus: false, signOut: true },
);

const emit = defineEmits<{ signOut: [] }>();
/** `v-model:status` binds the presence status. */
const status = defineModel<UserStatus>("status", { default: "available" });
const id = useId();
const root = ref<HTMLElement>();
const open = ref(false);
const active = ref(-1);

const count = () => props.items.length + (props.signOut ? 1 : 0);

function focusItem(index: number) {
  active.value = index;
  nextTick(() => document.getElementById(`${id}-item-${index}`)?.focus());
}

function show() {
  open.value = true;
  focusItem(0);
}

function hide(refocus = false) {
  open.value = false;
  active.value = -1;
  if (refocus) root.value?.querySelector<HTMLElement>("[aria-haspopup]")?.focus();
}

function choose(index: number) {
  hide(true);
  if (index < props.items.length) props.items[index].onSelect?.();
  else emit("signOut");
}

function onMenuKeydown(event: KeyboardEvent) {
  const total = count();
  if (event.key === "ArrowDown") focusItem((active.value + 1) % total);
  else if (event.key === "ArrowUp") focusItem((active.value - 1 + total) % total);
  else if (event.key === "Escape") hide(true);
  else if (event.key === "Tab") hide();
  else return;
  event.preventDefault();
}

function onOutside(event: PointerEvent) {
  if (open.value && root.value && !root.value.contains(event.target as Node)) hide();
}

onMounted(() => document.addEventListener("pointerdown", onOutside));
onBeforeUnmount(() => document.removeEventListener("pointerdown", onOutside));
</script>

<template>
  <div ref="root" class="mc-user">
    <button type="button" :class="['mc-user__trigger', classNames?.trigger]" aria-haspopup="menu" :aria-expanded="open" :aria-label="`${user.name} account menu`" @click="open ? hide() : show()" @keydown.down.prevent="show()">
      <Avatar :name="user.name" :src="user.avatarSrc" :status="showStatus ? (status === 'available' ? 'online' : 'offline') : undefined" />
    </button>
    <div v-if="open" role="menu" :aria-label="`${user.name} account menu`" :class="['mc-user__content', classNames?.content]" @keydown="onMenuKeydown">
      <div :class="['mc-user__header', classNames?.header]">
        <Avatar :name="user.name" :src="user.avatarSrc" />
        <span class="mc-user__who"><strong>{{ user.name }}</strong><span>{{ user.email }}</span></span>
        <span v-if="user.plan" class="mc-user__plan">{{ user.plan }}</span>
      </div>
      <div v-if="showStatus" role="radiogroup" aria-label="Status" :class="['mc-user__status', classNames?.status]">
        <button v-for="entry in userStatuses" :key="entry.value" type="button" role="radio" :aria-checked="status === entry.value" @click="status = entry.value">{{ entry.label }}</button>
      </div>
      <button
        v-for="(item, index) in items"
        :id="`${id}-item-${index}`"
        :key="item.label"
        type="button"
        role="menuitem"
        :tabindex="active === index ? 0 : -1"
        :class="['mc-user__item', classNames?.item]"
        @click="choose(index)"
        @pointermove="focusItem(index)"
      >
        {{ item.label }}
      </button>
      <button v-if="signOut" :id="`${id}-item-${items.length}`" type="button" role="menuitem" :tabindex="active === items.length ? 0 : -1" :class="['mc-user__item', 'mc-user__item--danger', classNames?.item]" @click="choose(items.length)" @pointermove="focusItem(items.length)">Sign out</button>
    </div>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-user { position: relative; display: inline-block; }
.mc-user__trigger { display: grid; padding: 0; border: 0; border-radius: 50%; background: transparent; cursor: pointer; }
.mc-user__content { position: absolute; z-index: 1000; top: calc(100% + 8px); right: 0; width: 17rem; padding: 4px; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-raised); box-shadow: var(--shadow-floating); animation: mc-user-in .18s var(--ease-enter) both; transform-origin: top right; }
.mc-user__header { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); margin-bottom: 4px; border-bottom: 1px solid var(--border); }
.mc-user__who { display: grid; flex: 1; min-width: 0; font-size: var(--text-xs); color: var(--text-muted); }
.mc-user__who strong { color: var(--foreground); font-size: var(--text-sm); }
.mc-user__plan { color: var(--text-secondary); font-size: var(--text-xs); }
.mc-user__status { display: flex; gap: 6px; padding: var(--space-3); }
.mc-user__status button { padding: 4px 12px; border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-xs); font-weight: 500; cursor: pointer; }
.mc-user__status button[aria-checked="true"] { border-color: var(--foreground); background: var(--surface-muted); }
.mc-user__item { display: flex; width: 100%; min-height: var(--control-height-sm); align-items: center; padding: 0 var(--space-3); border: 0; border-radius: calc(var(--radius-control) - 4px); background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); text-align: left; cursor: pointer; }
.mc-user__item:focus, .mc-user__item:focus-visible { outline: none; background: var(--surface-muted); }
.mc-user__item--danger { color: var(--danger); }
@keyframes mc-user-in { from { opacity: 0; transform: translateY(-4px) scale(.98); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .mc-user__content { animation: none; } }
</style>
