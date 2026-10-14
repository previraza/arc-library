/**
 * The pieces of the announcement bar that are not markup, for the Vue and Svelte ports: the key a dismissal is remembered under, and
 * the arithmetic of the countdown. The counterparts of `storageKey`, `clearAnnouncementDismissal` and `parts` in announcement-bar.tsx.
 */
export const storageKey = (id: string) => `arc-announcement:${id}`;

/** Forgets a remembered dismissal so the bar with this id shows again. */
export function clearAnnouncementDismissal(id: string) {
  try {
    window.localStorage.removeItem(storageKey(id));
  } catch {
    /* Storage can be blocked. */
  }
}

export function parts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(total / 86400), h: Math.floor((total % 86400) / 3600), m: Math.floor((total % 3600) / 60), s: total % 60 };
}
export const pad = (value: number) => String(value).padStart(2, "0");

/** Duration springs restated as stiffness and damping so a retarget keeps the velocity already in flight. */
export const physical = (visualDuration: number, bounce: number) => {
  const root = (2 * Math.PI) / (visualDuration * 1.2);
  return { type: "spring" as const, stiffness: root * root, damping: 2 * (1 - bounce) * root, mass: 1 };
};
