// @manicat-dependencies motion
/**
 * The scoring and the motion of the password strength field, for the Vue and Svelte ports. Scoring happens on the device, nothing is
 * sent anywhere. The counterparts of `estimateStrength` and the motion pieces of password-strength.tsx.
 */
import { animate } from "motion";
import { motionTokens } from "./motion-tokens";

export interface PasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
  /** Characters still missing. Shown as a rolling count beside the rule while it is unmet. */
  remaining?: (password: string) => number;
}

export interface PasswordStrengthResult {
  level: 0 | 1 | 2 | 3 | 4;
  label: string;
  met: string[];
}

const count = (password: string) => Array.from(password).length;
export const defaultPasswordRules: PasswordRule[] = [
  { id: "length", label: "At least 12 characters", test: (password) => count(password) >= 12, remaining: (password) => Math.max(0, 12 - count(password)) },
  { id: "case", label: "Upper and lowercase letters", test: (password) => /\p{Ll}/u.test(password) && /\p{Lu}/u.test(password) },
  { id: "number", label: "At least one number", test: (password) => /\p{N}/u.test(password) },
  { id: "symbol", label: "At least one symbol", test: (password) => /[^\p{L}\p{N}\s]/u.test(password) },
];

const LEVELS = ["", "Weak", "Fair", "Good", "Strong"] as const;
/** Below this length a password stays at the first step, however varied its characters are. */
const SHORT = 8;

/** Scores a password on the device: one step per share of rules met, capped at the first step while it is shorter than eight characters. */
export function estimateStrength(password: string, rules: PasswordRule[] = defaultPasswordRules): PasswordStrengthResult {
  if (!password) return { level: 0, label: "", met: [] };
  const met = rules.filter((rule) => rule.test(password)).map((rule) => rule.id);
  if (count(password) < SHORT) return { level: 1, label: "Too short", met };
  const level = Math.min(4, Math.max(1, Math.round((met.length / Math.max(rules.length, 1)) * 4))) as 1 | 2 | 3 | 4;
  return { level, label: LEVELS[level], met };
}

const { duration, spring, ease } = motionTokens;
const enter = [...ease.enter] as [number, number, number, number];
const standard = [...ease.standard] as [number, number, number, number];

/** The four segments fill left to right as a wave; clearing empties right to left. */
export function moveSegments(root: HTMLElement, { level, previousLevel, reduced, instant }: { level: number; previousLevel: number; reduced: boolean; instant: boolean }) {
  root.querySelectorAll<HTMLElement>("[data-segment]").forEach((fill) => {
    const index = Number(fill.dataset.segment);
    const on = index < level;
    const wave = on ? index - previousLevel : previousLevel - 1 - index;
    const to = on ? "0%" : "-101%";
    if (instant || reduced) animate(fill, { x: to } as never, { duration: 0 });
    else animate(fill, { x: to } as never, { ...(spring.smooth as object), delay: Math.max(0, wave) * (on ? 0.05 : 0.03) } as never);
  });
}

/** The tint grows under the tick while the tick draws from its short stroke; unchecking retracts it faster than it drew. */
export function moveRuleMark(mark: HTMLElement, { met, delay, reduced, instant }: { met: boolean; delay: number; reduced: boolean; instant: boolean }) {
  const fill = mark.querySelector<HTMLElement>("[data-fill]");
  const tick = mark.querySelector<SVGPathElement>("path");
  const still = instant || reduced;
  if (fill) {
    const target = { scale: met ? 1 : 0.5, opacity: met ? 1 : 0 };
    if (still) animate(fill, target as never, { duration: 0 });
    else animate(fill, target as never, { scale: { ...(spring.snappy as object), delay }, opacity: { duration: met ? duration.fast : duration.instant, delay } } as never);
  }
  if (tick) {
    const target = { pathLength: met ? 1 : 0, opacity: met ? 1 : 0 };
    if (still) animate(tick, target as never, { duration: 0 });
    else if (met) animate(tick, target as never, { pathLength: { duration: duration.standard, ease: enter, delay: delay + 0.06 }, opacity: { duration: 0.05, delay: delay + 0.06 } } as never);
    else animate(tick, target as never, { pathLength: { duration: duration.fast, ease: standard }, opacity: { duration: duration.fast, delay: 0.06 } } as never);
  }
}
