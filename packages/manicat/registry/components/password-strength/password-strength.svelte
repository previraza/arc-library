<script lang="ts" module>
  export interface PasswordRule {
    id: string;
    label: string;
    test: (password: string) => boolean;
  }

  export interface PasswordStrengthResult {
    level: 0 | 1 | 2 | 3 | 4;
    label: string;
    met: string[];
  }

  export const defaultPasswordRules: PasswordRule[] = [
    { id: "length", label: "At least 12 characters", test: (password) => Array.from(password).length >= 12 },
    { id: "case", label: "Upper and lowercase letters", test: (password) => /\p{Ll}/u.test(password) && /\p{Lu}/u.test(password) },
    { id: "number", label: "At least one number", test: (password) => /\p{N}/u.test(password) },
    { id: "symbol", label: "At least one symbol", test: (password) => /[^\p{L}\p{N}\s]/u.test(password) },
  ];

  const LEVELS = ["", "Weak", "Fair", "Good", "Strong"] as const;

  /** Four steps from the share of rules met; a password under eight characters never leaves the first. */
  export function estimateStrength(password: string, rules: PasswordRule[] = defaultPasswordRules): PasswordStrengthResult {
    if (!password) return { level: 0, label: "", met: [] };
    const met = rules.filter((rule) => rule.test(password)).map((rule) => rule.id);
    if (Array.from(password).length < 8) return { level: 1, label: "Too short", met };
    const level = Math.max(1, Math.min(4, Math.ceil((met.length / rules.length) * 4))) as 1 | 2 | 3 | 4;
    return { level, label: LEVELS[level], met };
  }
</script>

<script lang="ts">
  interface Props {
    label: string;
    rules?: PasswordRule[];
    error?: string;
    /** The password. Bind it with `bind:value`. */
    value?: string;
    onstrength?: (result: PasswordStrengthResult) => void;
    /** Extend the inner, named parts of the field: shell, input, toggle, meter, segment, rule or error. */
    classNames?: { shell?: string; input?: string; toggle?: string; meter?: string; segment?: string; rule?: string; error?: string };
  }

  let { label, rules = defaultPasswordRules, error, value = $bindable(""), onstrength, classNames }: Props = $props();

  let shown = $state(false);
  const id = $props.id();
  const strength = $derived(estimateStrength(value, rules));

  function onInput(event: Event) {
    value = (event.target as HTMLInputElement).value;
    onstrength?.(estimateStrength(value, rules));
  }
</script>

<div class="mc-strength" data-level={strength.level}>
  <label for={id} class="mc-strength__label">{label}</label>
  <div class={["mc-strength__shell", classNames?.shell]} data-invalid={error ? "" : undefined}>
    <input {id} {value} type={shown ? "text" : "password"} autocapitalize="none" spellcheck="false" class={["mc-strength__input", classNames?.input]} oninput={onInput} />
    <button type="button" class={["mc-strength__toggle", classNames?.toggle]} aria-pressed={shown} onclick={() => (shown = !shown)}>{shown ? "Hide" : "Show"}</button>
  </div>
  <div class={["mc-strength__meter", classNames?.meter]} role="progressbar" aria-label="Password strength" aria-valuemin="0" aria-valuemax="4" aria-valuenow={strength.level} aria-valuetext={strength.label}>
    {#each [1, 2, 3, 4] as step (step)}
      <span class={["mc-strength__segment", classNames?.segment]} data-on={step <= strength.level || undefined}></span>
    {/each}
  </div>
  <span class="mc-strength__result" aria-live="polite">{strength.label}</span>
  <ul class="mc-strength__rules">
    {#each rules as rule (rule.id)}
      <li class={classNames?.rule} data-met={strength.met.includes(rule.id) || undefined}>{strength.met.includes(rule.id) ? "✓" : "○"} {rule.label}</li>
    {/each}
  </ul>
  {#if error}<span role="alert" class={["mc-strength__error", classNames?.error]}>{error}</span>{/if}
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-strength { --mc-level: var(--border); display: grid; gap: var(--space-2); min-width: 0; }
.mc-strength[data-level="1"] { --mc-level: var(--danger); } .mc-strength[data-level="2"] { --mc-level: var(--warning); } .mc-strength[data-level="3"] { --mc-level: var(--accent); } .mc-strength[data-level="4"] { --mc-level: var(--success); }
.mc-strength__label { font-size: var(--text-sm); font-weight: 500; }
.mc-strength__shell { display: flex; align-items: center; gap: var(--space-2); min-height: var(--control-height-md); padding: 0 var(--space-3); border: 1px solid var(--border-strong); border-radius: var(--radius-control); background: var(--surface); }
.mc-strength__shell:focus-within { border-color: var(--foreground); }
.mc-strength__shell[data-invalid] { border-color: var(--danger); }
.mc-strength__input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); }
.mc-strength__toggle { border: 0; background: transparent; color: var(--text-muted); font: inherit; font-size: var(--text-xs); font-weight: 500; cursor: pointer; }
.mc-strength__meter { display: flex; gap: 4px; }
.mc-strength__segment { flex: 1; height: 4px; border-radius: 2px; background: var(--surface-muted); transition: background-color var(--duration-standard) var(--ease-standard); }
.mc-strength__segment[data-on] { background: var(--mc-level); }
.mc-strength__result { min-height: 1em; color: var(--mc-level); font-size: var(--text-xs); font-weight: 500; }
.mc-strength__rules { display: grid; gap: 2px; margin: 0; padding: 0; list-style: none; color: var(--text-muted); font-size: var(--text-xs); }
.mc-strength__rules [data-met] { color: var(--success); }
.mc-strength__error { color: var(--danger); font-size: var(--text-xs); }
@media (prefers-reduced-motion: reduce) { .mc-strength__segment { transition: none; } }
}
</style>
