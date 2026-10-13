<script lang="ts" module>
  export interface HoverCardStat {
    label: string;
    value: string | number;
  }
</script>

<script lang="ts">
  // @manicat-dependencies motion
  import { onMount } from "svelte";
  import { playPose } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  /** A person preview for `HoverCard`: portrait, name, role, a short bio, a couple of numbers, and a quiet footer line. Its rows settle in with a tiny stagger. */
  let { name, role, avatar, bio, stats = [], meta }: { name: string; /** Role and team, such as "Product designer, Payments". */ role?: string; /** A portrait URL. Initials show when it is missing. */ avatar?: string; bio?: string; stats?: HoverCardStat[]; /** A footer line, such as a location and local time. */ meta?: string } = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let root: HTMLElement;
  let image = $state<HTMLImageElement>();
  const initials = $derived(name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join(""));

  // A cached portrait shows at once; one still downloading fades in from a soft blur.
  onMount(() => {
    if (image && !image.complete) image.dataset.loading = "";
    // The rows settle in with a tiny stagger.
    if (reduced) return;
    root.querySelectorAll<HTMLElement>("[data-settle]").forEach((row) => {
      const order = Number(row.dataset.settle);
      playPose(row, { opacity: 0, y: 4 }, { opacity: 1, y: 0 }, { duration: motionTokens.duration.standard, ease: "enter", delay: 0.04 + order * motionTokens.stagger.item });
    });
  });
</script>

<div bind:this={root} class="mc-hover-card__profile">
  <div class="mc-hover-card__head" data-settle="0">
    <span class="mc-hover-card__avatar" aria-hidden="true">{#if avatar}<img bind:this={image} src={avatar} alt="" width="48" height="48" decoding="async" onload={(event) => delete (event.currentTarget as HTMLElement).dataset.loading} />{:else}<span class="mc-hover-card__initials">{initials}</span>{/if}</span>
    <span class="mc-hover-card__identity"><span class="mc-hover-card__name">{name}</span>{#if role}<span class="mc-hover-card__role">{role}</span>{/if}</span>
  </div>
  {#if bio}<p class="mc-hover-card__bio" data-settle="1">{bio}</p>{/if}
  {#if stats.length}
    <dl class="mc-hover-card__stats" data-settle="2">
      {#each stats as stat (stat.label)}<div class="mc-hover-card__stat"><dt>{stat.label}</dt><dd>{stat.value}</dd></div>{/each}
    </dl>
  {/if}
  {#if meta}<div class="mc-hover-card__meta" data-settle="3">{meta}</div>{/if}
</div>
