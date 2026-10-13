<script lang="ts" module>
  export type StepperStatus = "complete" | "current" | "upcoming" | "error";

  export interface StepperStep {
    id: string;
    label: string;
    description?: string;
    error?: string;
  }
</script>

<script lang="ts">
  interface Props {
    steps: StepperStep[];
    /** Index of the current step. A value equal to the number of steps means every step is complete. */
    current: number;
    orientation?: "horizontal" | "vertical";
    details?: "all" | "current";
    selectable?: boolean;
    label?: string;
    /** Called with the index of a completed or current step when `selectable` is on. */
    onselect?: (index: number) => void;
    /** Extend the inner, named parts of the stepper: step, marker, label, description or line. */
    classNames?: { step?: string; marker?: string; label?: string; description?: string; line?: string };
  }

  let { steps, current, orientation = "horizontal", details = "all", selectable = false, label = "Progress", onselect, classNames }: Props = $props();

  function statusOf(step: StepperStep, index: number): StepperStatus {
    return step.error ? "error" : index < current ? "complete" : index === current ? "current" : "upcoming";
  }
</script>

<ol class={["mc-stepper", `mc-stepper--${orientation}`]} aria-label={label}>
  {#each steps as step, index (step.id)}
    {@const status = statusOf(step, index)}
    <li class={["mc-stepper__step", classNames?.step]} data-status={status} aria-current={status === "current" ? "step" : undefined}>
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <svelte:element
        this={selectable && (status === "complete" || status === "current") ? "button" : "div"}
        class="mc-stepper__body"
        type={selectable ? "button" : undefined}
        onclick={() => selectable && onselect?.(index)}
      >
        <span class={["mc-stepper__marker", classNames?.marker]} aria-hidden="true">{status === "complete" ? "✓" : status === "error" ? "!" : index + 1}</span>
        <span class="mc-stepper__copy">
          <span class={["mc-stepper__label", classNames?.label]}>{step.label}</span>
          {#if (details === "all" || ["current", "error"].includes(status)) && (step.error ?? step.description)}
            <span class={["mc-stepper__description", classNames?.description]}>{step.error ?? step.description}</span>
          {/if}
        </span>
      </svelte:element>
      {#if index < steps.length - 1}<span class={["mc-stepper__line", classNames?.line]} aria-hidden="true"></span>{/if}
    </li>
  {/each}
</ol>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-stepper { display: flex; gap: 0; margin: 0; padding: 0; list-style: none; }
.mc-stepper--vertical { flex-direction: column; }
.mc-stepper__step { --mc-tone: var(--border-strong); position: relative; display: flex; flex: 1; align-items: flex-start; gap: var(--space-3); min-width: 0; }
.mc-stepper--vertical .mc-stepper__step { flex: none; flex-direction: column; padding-bottom: var(--space-4); }
.mc-stepper__step[data-status="current"] { --mc-tone: var(--foreground); } .mc-stepper__step[data-status="complete"] { --mc-tone: var(--control-on); } .mc-stepper__step[data-status="error"] { --mc-tone: var(--danger); }
.mc-stepper__body { display: flex; align-items: flex-start; gap: var(--space-3); padding: 0; border: 0; background: transparent; color: inherit; font: inherit; text-align: left; }
button.mc-stepper__body { cursor: pointer; }
.mc-stepper__marker { display: grid; flex: 0 0 auto; place-items: center; width: 26px; height: 26px; border: 1.5px solid var(--mc-tone); border-radius: 50%; background: var(--surface); color: var(--mc-tone); font-size: 12px; font-weight: 600; transition: background-color var(--duration-standard) var(--ease-standard), color var(--duration-standard) var(--ease-standard), border-color var(--duration-standard) var(--ease-standard); }
.mc-stepper__step[data-status="complete"] .mc-stepper__marker, .mc-stepper__step[data-status="error"] .mc-stepper__marker { background: var(--mc-tone); color: var(--control-glyph); }
.mc-stepper__copy { display: grid; gap: 2px; padding-top: 3px; }
.mc-stepper__label { font-size: var(--text-sm); font-weight: 500; }
.mc-stepper__step[data-status="upcoming"] .mc-stepper__label { color: var(--text-muted); }
.mc-stepper__description { color: var(--text-secondary); font-size: var(--text-xs); }
.mc-stepper__step[data-status="error"] .mc-stepper__description { color: var(--danger); }
.mc-stepper__line { position: absolute; background: var(--border); }
.mc-stepper--horizontal .mc-stepper__line { top: 13px; left: calc(26px + var(--space-3) + 4rem); right: var(--space-3); height: 2px; }
.mc-stepper--vertical .mc-stepper__line { top: 30px; bottom: 4px; left: 12px; width: 2px; }
.mc-stepper__step[data-status="complete"] .mc-stepper__line { background: var(--control-on); }
@media (prefers-reduced-motion: reduce) { .mc-stepper__marker { transition: none; } }
}
</style>
