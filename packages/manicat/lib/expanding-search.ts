// @manicat-dependencies motion
/**
 * The search, the grouping and the motion of the expanding search, for the Vue and Svelte ports: the shell that morphs between a circle and
 * a field, the panel that unfolds beneath it, and the highlight that travels between rows. The counterparts of the helpers, `Panel` and
 * `Listbox` in expanding-search.tsx; a port renders the markup and hands the elements over.
 */
import { animate, motionValue } from "motion";
import type { MotionValue } from "motion";
import { motionTokens } from "./motion-tokens";

export interface ExpandingSearchEntry {
  id: string;
  title: string;
  /** One short line under the title, such as the type, owner, or last edit. */
  meta?: string;
  /** Results gather under this heading, in the order groups first appear in `items`. */
  group?: string;
  /** Extra words that should also find this item. */
  keywords?: string[];
}

export type SearchGroup<T> = { name: string; items: T[] };
export type SearchMode = "suggestions" | "results" | "empty";

export const enter = [...motionTokens.ease.enter] as [number, number, number, number];
export const standard = [...motionTokens.ease.standard] as [number, number, number, number];
export const FALLBACK_SIZE = 44;

/** Title starts beat word starts, which beat matches inside a word, which beat keyword and meta matches. Ties keep the original order. */
export function rank<T extends ExpandingSearchEntry>(items: T[], query: string, limit: number) {
  const q = query.toLocaleLowerCase();
  const scored: { item: T; score: number; order: number }[] = [];
  items.forEach((item, order) => {
    const title = item.title.toLocaleLowerCase();
    const at = title.indexOf(q);
    const extra = [item.meta ?? "", ...(item.keywords ?? [])].some((word) => word.toLocaleLowerCase().includes(q));
    const score = at === 0 ? 0 : at > 0 && /[\s\-/]/.test(title[at - 1]) ? 1 : at > 0 ? 2 : extra ? 3 : -1;
    if (score >= 0) scored.push({ item, score, order });
  });
  return scored.sort((a, b) => a.score - b.score || a.order - b.order).slice(0, limit).map((entry) => entry.item);
}

export function groupBy<T extends ExpandingSearchEntry>(list: T[], source: T[]): SearchGroup<T>[] {
  const order = new Map<string, number>();
  source.forEach((item, index) => {
    const name = item.group ?? "";
    if (!order.has(name)) order.set(name, index);
  });
  const groups = new Map<string, T[]>();
  list.forEach((item) => {
    const name = item.group ?? "";
    groups.set(name, [...(groups.get(name) ?? []), item]);
  });
  return [...groups].sort((a, b) => (order.get(a[0]) ?? 0) - (order.get(b[0]) ?? 0)).map(([name, items]) => ({ name, items }));
}

/** The text before, inside and after the first match of the query, or null when there is none. */
export function splitMatch(text: string, query: string): [string, string, string] | null {
  const at = query ? text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase()) : -1;
  return at < 0 ? null : [text.slice(0, at), text.slice(at, at + query.length), text.slice(at + query.length)];
}

/**
 * The shell is both the button and the field. Its width rides a spring and its corner radius follows the width, from a circle to the
 * control radius. The field grows to its own limit or its container, whichever is smaller.
 */
