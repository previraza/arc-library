<script lang="ts" module>
  export interface LogoMarqueeBrand {
    name: string;
    /** URL of the mark, drawn as an image. */
    icon?: string;
  }
</script>

<script lang="ts">
  import Button from "@/registry/components/button/button.svelte";

  interface Props {
    title?: string;
    description?: string;
    brands?: LogoMarqueeBrand[];
    /** Extend the inner, named parts of the block: title, description, brand or name. */
    classNames?: { title?: string; description?: string; brand?: string; name?: string };
  }

  let {
    title = "Good work moves between tools",
    description = "From the first idea to the final handoff, a familiar set of tools stays close to the work.",
    brands = ["Figma", "Linear", "Notion", "Slack", "GitHub", "Stripe", "Vercel"].map((name) => ({ name })),
    classNames,
  }: Props = $props();

  let paused = $state(false);
</script>

<section class="mc-marquee">
  <div class="mc-marquee__intro">
    <h2 class={["mc-marquee__title", classNames?.title]}>{title}</h2>
    <p class={["mc-marquee__description", classNames?.description]}>{description}</p>
  </div>
  <div class="mc-marquee__viewport" role="region" aria-label="Illustrative tool logos">
    <div class={["mc-marquee__track", { "mc-marquee__track--paused": paused }]}>
      {#each [1, 2] as copy (copy)}
        <ul class="mc-marquee__list" aria-hidden={copy === 2 || undefined}>
          {#each brands as brand, index (`${brand.name}-${index}`)}
            <li class={["mc-marquee__brand", classNames?.brand]}>
              {#if brand.icon}<img src={brand.icon} alt="" width="22" height="22" draggable="false" />{/if}
              <span class={classNames?.name}>{brand.name}</span>
            </li>
          {/each}
        </ul>
      {/each}
    </div>
  </div>
  <div class="mc-marquee__footer">
    <Button variant="ghost" size="sm" aria-label={paused ? "Play logo motion" : "Pause logo motion"} onclick={() => (paused = !paused)}>{paused ? "Play" : "Pause"}</Button>
    <span aria-live="polite">{paused ? "Motion paused" : ""}</span>
  </div>
</section>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-marquee { display: grid; gap: 20px; color: var(--foreground); }
.mc-marquee__title { margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -.03em; }
.mc-marquee__description { margin: 6px 0 0; max-width: 52ch; color: var(--text-secondary); font-size: var(--text-sm); }
.mc-marquee__viewport { overflow: hidden; mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent); }
.mc-marquee__track { display: flex; width: max-content; animation: mc-marquee 32s linear infinite; }
.mc-marquee__track--paused { animation-play-state: paused; }
.mc-marquee__list { display: flex; margin: 0; padding: 0; list-style: none; }
.mc-marquee__brand { display: flex; align-items: center; gap: 8px; padding: 12px 24px; color: var(--text-secondary); font-size: 16px; font-weight: 500; }
.mc-marquee__footer { display: flex; align-items: center; gap: 12px; color: var(--text-muted); font-size: var(--text-xs); }
@keyframes mc-marquee { to { transform: translateX(-50%); } }
@media (prefers-reduced-motion: reduce) { .mc-marquee__track { animation: none; } }
}
</style>
