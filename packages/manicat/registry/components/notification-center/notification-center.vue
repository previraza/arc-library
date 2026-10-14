<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next reka-ui
import { animate } from "motion";
import { computed, onBeforeUnmount, onUpdated, ref, watch } from "vue";
import { PopoverClose, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from "reka-ui";
import { Bell, Check, CheckCheck, CircleCheck, CircleDot, MessageCircle, TriangleAlert, X } from "lucide-vue-next";
import Avatar from "@/registry/components/avatar/avatar.vue";
import NotificationCount from "@/registry/components/notification-center/notification-center-count.vue";
import NotificationMorph from "@/registry/components/notification-center/notification-center-morph.vue";
import NotificationText from "@/registry/components/notification-center/notification-center-text.vue";
import { animateSize, playPose, popOut } from "@/lib/motion-dom";
import { createSelectionGlide } from "@/lib/tabs-motion";
import { motionTokens } from "@/lib/motion-tokens";

export interface NotificationItem {
  id: string;
  title: string;
  description?: string;
  time: string;
  read?: boolean;
  tone?: "info" | "success" | "warning";
  /** A local portrait asset for person-generated updates. */
  actor?: { name: string; photo: string };
}

const props = withDefaults(
  defineProps<{
    notifications: NotificationItem[];
    label?: string;
    avoidCollisions?: boolean;
    classNames?: {
      /** Slot for the notification panel */
      panel?: string;
    };
  }>(),
  { label: "Notifications", avoidCollisions: true },
);

/** `readChange` and `dismiss` report what the person did; the list is kept here, starting from `notifications`. */
const emit = defineEmits<{ readChange: [notification: NotificationItem, read: boolean]; dismiss: [notification: NotificationItem] }>();
const openModel = defineModel<boolean | undefined>("open");
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const { duration, blur, stagger, spring } = motionTokens;
/** Bulk actions cascade down the list, capped so the whole sweep stays under a quarter second. */
const cascade = (index: number) => Math.min(index * stagger.item, 0.2);

const internalOpen = ref(false);
const items = ref<NotificationItem[]>(props.notifications.map((item) => ({ ...item })));
const view = ref<"all" | "unread">("all");
const expandedId = ref<string | null>(null);
const bulk = ref(false);
const bell = ref<HTMLElement>();
const viewSwitch = ref<HTMLElement>();
const list = ref<HTMLElement>();
let glide: ReturnType<typeof createSelectionGlide> | undefined;

const isOpen = computed(() => openModel.value ?? internalOpen.value);
const unreadCount = computed(() => items.value.filter((item) => !item.read).length);
const readCount = computed(() => items.value.length - unreadCount.value);
const visible = computed(() => (view.value === "unread" ? items.value.filter((item) => !item.read) : items.value));
const summary = computed(() => (unreadCount.value ? `${unreadCount.value} update${unreadCount.value === 1 ? "" : "s"} waiting for you` : "You’re all caught up"));
const cn = (base: string, ...extra: (string | undefined | false)[]) => [base, ...extra].filter(Boolean).join(" ");

watch(() => props.notifications, (next) => (items.value = next.map((item) => ({ ...item }))));
function setOpen(next: boolean) {
  internalOpen.value = next;
  openModel.value = next;
}

const itemEl = (id: string) => list.value?.querySelector<HTMLElement>(`[data-item="${CSS.escape(id)}"]`);
const tabEl = (name: "all" | "unread") => viewSwitch.value?.querySelector<HTMLElement>(`[data-view="${name}"]`);
function focusNext(item: NotificationItem) {
  const index = visible.value.findIndex((entry) => entry.id === item.id);
  const nextId = visible.value[index + 1]?.id ?? visible.value[index - 1]?.id;
  requestAnimationFrame(() => (nextId ? itemEl(nextId)?.focus() : tabEl("unread")?.focus()));
}
function toggleRead(item: NotificationItem) {
  const next = !item.read;
  if (next && view.value === "unread") focusNext(item);
  bulk.value = false;
  items.value = items.value.map((entry) => (entry.id === item.id ? { ...entry, read: next } : entry));
  if (next && view.value === "unread") expandedId.value = null;
  emit("readChange", item, next);
}
function markAllRead() {
  items.value.filter((item) => !item.read).forEach((item) => emit("readChange", item, true));
  bulk.value = true;
  items.value = items.value.map((item) => ({ ...item, read: true }));
  expandedId.value = null;
  requestAnimationFrame(() => tabEl(view.value)?.focus());
}
function dismiss(item: NotificationItem) {
  focusNext(item);
  bulk.value = false;
  items.value = items.value.filter((entry) => entry.id !== item.id);
  if (expandedId.value === item.id) expandedId.value = null;
  emit("dismiss", item);
}
function clearRead() {
  items.value.filter((item) => item.read).forEach((item) => emit("dismiss", item));
  bulk.value = true;
  items.value = items.value.filter((item) => !item.read);
  requestAnimationFrame(() => tabEl("all")?.focus());
}
function setView(next: "all" | "unread") {
  bulk.value = false;
  view.value = next;
  expandedId.value = null;
}

// The bell tilts while the panel is open; the view switch's highlight glides between its two buttons.
watch(isOpen, (open) => {
  if (bell.value) animate(bell.value, { rotate: open && !reduced ? -12 : 0 } as never, (reduced ? { duration: 0 } : spring.snappy) as never);
});
watch(viewSwitch, (el) => {
  glide?.destroy();
  glide = el ? createSelectionGlide(el, { selectionClass: "mc-notification-center__viewHighlight", reduced, selector: '[aria-pressed="true"]' }) : undefined;
  glide?.update();
}, { flush: "post" });
watch(view, () => glide?.update(), { flush: "post" });
onUpdated(() => glide?.update());
onBeforeUnmount(() => glide?.destroy());

// Rows, details and frames open and close their own height on a spring, so the list and the panel move together.
const heightTiming = { spring: "smooth" } as const;
function openHeight(el: Element, done: () => void) {
  if (reduced) return void playPose(el, { opacity: 0 }, { opacity: 1 }, { duration: duration.instant }).finished.then(done);
  const node = el as HTMLElement;
  node.style.overflow = "hidden";
  node.style.height = "0px";
  playPose(node, { opacity: 0 }, { opacity: 1 }, { duration: duration.standard, ease: "enter" });
  animateSize(node, "height", "open", heightTiming).finished.then(() => {
    node.style.overflow = "";
    done();
  });
}
function closeHeight(el: Element, done: () => void, delay = 0) {
  if (reduced) return void animate(el, { opacity: 0 }, { duration: duration.instant }).finished.then(done);
  const node = el as HTMLElement;
  node.style.overflow = "hidden";
  playPose(node, { opacity: 1 }, { opacity: 0 }, { duration: duration.fast, ease: "standard", delay });
  animateSize(node, "height", "close", { spring: "smooth", delay }).finished.then(done);
}
function enterRow(el: Element, done: () => void) {
  if ((el as HTMLElement).classList.contains("mc-notification-center__emptyFrame")) return enterEmpty(el, done);
  if (reduced) return void playPose(el, { opacity: 0 }, { opacity: 1 }, { duration: duration.instant }).finished.then(done);
  const node = el as HTMLElement;
  node.style.overflow = "hidden";
  node.style.height = "0px";
  animateSize(node, "height", "open", heightTiming).finished.then(() => {
    node.style.overflow = "";
    done();
  });
  playPose(node, { opacity: 0 }, { opacity: 1 }, { spring: "smooth", fade: duration.standard });
}
function leaveRow(el: Element, done: () => void) {
  const index = Number((el as HTMLElement).dataset.index ?? 0);
  closeHeight(el, done, bulk.value ? cascade(index) : 0);
}
function enterDot(el: Element, done: () => void) {
  if (reduced) return void playPose(el, { opacity: 0 }, { opacity: 1 }, { duration: duration.instant }).finished.then(done);
  playPose(el, { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1 }, { spring: "snappy", fade: duration.fast }).finished.then(done);
}
function leaveDot(el: Element, done: () => void) {
  const index = Number((el as HTMLElement).dataset.index ?? 0);
  if (reduced) return void animate(el, { opacity: 0 }, { duration: duration.instant }).finished.then(done);
  playPose(el, { opacity: 1, scale: 1 }, { opacity: 0, scale: 0.3 }, { duration: duration.fast, ease: "standard", delay: bulk.value ? cascade(index) : 0 }).finished.then(done);
}
function enterGlyph(el: Element, done: () => void) {
  if (reduced) return void playPose(el, { opacity: 0 }, { opacity: 1 }, { duration: duration.instant }).finished.then(done);
  playPose(el, { opacity: 0, scale: 0.6, blur: blur.subtle }, { opacity: 1, scale: 1, blur: 0 }, { spring: "snappy", fade: duration.fast }).finished.then(done);
}
function leaveGlyph(el: Element, done: () => void) {
  popOut(el as HTMLElement);
  if (reduced) return void animate(el, { opacity: 0 }, { duration: duration.instant }).finished.then(done);
  playPose(el, { opacity: 1, scale: 1, blur: 0 }, { opacity: 0, scale: 0.6, blur: blur.subtle }, { duration: duration.fast, ease: "standard" }).finished.then(done);
}
function enterBadge(el: Element, done: () => void) {
  if (reduced) return void playPose(el, { opacity: 0 }, { opacity: 1 }, { duration: duration.instant }).finished.then(done);
  playPose(el, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1 }, { spring: "snappy", fade: duration.fast }).finished.then(done);
}
function leaveBadge(el: Element, done: () => void) {
  if (reduced) return void animate(el, { opacity: 0 }, { duration: duration.instant }).finished.then(done);
  playPose(el, { opacity: 1, scale: 1 }, { opacity: 0, scale: 0.6 }, { duration: duration.fast, ease: "standard" }).finished.then(done);
}
function enterFade(el: Element, done: () => void) {
  if (reduced) return done();
  playPose(el, { opacity: 0, blur: blur.subtle }, { opacity: 1, blur: 0 }, { duration: duration.standard, ease: "enter" }).finished.then(done);
}
function leaveFade(el: Element, done: () => void) {
  if (reduced) return void animate(el, { opacity: 0 }, { duration: duration.instant }).finished.then(done);
  playPose(el, { opacity: 1, blur: 0 }, { opacity: 0, blur: blur.subtle }, { duration: duration.fast, ease: "standard" }).finished.then(done);
}
// The empty state opens its height on the same spring the rows close on; after a bulk action it waits for the cascade to get going.
function enterEmpty(el: Element, done: () => void) {
  if (reduced) return void playPose(el, { opacity: 0 }, { opacity: 1 }, { duration: duration.instant }).finished.then(done);
  const node = el as HTMLElement;
  node.style.overflow = "hidden";
  node.style.height = "0px";
  const delay = bulk.value ? cascade(3) : 0;
  animateSize(node, "height", "open", { spring: "smooth", delay }).finished.then(() => {
    node.style.overflow = "";
    done();
  });
  playPose(node, { opacity: 0 }, { opacity: 1 }, { duration: duration.standard, ease: "enter", delay: duration.fast });
  const inner = node.firstElementChild;
  if (inner) playPose(inner, { y: 6 }, { y: 0 }, { duration: duration.standard, ease: "enter", delay: duration.fast });
}
const leaveEmpty = (el: Element, done: () => void) => closeHeight(el, done);
</script>