export function createSearchShell(root: HTMLElement, shell: HTMLElement, { expandedWidth, reduced, isOpen }: { expandedWidth: () => number; reduced: boolean; isOpen: () => boolean }) {
  const size = { collapsed: FALLBACK_SIZE, expanded: expandedWidth() };
  const width = motionValue(FALLBACK_SIZE);
  const syncShape = (value: number) => {
    const { collapsed, expanded } = size;
    shell.style.setProperty("--es-open", String(Math.min(1, Math.max(0, (value - collapsed) / Math.max(1, expanded - collapsed)))));
  };
  const stop = width.on("change", (value) => {
    shell.style.width = `${value}px`;
    syncShape(value);
  });
  shell.style.width = `${FALLBACK_SIZE}px`;

  // Container resizes are followed at once; they are not the person's action.
  const measure = () => {
    const collapsed = shell.offsetHeight || FALLBACK_SIZE;
    const full = Math.max(collapsed, Math.min(expandedWidth(), root.clientWidth));
    size.collapsed = collapsed;
    size.expanded = full;
    root.style.setProperty("--es-width", `${full}px`);
    const goal = isOpen() ? full : collapsed;
    if (width.isAnimating()) animate(width, goal, motionTokens.spring.morph as never);
    else width.jump(goal);
    syncShape(width.get());
  };
  measure();
  const observer = new ResizeObserver(measure);
  observer.observe(root);

  // Opening grows on the morph spring with a hint of overshoot; folding back settles without one, so the circle never dips below its own size.
  const morphTo = (goal: number) => {
    if (reduced) width.jump(goal);
    else animate(width, goal, (goal >= width.get() ? motionTokens.spring.morph : motionTokens.spring.smooth) as never);
  };
  return {
    width,
    measure,
    open: () => morphTo(size.expanded),
    close: () => morphTo(size.collapsed),
    destroy() {
      observer.disconnect();
      stop();
    },
  };
}

/** The panel shares the field's width value, so on first open it unfolds out of the field; afterwards only its height follows the content. */
export function createPanelMotion(panel: HTMLElement, body: HTMLElement, width: MotionValue<number>, reduced: boolean) {
  const paintWidth = (value: number) => (panel.style.width = `${value}px`);
  paintWidth(width.get());
  const stopWidth = width.on("change", paintWidth);
  const height = motionValue(0);
  // Reduced motion skips the unfold: the panel is its content's height from the first frame and only fades.
  const stopHeight = height.on("change", (value) => (panel.style.height = `${value}px`));
  panel.style.height = reduced ? "auto" : "0px";
  const observer = new ResizeObserver(() => {
    const next = body.offsetHeight + panel.offsetHeight - panel.clientHeight;
    if (reduced) height.jump(next);
    else animate(height, next, motionTokens.spring.smooth as never);
  });
  observer.observe(body);
  return () => {
    observer.disconnect();
    stopWidth();
    stopHeight();
  };
}

/** Offsets ignore transforms, so they describe where rows sit in the list, not where a gliding row happens to be mid-flight. */
function offsetWithin(node: HTMLElement, container: HTMLElement) {
  let top = 0;
  let current: HTMLElement | null = node;
  while (current && current !== container) {
    top += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }
  return top;
}

/**
 * The highlight lives inside the active row, so it rides that row wherever it glides. Moving to another row, it starts where the old one was
 * and springs home; new results fade it in on its row without travel.
 */
export function createListboxMotion(list: HTMLElement, { reduced, keyboard }: { reduced: boolean; keyboard: { current: boolean } }) {
  const travel = motionValue(0);
  const fade = motionValue(1);
  let last: { id: string; set: string; top: number } | null = null;
  const paint = () => {
    const el = list.querySelector<HTMLElement>("[data-highlight]");
    if (!el) return;
    el.style.transform = `translateY(${travel.get()}px)`;
    el.style.opacity = String(fade.get());
  };
  const stops = [travel.on("change", paint), fade.on("change", paint)];
  return {
    sync(activeId: string, layoutKey: string) {
      const row = activeId ? document.getElementById(activeId) : null;
      if (!row) {
        last = null;
        return;
      }
      const top = offsetWithin(row, list);
      const previous = last;
      last = { id: activeId, set: layoutKey, top };
      // Same row: its highlight is already in place, and any travel still in flight stays relative to it.
      if (previous?.id === activeId) return paint();
      if (previous && previous.set === layoutKey && !reduced) {
        const velocity = travel.getVelocity();
        travel.jump(previous.top + travel.get() - top);
        animate(travel, 0, { ...motionTokens.spring.snappy, velocity } as never);
      } else {
        // Nothing was highlighted, or new results arrived: it fades in on its row, without travel.
        travel.jump(0);
        if (reduced) fade.jump(1);
        else {
          fade.jump(0);
          animate(fade, 1, { duration: motionTokens.duration.instant, ease: enter });
        }
      }
      paint();
      if (keyboard.current) row.scrollIntoView({ block: "nearest" });
    },
    destroy: () => stops.forEach((stop) => stop()),
  };
}
