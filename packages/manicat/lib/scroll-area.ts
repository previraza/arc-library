// @manicat-dependencies motion
/**
 * The behaviour of the scroll area, for the Vue and Svelte ports: everything visual is written straight to the DOM on each scroll
 * frame, so scrolling never re-renders the framework. The counterpart of the callbacks and effects in scroll-area.tsx.
 */
type Axis = "y" | "x";

/** Which edges still have content beyond them. */
export interface ScrollAreaEdges {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
}

export interface ScrollAreaOptions {
  orientation: "vertical" | "horizontal" | "both";
  fade: number;
  hideDelay: number;
  wheelToHorizontal: boolean;
  onEdgeChange?: (edges: ScrollAreaEdges) => void;
}

const MIN_THUMB = 28;

export function createScrollArea(root: HTMLElement, viewport: HTMLElement, tracks: Record<Axis, HTMLElement | null>, thumbs: Record<Axis, HTMLElement | null>, initial: ScrollAreaOptions) {
  let options = initial;
  let hideTimer: number | undefined;
  let lastEdges = "";
  const vertical = () => options.orientation !== "horizontal";
  const horizontal = () => options.orientation !== "vertical";

  const sync = () => {
    const { scrollTop, scrollLeft, scrollHeight, scrollWidth, clientHeight, clientWidth } = viewport;
    const maxY = Math.max(0, scrollHeight - clientHeight);
    const maxX = Math.max(0, scrollWidth - clientWidth);
    // RTL layouts report negative scrollLeft; distance from the start edge is its magnitude.
    const left = Math.abs(scrollLeft);
    const v = vertical();
    const h = horizontal();
    const edges: ScrollAreaEdges = { top: v && scrollTop > 0.5, bottom: v && maxY - scrollTop > 0.5, left: h && left > 0.5, right: h && maxX - left > 0.5 };

    if (options.fade > 0) {
      viewport.style.setProperty("--fade-top", `${v ? Math.min(options.fade, scrollTop) : 0}px`);
      viewport.style.setProperty("--fade-bottom", `${v ? Math.min(options.fade, maxY - scrollTop) : 0}px`);
      viewport.style.setProperty("--fade-left", `${h ? Math.min(options.fade, left) : 0}px`);
      viewport.style.setProperty("--fade-right", `${h ? Math.min(options.fade, maxX - left) : 0}px`);
    }

    const place = (axis: Axis, scroll: number, max: number, client: number, total: number) => {
      const track = tracks[axis];
      const thumb = thumbs[axis];
      if (!track || !thumb) return;
      const overflowing = max > 0.5;
      track.toggleAttribute("data-hidden", !overflowing);
      if (!overflowing) return;
      const length = axis === "y" ? track.clientHeight : track.clientWidth;
      const size = Math.max(MIN_THUMB, (length * client) / total);
      const offset = (length - size) * (scroll / max);
      thumb.style[axis === "y" ? "height" : "width"] = `${size}px`;
      thumb.style.transform = axis === "y" ? `translate3d(0, ${offset}px, 0)` : `translate3d(${offset}px, 0, 0)`;
    };
    if (v) place("y", scrollTop, maxY, clientHeight, scrollHeight);
    if (h) place("x", left, maxX, clientWidth, scrollWidth);
    root.toggleAttribute("data-overflow", maxY > 0.5 || maxX > 0.5);

    const key = `${edges.top}${edges.bottom}${edges.left}${edges.right}`;
    if (key !== lastEdges) {
      lastEdges = key;
      options.onEdgeChange?.(edges);
    }
  };

  const wake = () => {
    root.setAttribute("data-scrolling", "");
    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => root.removeAttribute("data-scrolling"), options.hideDelay);
  };
  const onScroll = () => {
    sync();
    wake();
  };

  // Every child is observed, so content that grows or shrinks moves the thumbs.
  const observer = new ResizeObserver(() => sync());
  const watchChildren = () => {
    observer.disconnect();
    observer.observe(viewport);
    Array.from(viewport.children).forEach((child) => observer.observe(child));
  };
  watchChildren();
  const mutations = new MutationObserver(() => {
    watchChildren();
    sync();
  });
  mutations.observe(viewport, { childList: true });
  viewport.addEventListener("scroll", onScroll, { passive: true });
  sync();

  // A mouse wheel over a horizontal strip moves it sideways, but only while there is room, so the page still scrolls at the ends.
  const wheel = (event: WheelEvent) => {
    if (options.orientation !== "horizontal" || !options.wheelToHorizontal) return;
    if (event.ctrlKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
    const max = viewport.scrollWidth - viewport.clientWidth;
    const at = Math.abs(viewport.scrollLeft);
    if (max <= 0 || (event.deltaY < 0 && at <= 0) || (event.deltaY > 0 && at >= max - 0.5)) return;
    event.preventDefault();
    viewport.scrollLeft += event.deltaY * (getComputedStyle(viewport).direction === "rtl" ? -1 : 1);
  };
  viewport.addEventListener("wheel", wheel, { passive: false });

  /* Dragging a thumb maps pointer travel to scroll distance; pressing the track pages toward the pointer. */
  let drag: { axis: Axis; start: number; scroll: number; ratio: number } | null = null;
  const cleanups: Array<() => void> = [];
  for (const axis of ["y", "x"] as const) {
    const track = tracks[axis];
    const thumb = thumbs[axis];
    if (!track || !thumb) continue;
    const down = (event: PointerEvent) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      thumb.setPointerCapture(event.pointerId);
      const length = axis === "y" ? track.clientHeight : track.clientWidth;
      const size = axis === "y" ? thumb.offsetHeight : thumb.offsetWidth;
      const max = axis === "y" ? viewport.scrollHeight - viewport.clientHeight : viewport.scrollWidth - viewport.clientWidth;
      drag = { axis, start: axis === "y" ? event.clientY : event.clientX, scroll: axis === "y" ? viewport.scrollTop : viewport.scrollLeft, ratio: max / Math.max(1, length - size) };
      root.setAttribute("data-dragging", axis);
      viewport.style.scrollSnapType = "none";
    };
    const move = (event: PointerEvent) => {
      if (!drag) return;
      const delta = ((drag.axis === "y" ? event.clientY : event.clientX) - drag.start) * drag.ratio;
      if (drag.axis === "y") viewport.scrollTop = drag.scroll + delta;
      else viewport.scrollLeft = drag.scroll + delta;
    };
    const up = (event: PointerEvent) => {
      if (!drag) return;
      drag = null;
      if (thumb.hasPointerCapture(event.pointerId)) thumb.releasePointerCapture(event.pointerId);
      root.removeAttribute("data-dragging");
      viewport.style.scrollSnapType = "";
      wake();
    };
    const page = (event: PointerEvent) => {
      if (event.button !== 0 || event.target !== track) return;
      const rect = thumb.getBoundingClientRect();
      const before = axis === "y" ? event.clientY < rect.top : event.clientX < rect.left;
      const distance = (axis === "y" ? viewport.clientHeight : viewport.clientWidth) * 0.9 * (before ? -1 : 1);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      viewport.scrollBy({ [axis === "y" ? "top" : "left"]: distance, behavior: reduce ? "auto" : "smooth" });
    };
    thumb.addEventListener("pointerdown", down);
    thumb.addEventListener("pointermove", move);
    thumb.addEventListener("pointerup", up);
    thumb.addEventListener("pointercancel", up);
    track.addEventListener("pointerdown", page);
    cleanups.push(() => {
      thumb.removeEventListener("pointerdown", down);
      thumb.removeEventListener("pointermove", move);
      thumb.removeEventListener("pointerup", up);
      thumb.removeEventListener("pointercancel", up);
      track.removeEventListener("pointerdown", page);
    });
  }

  return {
    /** Takes new options (orientation, fade, delay) and measures again. */
    update(next: ScrollAreaOptions) {
      options = next;
      sync();
    },
    sync,
    destroy() {
      window.clearTimeout(hideTimer);
      observer.disconnect();
      mutations.disconnect();
      viewport.removeEventListener("scroll", onScroll);
      viewport.removeEventListener("wheel", wheel);
      cleanups.forEach((cleanup) => cleanup());
    },
  };
}