<template>
  <PopoverRoot :open="isOpen" @update:open="setOpen">
    <PopoverTrigger as-child>
      <!-- The trigger anchors the panel, so it gives press feedback with color only; scaling it would shift the panel. -->
      <button class="mc-notification-center__trigger" type="button" :aria-label="`${label}${unreadCount ? `, ${unreadCount} unread` : ''}`">
        <span ref="bell" style="display: inline-block"><Bell :size="19" :stroke-width="1.75" aria-hidden="true" /></span>
        <Transition :css="false" @enter="enterBadge" @leave="leaveBadge"><span v-if="unreadCount > 0" key="badge" class="mc-notification-center__badge" aria-hidden="true"><NotificationCount :value="unreadCount" :display="unreadCount > 9 ? '9+' : String(unreadCount)" /></span></Transition>
      </button>
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent :class="cn('mc-notification-center__panel', classNames?.panel)" align="center" side="bottom" :side-offset="12" :collision-padding="12" :avoid-collisions="avoidCollisions" :aria-label="label">
        <div class="mc-notification-center__header">
          <div>
            <div class="mc-notification-center__heading"><h2>{{ label }}</h2><span class="mc-notification-center__count"><NotificationCount :value="unreadCount" /></span></div>
            <p aria-live="polite"><NotificationText>{{ summary }}</NotificationText></p>
          </div>
          <PopoverClose class="mc-notification-center__close" aria-label="Close notifications"><X :size="17" :stroke-width="1.75" aria-hidden="true" /></PopoverClose>
        </div>

        <div class="mc-notification-center__toolbar">
          <div ref="viewSwitch" class="mc-notification-center__viewSwitch" role="group" aria-label="Show notifications">
            <button v-for="next in (['all', 'unread'] as const)" :key="next" type="button" :data-view="next" :class="view === next ? 'mc-notification-center__viewActive' : undefined" :aria-pressed="view === next" @click="setView(next)"><span>{{ next === "all" ? "All" : "Unread" }}</span></button>
          </div>
          <Transition :css="false" @enter="enterFade" @leave="leaveFade"><button v-if="unreadCount > 0" key="mark-all" type="button" class="mc-notification-center__markAll" @click="markAllRead"><CheckCheck :size="15" :stroke-width="1.75" aria-hidden="true" /><span>Mark all read</span></button></Transition>
        </div>

        <!-- Rows collapse their own height on the way out, so the list and the panel close the gap together. -->
        <div ref="list" class="mc-notification-center__list" role="list" :aria-label="view === 'all' ? 'All notifications' : 'Unread notifications'">
          <TransitionGroup tag="div" style="display: contents" :css="false" @enter="enterRow" @leave="leaveRow">
            <div v-for="(item, index) in visible" :key="item.id" role="listitem" class="mc-notification-center__row" :data-index="index">
              <article :class="cn('mc-notification-center__item', item.read && 'mc-notification-center__itemRead', expandedId === item.id && 'mc-notification-center__itemExpanded')" :style="{ '--index': Math.min(index, 7) }">
                <div class="mc-notification-center__itemMain">
                  <Avatar v-if="item.actor" :name="item.actor.name" :src="item.actor.photo" size="md" />
                  <span v-else :class="cn('mc-notification-center__eventIcon', `mc-notification-center__${item.tone ?? 'info'}`)" aria-hidden="true">
                    <TriangleAlert v-if="item.tone === 'warning'" :size="18" :stroke-width="1.7" /><CircleCheck v-else-if="item.tone === 'success'" :size="18" :stroke-width="1.7" /><MessageCircle v-else :size="18" :stroke-width="1.7" />
                  </span>
                  <button :data-item="item.id" type="button" class="mc-notification-center__itemToggle" :aria-expanded="expandedId === item.id" :aria-label="`${item.title}${item.read ? '' : ', unread'}. ${expandedId === item.id ? 'Hide details' : 'Show details'}`" @click="expandedId = expandedId === item.id ? null : item.id">
                    <span class="mc-notification-center__itemTitle"><strong>{{ item.title }}</strong>
                      <Transition :css="false" @enter="enterDot" @leave="leaveDot"><span v-if="!item.read" key="dot" class="mc-notification-center__unreadDot" aria-hidden="true" :data-index="index" /></Transition>
                    </span>
                    <span class="mc-notification-center__itemPreview">{{ item.description ?? (item.actor ? `From ${item.actor.name}` : "View update details") }}</span>
                  </button>
                  <time class="mc-notification-center__time">{{ item.time }}</time>
                </div>
                <Transition :css="false" @enter="openHeight" @leave="(el, done) => closeHeight(el, done)">
                  <div v-if="expandedId === item.id" class="mc-notification-center__details">
                    <p>{{ item.description ?? (item.actor ? `${item.actor.name} shared an update with you.` : "This update is ready to review.") }}</p>
                    <div class="mc-notification-center__itemActions">
                      <button type="button" @click="toggleRead(item)"><NotificationMorph :morph-key="item.read ? 'read' : 'unread'">
                        <span class="mc-notification-center__actionIcon"><Transition :css="false" @enter="enterGlyph" @leave="leaveGlyph"><span :key="item.read ? 'unread' : 'read'" class="mc-notification-center__actionGlyph"><CircleDot v-if="item.read" :size="14" :stroke-width="1.75" aria-hidden="true" /><Check v-else :size="14" :stroke-width="1.75" aria-hidden="true" /></span></Transition></span>
                        <NotificationText>{{ item.read ? "Mark unread" : "Mark read" }}</NotificationText>
                      </NotificationMorph></button>
                      <button type="button" @click="dismiss(item)"><X :size="14" :stroke-width="1.75" aria-hidden="true" />Dismiss</button>
                    </div>
                  </div>
                </Transition>
              </article>
            </div>
            <div v-if="visible.length === 0" key="empty" class="mc-notification-center__emptyFrame">
              <div class="mc-notification-center__empty"><CircleCheck :size="24" :stroke-width="1.5" aria-hidden="true" /><strong><NotificationText>{{ view === "unread" ? "Nothing unread" : "All clear" }}</NotificationText></strong><p><NotificationText>{{ view === "unread" ? "You’ve seen every update." : "New updates will appear here." }}</NotificationText></p><button v-if="view === 'unread' && items.length > 0" type="button" @click="setView('all')">View all updates</button></div>
            </div>
          </TransitionGroup>
        </div>

        <Transition :css="false" @enter="openHeight" @leave="(el, done) => closeHeight(el, done)">
          <div v-if="readCount > 0" key="footer" class="mc-notification-center__footerFrame">
            <div class="mc-notification-center__footer"><span><NotificationCount :value="readCount" /> read</span><button type="button" @click="clearRead">Clear read</button></div>
          </div>
        </Transition>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-notification-center__trigger { position: relative; display: grid; width: 42px; height: 42px; place-items: center; border: 1px solid var(--border); border-radius: 12px; background: var(--surface); color: var(--foreground); cursor: pointer; transition: border-color var(--duration-fast) var(--ease-standard), background var(--duration-fast) var(--ease-standard); }
