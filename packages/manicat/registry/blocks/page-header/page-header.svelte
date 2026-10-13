<script lang="ts" module>
  export type PageHeaderIssue = { id: string; title: string; owner: string; label: string };
  export type PageHeaderUpdate = { id: string; author: string; date: string; tone: "success" | "warning"; status: string; body: string };
  export type PageHeaderMilestone = { name: string; note: string; state: "done" | "active" | "planned" };
</script>

<script lang="ts">
  import AvatarGroup from "@/registry/components/avatar-group/avatar-group.svelte";
  import Badge from "@/registry/components/badge/badge.svelte";
  import Button from "@/registry/components/button/button.svelte";
  import Progress from "@/registry/components/progress/progress.svelte";
  import SegmentedControl from "@/registry/components/segmented-control/segmented-control.svelte";

  type Section = "overview" | "issues" | "updates" | "files";

const members = [
  { name: "Emma Collins", src: "/media/people/emma-collins.jpg" },
  { name: "Marcus Johnson", src: "/media/people/marcus-johnson.jpg" },
  { name: "Ava Mitchell", src: "/media/people/ava-mitchell.jpg" },
  { name: "Sofia Ramirez", src: "/media/people/sofia-ramirez.jpg" },
  { name: "Jasmine Brooks", src: "/media/people/jasmine-brooks.jpg" },
];
const sections: { value: Section; label: string }[] = [{ value: "overview", label: "Overview" }, { value: "issues", label: "Issues" }, { value: "updates", label: "Updates" }, { value: "files", label: "Files" }];
const startingIssues: PageHeaderIssue[] = [
  { id: "CHK-138", title: "Saved card list clips the expiry date on small screens", owner: "Sofia Ramirez", label: "Bug" },
  { id: "CHK-136", title: "Add an edit link beside each section of the review step", owner: "Emma Collins", label: "Design" },
  { id: "CHK-135", title: "Wallet sheet opens twice after a failed card check", owner: "Marcus Johnson", label: "Bug" },
  { id: "CHK-133", title: "Show the delivery estimate before payment", owner: "Ava Mitchell", label: "Research" },
  { id: "CHK-131", title: "Promo code field loses focus after an invalid code", owner: "Sofia Ramirez", label: "Bug" },
];
const updates: PageHeaderUpdate[] = [
  { id: "u3", author: "Ava Mitchell", date: "Sep 12", tone: "success", status: "On track", body: "Five usability sessions are done. People trust a single review step as long as the total stays visible while they edit." },
  { id: "u2", author: "Marcus Johnson", date: "Sep 5", tone: "warning", status: "At risk", body: "Card tokenization is waiting on the payments team. We moved the review step ahead so the October date can hold." },
  { id: "u1", author: "Emma Collins", date: "Aug 29", tone: "success", status: "On track", body: "Kickoff. Scope is saved cards, one review step, and a staged rollout starting October 14." },
];
const files = [
  { name: "Checkout flows v3", kind: "Design file", size: "18.4 MB", date: "Sep 20" },
  { name: "Payments API notes", kind: "Document", size: "96 KB", date: "Sep 16" },
  { name: "Rollout plan", kind: "Slides", size: "4.8 MB", date: "Sep 11" },
  { name: "Launch checklist", kind: "Document", size: "54 KB", date: "Sep 2" },
];
const milestones: PageHeaderMilestone[] = [
  { name: "Saved payment methods", note: "Shipped Sep 18", state: "done" },
  { name: "Single review step", note: "In progress, due Oct 1", state: "active" },
  { name: "Staged rollout", note: "Planned for Oct 14", state: "planned" },
];
const DONE_AT_START = 31;

  interface Props {
    title?: string;
    breadcrumbs?: string[];
    /** Called when the Share button is clicked. */
    onshare?: () => void;
    /** Extend the inner, named parts of the block: title, tabs or row. */
    classNames?: { title?: string; tabs?: string; row?: string };
  }

  let { title = "Checkout redesign", breadcrumbs = ["Projects", "Northline"], onshare, classNames }: Props = $props();

  let section = $state<Section>("overview");
  let issues = $state(startingIssues);
  let done = $state(DONE_AT_START);
  const tabs = $derived(sections.map((item) => ({ value: item.value, label: item.value === "issues" ? `Issues ${issues.length}` : item.label })));
  const toneIcon = { done: "●", active: "◐", planned: "○" };

  function complete(id: string) {
    issues = issues.filter((issue) => issue.id !== id);
    done += 1;
  }
  function reset() {
    issues = startingIssues;
    done = DONE_AT_START;
  }
