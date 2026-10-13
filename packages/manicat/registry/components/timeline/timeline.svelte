<script lang="ts" module>
  export interface TimelineEvent {
    id: string;
    /** When it happened: a timestamp in milliseconds or an ISO string. */
    at: string | number;
    actor?: string;
    title: string;
    meta?: string;
    tone?: "neutral" | "success" | "danger";
  }
</script>

<script lang="ts">
  interface Props {
    events: TimelineEvent[];
    /** The moment relative times are measured from, in milliseconds. Pass it in so server and client agree. */
    now: number;
    label: string;
    locale?: string;
    maxHeight?: string | number;
    /** Extend the inner, named parts of the timeline: event, dot, line, title, time or meta. */
    classNames?: { event?: string; dot?: string; line?: string; title?: string; time?: string; meta?: string };
  }

  let { events, now, label, locale = "en-US", maxHeight, classNames }: Props = $props();

  const sorted = $derived([...events].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()));

  function ago(at: string | number): string {
    const seconds = Math.round((new Date(at).getTime() - now) / 1000);
    const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    for (const [unit, size] of [["day", 86400], ["hour", 3600], ["minute", 60]] as const) {
      if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
    }
    return formatter.format(seconds, "second");
  }
</script>

<ol class="mc-timeline" aria-label={label} style:max-height={typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight}>
  {#each sorted as event, index (event.id)}
    <li class={["mc-timeline__event", classNames?.event]} data-tone={event.tone ?? "neutral"}>
      <span class="mc-timeline__rail" aria-hidden="true">
        <span class={["mc-timeline__dot", classNames?.dot]}></span>
        {#if index < sorted.length - 1}<span class={["mc-timeline__line", classNames?.line]}></span>{/if}
      </span>
      <div class="mc-timeline__copy">
        <p class={["mc-timeline__title", classNames?.title]}>{#if event.actor}<strong>{event.actor}</strong>{" "}{/if}{event.title}</p>
        <time class={["mc-timeline__time", classNames?.time]} datetime={new Date(event.at).toISOString()}>{ago(event.at)}</time>
        {#if event.meta}<span class={["mc-timeline__meta", classNames?.meta]}>{event.meta}</span>{/if}
      </div>
    </li>
  {/each}
</ol>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-timeline { margin: 0; padding: 0; overflow: auto; list-style: none; }
.mc-timeline__event { --mc-tone: var(--border-strong); display: flex; gap: var(--space-3); }
.mc-timeline__event[data-tone="success"] { --mc-tone: var(--success); } .mc-timeline__event[data-tone="danger"] { --mc-tone: var(--danger); }
.mc-timeline__rail { display: flex; flex-direction: column; align-items: center; width: 12px; }
.mc-timeline__dot { width: 10px; height: 10px; margin-top: 5px; border-radius: 50%; background: var(--mc-tone); }
.mc-timeline__line { flex: 1; width: 2px; margin: 4px 0; border-radius: 1px; background: var(--border); }
.mc-timeline__copy { display: grid; flex: 1; gap: 2px; padding-bottom: var(--space-4); }
.mc-timeline__title { margin: 0; font-size: var(--text-sm); }
.mc-timeline__title strong { font-weight: 600; }
.mc-timeline__time { color: var(--text-muted); font-size: var(--text-xs); }
.mc-timeline__meta { color: var(--text-secondary); font-size: var(--text-xs); }
}
</style>