.mc-notification-center__trigger[data-state="open"], .mc-notification-center__trigger:active { border-color: var(--border-strong); background: var(--surface-muted); }
@media (hover: hover) and (pointer: fine) { .mc-notification-center__trigger:hover { border-color: var(--border-strong); background: var(--surface-muted); } }
.mc-notification-center__trigger > span:first-child { display: grid; place-items: center; }
.mc-notification-center__badge { position: absolute; top: -6px; right: -6px; display: grid; min-width: 20px; height: 20px; padding: 0 5px; place-items: center; overflow: hidden; border: 2px solid var(--surface); border-radius: var(--radius-pill); background: var(--foreground); color: var(--background); font-size: var(--text-xs); font-weight: 500; line-height: 1; font-variant-numeric: tabular-nums; }
.mc-notification-center__panel { z-index: 90; display: flex; flex-direction: column; width: min(424px, calc(100vw - 24px)); max-height: min(590px, calc(100vh - 24px)); overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-raised); color: var(--foreground); box-shadow: var(--shadow-floating); font-family: var(--font-body); letter-spacing: var(--tracking-body); transform-origin: var(--reka-popover-content-transform-origin); }
/* The panel grows out of the bell: it starts a few pixels toward the trigger on whichever side Radix placed it, and leaves faster than it arrives. */
.mc-notification-center__panel { --panel-x: 0px; --panel-y: -6px; }
.mc-notification-center__panel[data-side="top"] { --panel-y: 6px; }
.mc-notification-center__panel[data-side="left"] { --panel-x: 6px; --panel-y: 0px; }
.mc-notification-center__panel[data-side="right"] { --panel-x: -6px; --panel-y: 0px; }
.mc-notification-center__panel[data-state="open"] { animation: mc-notification-center-panel-open var(--duration-standard) var(--ease-enter) both; }
.mc-notification-center__panel[data-state="closed"] { animation: mc-notification-center-panel-close var(--duration-instant) var(--ease-standard) both; }
.mc-notification-center__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 23px 24px 18px; }
.mc-notification-center__heading { display: flex; align-items: center; gap: var(--space-2); }
.mc-notification-center__heading h2 { margin: 0; font-size: var(--text-xl); font-weight: 500; letter-spacing: var(--tracking-body); line-height: 1.2; }
.mc-notification-center__count { display: grid; min-width: 21px; height: 21px; padding: 0 5px; place-items: center; overflow: hidden; border-radius: 7px; background: var(--surface-muted); color: var(--text-secondary); font-size: var(--text-xs); line-height: 1; font-variant-numeric: tabular-nums; }
.mc-notification-center__header p { position: relative; margin: 4px 0 0; color: var(--text-secondary); font-size: var(--text-xs); line-height: var(--leading-body); }
.mc-notification-center__close { display: grid; width: 30px; height: 30px; flex: none; place-items: center; border: 0; border-radius: 8px; background: transparent; color: var(--text-muted); cursor: pointer; transition: transform var(--duration-spring) var(--ease-spring), color var(--duration-fast) var(--ease-standard), background var(--duration-fast) var(--ease-standard); }
.mc-notification-center__close:active { transform: scale(.96); }
.mc-notification-center__toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 52px; padding: 0 17px 13px 20px; border-bottom: 1px solid var(--border-subtle); }
.mc-notification-center__viewSwitch { display: inline-flex; align-items: center; gap: 3px; }
.mc-notification-center__viewSwitch button { position: relative; isolation: isolate; min-width: 61px; height: 31px; padding: 0 10px; border: 0; border-radius: 9px; background: transparent; color: var(--text-secondary); font: inherit; font-size: var(--text-xs); cursor: pointer; transition: color var(--duration-fast) var(--ease-standard); }
.mc-notification-center__viewSwitch .mc-notification-center__viewActive { color: var(--foreground); }
.mc-notification-center__viewSwitch button > span:last-child { position: relative; z-index: 1; }
.mc-notification-center__viewHighlight { position: absolute; z-index: -1; inset: 0; border-radius: 9px; background: var(--surface-muted); }
.mc-notification-center__markAll { display: inline-flex; align-items: center; gap: 6px; padding: 6px 0; border: 0; background: transparent; color: var(--text-secondary); font: inherit; font-size: var(--text-xs); white-space: nowrap; cursor: pointer; transition: transform var(--duration-spring) var(--ease-spring), color var(--duration-fast) var(--ease-standard); }
.mc-notification-center__markAll:active { transform: scale(.97); }
.mc-notification-center__list { min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 9px 11px 10px; scrollbar-width: none; }
.mc-notification-center__list::-webkit-scrollbar { display: none; }
.mc-notification-center__row { overflow: hidden; }
/* Rows settle in with a short cascade when the panel opens or a view adds them. */
.mc-notification-center__item { position: relative; padding: 10px; border-radius: calc(var(--radius-panel) - 12px); transition: background var(--duration-fast) var(--ease-standard); animation: mc-notification-center-item-in var(--duration-standard) var(--ease-enter) calc(var(--index, 0) * 35ms) both; }
.mc-notification-center__itemExpanded { background: var(--surface-muted); }
.mc-notification-center__itemRead .mc-notification-center__itemTitle strong { color: var(--text-secondary); }
.mc-notification-center__itemMain { display: flex; align-items: flex-start; gap: 11px; min-width: 0; }
.mc-notification-center__eventIcon { display: grid; width: 36px; height: 36px; flex: none; place-items: center; color: var(--accent); }
.mc-notification-center__eventIcon.mc-notification-center__success { color: var(--success); }
.mc-notification-center__eventIcon.mc-notification-center__warning { color: var(--warning); }
.mc-notification-center__itemToggle { display: grid; min-width: 0; flex: 1; gap: 4px; padding: 2px 0 0; border: 0; background: transparent; color: var(--foreground); text-align: left; font: inherit; cursor: pointer; }
.mc-notification-center__itemTitle { display: flex; align-items: center; gap: 6px; min-width: 0; min-height: 20px; }
.mc-notification-center__itemTitle strong { overflow: hidden; font-size: var(--text-sm); font-weight: 500; line-height: 1.4; text-overflow: ellipsis; white-space: nowrap; }
.mc-notification-center__unreadDot { display: block; width: 6px; height: 6px; flex: none; border-radius: 50%; background: var(--foreground); }
.mc-notification-center__itemPreview { overflow: hidden; color: var(--text-secondary); font-size: var(--text-xs); line-height: var(--leading-body); text-overflow: ellipsis; white-space: nowrap; }
.mc-notification-center__time { flex: none; padding-top: 4px; color: var(--text-muted); font-size: var(--text-xs); line-height: var(--leading-body); font-variant-numeric: tabular-nums; white-space: nowrap; }
.mc-notification-center__details { overflow: hidden; padding-left: 47px; }
.mc-notification-center__details p { margin: 12px 0; color: var(--text-secondary); font-size: var(--text-xs); line-height: var(--leading-body); }
.mc-notification-center__itemActions { display: flex; flex-wrap: wrap; gap: 6px; padding-bottom: 5px; }
.mc-notification-center__itemActions button { display: inline-flex; align-items: center; gap: 5px; height: 30px; padding: 0 10px; overflow: clip; border: 1px solid var(--border); border-radius: 10px; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-xs); line-height: 1; white-space: nowrap; cursor: pointer; transition: transform var(--duration-spring) var(--ease-spring), border-color var(--duration-fast) var(--ease-standard), background var(--duration-fast) var(--ease-standard); }
.mc-notification-center__itemActions button:active { transform: scale(.97); }
/* Quick press, spring release: the resting transition above carries the spring back. */
.mc-notification-center__close:active, .mc-notification-center__markAll:active, .mc-notification-center__itemActions button:active, .mc-notification-center__footer button:active { transition-duration: var(--duration-instant); transition-timing-function: var(--ease-standard); }
.mc-notification-center__morph { display: inline-flex; align-items: center; }
.mc-notification-center__morphContent { position: relative; display: inline-flex; width: max-content; align-items: center; gap: 5px; }
.mc-notification-center__actionIcon, .mc-notification-center__actionGlyph { position: relative; display: grid; place-items: center; }
.mc-notification-center__swap { position: relative; display: inline-block; max-width: 100%; vertical-align: top; }
.mc-notification-center__swapLine { display: block; }
.mc-notification-center__roll { position: relative; display: inline-grid; vertical-align: top; }
.mc-notification-center__rollValue { display: block; }
.mc-notification-center__emptyFrame { overflow: hidden; }
.mc-notification-center__empty { display: grid; justify-items: center; align-content: center; min-height: 190px; padding: 22px 12px; text-align: center; }
.mc-notification-center__empty > svg { margin-bottom: 13px; color: var(--text-muted); }
.mc-notification-center__empty strong { font-size: var(--text-sm); font-weight: 500; }
.mc-notification-center__empty p { margin: 4px 0 0; color: var(--text-secondary); font-size: var(--text-xs); }
.mc-notification-center__empty button { margin-top: 16px; padding: 0; border: 0; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-xs); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.mc-notification-center__footerFrame { flex: none; overflow: hidden; }
.mc-notification-center__footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 46px; padding: 8px 22px; border-top: 1px solid var(--border-subtle); color: var(--text-muted); font-size: var(--text-xs); }
.mc-notification-center__footer button { padding: 4px 0; border: 0; background: transparent; color: var(--text-secondary); font: inherit; font-size: var(--text-xs); cursor: pointer; transition: transform var(--duration-spring) var(--ease-spring), color var(--duration-fast) var(--ease-standard); }
.mc-notification-center__footer button:active { transform: scale(.97); }
@media (hover: hover) and (pointer: fine) {
  .mc-notification-center__close:hover, .mc-notification-center__item:hover { background: var(--surface-muted); }
  .mc-notification-center__close:hover, .mc-notification-center__viewSwitch button:hover, .mc-notification-center__markAll:hover, .mc-notification-center__footer button:hover { color: var(--foreground); }
  .mc-notification-center__itemActions button:hover { border-color: var(--border-strong); background: var(--surface); }
}
@keyframes mc-notification-center-panel-open { from { opacity: 0; transform: translate(var(--panel-x), var(--panel-y)) scale(.97); } }
@keyframes mc-notification-center-panel-close { to { opacity: 0; transform: translate(calc(var(--panel-x) / 2), calc(var(--panel-y) / 2)) scale(.98); } }
@keyframes mc-notification-center-item-in { from { opacity: 0; transform: translateY(4px); } }
@media (max-width: 380px) { .mc-notification-center__header { padding: 20px 16px 16px; } .mc-notification-center__heading h2 { font-size: var(--text-lg); } .mc-notification-center__toolbar { align-items: flex-start; padding: 0 12px 12px; } .mc-notification-center__list { padding: 8px 5px; } .mc-notification-center__item { padding-inline: 7px; } .mc-notification-center__itemMain { gap: 7px; } .mc-notification-center__details { padding-left: 43px; } .mc-notification-center__itemActions { gap: 5px; } .mc-notification-center__itemActions button { padding-inline: 7px; } .mc-notification-center__markAll span { display: none; } .mc-notification-center__footer { padding-inline: 16px; } }
@media (prefers-reduced-motion: reduce) { .mc-notification-center__panel[data-state], .mc-notification-center__trigger, .mc-notification-center__close, .mc-notification-center__viewSwitch button, .mc-notification-center__markAll, .mc-notification-center__item, .mc-notification-center__itemActions button, .mc-notification-center__footer button { animation: none; transition-duration: 0ms; } .mc-notification-center__close:active, .mc-notification-center__markAll:active, .mc-notification-center__itemActions button:active, .mc-notification-center__footer button:active { transform: none; } }
</style>