</script>

<header class="mc-pageheader">
  <p class="mc-pageheader__crumbs">{breadcrumbs.join(" / ")}</p>
  <div class="mc-pageheader__row">
    <h1 class={["mc-pageheader__title", classNames?.title]}>{title}</h1>
    <Badge tone="success" size="sm">On track</Badge>
    <span class="mc-pageheader__spacer"></span>
    <AvatarGroup {members} max={4} size="sm" />
    <Button variant="secondary" size="sm" onclick={() => onshare?.()}>Share</Button>
  </div>
  <SegmentedControl bind:value={() => section, (next) => (section = (next ?? "overview") as Section)} label="Project sections" options={tabs} classNames={{ track: classNames?.tabs }} />

  {#if section === "overview"}
    <div class="mc-pageheader__panel">
      <Progress value={done} max={done + issues.length} label="{done} of {done + issues.length} issues done" showValue />
      <h2>Milestones</h2>
      <ol class="mc-pageheader__list">
        {#each milestones as item (item.name)}
          <li data-state={item.state}><span aria-hidden="true">{toneIcon[item.state]}</span><span>{item.name}</span><small>{item.note}</small></li>
        {/each}
      </ol>
    </div>
  {:else if section === "issues"}
    <div class="mc-pageheader__panel">
      {#if !issues.length}<p>Nothing left to do.</p>{/if}
      <ul class="mc-pageheader__list">
        {#each issues as issue (issue.id)}
          <li class={classNames?.row}>
            <button type="button" class="mc-pageheader__check" aria-label="Mark {issue.id} done" onclick={() => complete(issue.id)}>○</button>
            <span><small>{issue.id} · {issue.label} · {issue.owner}</small>{issue.title}</span>
          </li>
        {/each}
      </ul>
      <Button variant="ghost" size="sm" onclick={reset}>Reset</Button>
    </div>
  {:else if section === "updates"}
    <div class="mc-pageheader__panel">
      {#each updates as update (update.id)}
        <article>
          <small>{update.author} · {update.date} · <b data-tone={update.tone}>{update.status}</b></small>
          <p>{update.body}</p>
        </article>
      {/each}
    </div>
  {:else}
    <ul class="mc-pageheader__panel mc-pageheader__list">
      {#each files as file (file.name)}
        <li><span>{file.name}<small>{file.kind} · {file.size}</small></span><small>{file.date}</small></li>
      {/each}
    </ul>
  {/if}
</header>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-pageheader { display: grid; gap: 14px; color: var(--foreground); }
.mc-pageheader__crumbs { margin: 0; color: var(--text-muted); font-size: var(--text-xs); }
.mc-pageheader__row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.mc-pageheader__spacer { flex: 1; }
.mc-pageheader__title { margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -.04em; }
.mc-pageheader__panel { display: grid; gap: 12px; margin: 0; padding: 0; }
.mc-pageheader__panel h2 { margin: 0; font-size: 15px; }
.mc-pageheader__panel p { margin: 0; color: var(--text-secondary); font-size: var(--text-sm); }
.mc-pageheader__list { margin: 0; padding: 0; list-style: none; display: grid; }
.mc-pageheader__list li { display: flex; align-items: center; justify-content: space-between; gap: 10px; border-bottom: 1px solid var(--border); padding: 10px 0; font-size: var(--text-sm); }
.mc-pageheader__list li[data-state="done"] > span:first-child { color: var(--success); }
.mc-pageheader__list small, .mc-pageheader__panel small { display: block; color: var(--text-muted); font-size: 11px; }
.mc-pageheader__check { border: 0; background: none; color: var(--text-muted); font-size: 20px; cursor: pointer; }
.mc-pageheader__panel b[data-tone="success"] { color: var(--success); }
.mc-pageheader__panel b[data-tone="warning"] { color: var(--warning); }
}
</style>
