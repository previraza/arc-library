<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next reka-ui
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { AccordionContent, AccordionHeader, AccordionItem as AccordionItemRoot, AccordionRoot, AccordionTrigger } from "reka-ui";
import { animate } from "motion";
import { ChevronDown } from "lucide-vue-next";
import { createCollapse } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";

export interface AccordionItem {
  title: string;
  /** Plain text of the panel. For anything richer, fill the `content` slot, which receives the item and its index. */
  content?: string;
}

const props = withDefaults(
  defineProps<{
    items: AccordionItem[];
    defaultOpen?: number;
    /** "lg" suits page-level FAQs: questions at the large text size, answers at body size. */
    size?: "md" | "lg";
    /** Extend the inner, named parts of the accordion: item, header, trigger, icon, panel or panelInner. */
    classNames?: { item?: string; header?: string; trigger?: string; icon?: string; panel?: string; panelInner?: string };
  }>(),
  { defaultOpen: 0, size: "md" },
);

const openValue = ref(props.defaultOpen >= 0 && props.defaultOpen < props.items.length ? String(props.defaultOpen) : "");
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const panels = ref<HTMLElement[]>([]);
const inners = ref<HTMLElement[]>([]);
const icons = ref<HTMLElement[]>([]);
const controllers: ReturnType<typeof createCollapse>[] = [];

const cn = (base: string, ...extra: (string | false | undefined)[]) => [base, ...extra].filter(Boolean).join(" ");

onMounted(() => {
  props.items.forEach((_, index) => {
    controllers[index] = createCollapse(panels.value[index], inners.value[index], { open: openValue.value === String(index), reduced });
    icons.value[index].style.transform = openValue.value === String(index) ? "rotate(180deg)" : "none";
  });
});
watch(openValue, (next, previous) => {
  controllers.forEach((controller, index) => controller.set(next === String(index)));
  icons.value.forEach((icon, index) => {
    const open = next === String(index);
    if (open === (previous === String(index))) return;
    if (reduced) icon.style.transform = open ? "rotate(180deg)" : "none";
    else animate(icon, { rotate: open ? 180 : 0 }, motionTokens.spring.snappy);
  });
});
onBeforeUnmount(() => controllers.forEach((controller) => controller.destroy()));
</script>

<template>
  <AccordionRoot v-model="openValue" :class="cn('mc-accordion__accordion', size === 'lg' && 'mc-accordion__lg')" type="single" collapsible>
    <AccordionItemRoot v-for="(item, index) in items" :key="`${item.title}-${index}`" :class="cn('mc-accordion__item', classNames?.item)" :value="String(index)">
      <AccordionHeader :class="cn('mc-accordion__header', classNames?.header)">
        <AccordionTrigger :class="cn('mc-accordion__trigger', classNames?.trigger)">
          <span>{{ item.title }}</span>
          <span :ref="(el) => (icons[index] = el as HTMLElement)" :class="cn('mc-accordion__icon', classNames?.icon)"><ChevronDown :size="17" aria-hidden="true" /></span>
        </AccordionTrigger>
      </AccordionHeader>
      <!-- Reka keeps semantics and ids; the height is driven here, so a toggle mid-flight retargets instead of restarting. -->
      <AccordionContent force-mount as-child>
        <div :ref="(el) => (panels[index] = el as HTMLElement)" :class="cn('mc-accordion__panel', classNames?.panel)">
          <div :ref="(el) => (inners[index] = el as HTMLElement)" :class="cn('mc-accordion__panelInner', classNames?.panelInner)"><slot name="content" :item="item" :index="index">{{ item.content }}</slot></div>
        </div>
      </AccordionContent>
    </AccordionItemRoot>
  </AccordionRoot>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-accordion__accordion { width: 100%; border-top: 1px solid var(--border); }
.mc-accordion__item { border-bottom: 1px solid var(--border); }
.mc-accordion__header { margin: 0; }
.mc-accordion__trigger { display: flex; width: 100%; min-height: var(--control-height-lg); align-items: center; justify-content: space-between; gap: var(--space-5); padding: var(--space-2) 0; border: 0; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); font-weight: 500; line-height: var(--leading-body); text-align: left; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-accordion__trigger:hover { color: var(--text-secondary); } .mc-accordion__trigger:hover .mc-accordion__icon { color: var(--foreground); } }
/* Rotation is driven by a spring in accordion.mc-accordion__tsx; CSS only handles color. */
.mc-accordion__icon { display: inline-flex; flex: 0 0 auto; color: var(--text-muted); transition: color var(--duration-fast) var(--ease-standard); }
.mc-accordion__trigger[data-state="open"] .mc-accordion__icon { color: var(--foreground); }
.mc-accordion__panel { overflow: hidden; color: var(--text-secondary); font-size: var(--text-sm); line-height: var(--leading-body); }
.mc-accordion__panelInner { overflow-wrap: anywhere; padding: 0 var(--space-8) var(--space-5) 0; }
.mc-accordion__lg .mc-accordion__trigger { min-height: 76px; gap: var(--space-8); padding-block: var(--space-5); font-size: var(--text-lg); letter-spacing: var(--tracking-body); }
.mc-accordion__lg .mc-accordion__panel { font-size: var(--text-base); line-height: 1.65; }
.mc-accordion__lg .mc-accordion__panelInner { max-width: 62ch; padding: 0 var(--space-12) var(--space-6) 0; }
@media (max-width: 520px) { .mc-accordion__lg .mc-accordion__trigger { min-height: 68px; font-size: var(--text-base); } .mc-accordion__lg .mc-accordion__panel { font-size: var(--text-sm); } .mc-accordion__lg .mc-accordion__panelInner { padding-right: var(--space-6); } }
@media (prefers-reduced-motion: reduce) { .mc-accordion__trigger, .mc-accordion__icon { transition: none; } }
</style>
