<script lang="ts">
  import Button from "@/registry/components/button/button.svelte";
  import SegmentedControl from "@/registry/components/segmented-control/segmented-control.svelte";
  import Switch from "@/registry/components/switch/switch.svelte";

  type Plan = "team" | "studio";
  type Billing = "monthly" | "yearly";
  type Feature = { label: string; team: string; studio: string; shared?: boolean };

  interface Props {
    /** Extend the inner, named parts of the block: title, description, plan or row. */
    classNames?: { title?: string; description?: string; plan?: string; row?: string };
  }

  let { classNames }: Props = $props();

  const features: Feature[] = [
    { label: "Active projects", team: "Unlimited", studio: "Unlimited", shared: true },
    { label: "Shared workspaces", team: "1 workspace", studio: "Unlimited" },
    { label: "Guest reviewers", team: "5 per project", studio: "Unlimited" },
    { label: "Version history", team: "30 days", studio: "Unlimited" },
    { label: "Approval flows", team: "Not included", studio: "Included" },
    { label: "Custom roles", team: "Not included", studio: "Included" },
    { label: "Source exports", team: "Included", studio: "Included", shared: true },
    { label: "Support", team: "Email", studio: "Priority email" },
  ];
  const pricing: Record<Plan, Record<Billing, number>> = { team: { monthly: 13, yearly: 10 }, studio: { monthly: 27, yearly: 22 } };
  const plans: { id: Plan; name: string; tagline: string }[] = [
    { id: "team", name: "Team", tagline: "For smaller teams" },
    { id: "studio", name: "Studio", tagline: "For work across teams" },
  ];

  let billing = $state<Billing>("monthly");
  let differencesOnly = $state(false);
  let selected = $state<Plan | null>(null);
  const visible = $derived(differencesOnly ? features.filter((feature) => !feature.shared) : features);
</script>

<section class="mc-plans">
  <header class="mc-plans__intro">
    <div>
      <h2 class={["mc-plans__title", classNames?.title]}>Room for the way you work</h2>
      <p class={["mc-plans__description", classNames?.description]}>Only the details that change between plans. Switch billing to see what you would pay.</p>
    </div>
    <div class="mc-plans__billing">
      <SegmentedControl bind:value={() => billing, (next) => (billing = (next ?? "monthly") as Billing)} label="Billing period" options={[{ value: "monthly", label: "Monthly" }, { value: "yearly", label: "Yearly" }]} />
      <small>{billing === "yearly" ? "Billed yearly, save up to 23%" : "Billed month to month"}</small>
    </div>
  </header>

  <div class="mc-plans__filter">
    <span>{visible.length} of {features.length} features</span>
    <Switch bind:checked={differencesOnly} label="Show differences only" />
  </div>

  <div class="mc-plans__matrix" role="table" aria-label="Team and Studio plan comparison">
    <div class="mc-plans__head" role="row">
      <div role="columnheader" class="mc-plans__feature">What changes</div>
      {#each plans as plan (plan.id)}
        <div role="columnheader" class={["mc-plans__plan", { "mc-plans__plan--selected": selected === plan.id }, classNames?.plan]}>
          <h3>{plan.name}</h3>
          <span>{plan.tagline}</span>
          <p class="mc-plans__price" aria-live="polite">${pricing[plan.id][billing]}<small>per seat / month</small></p>
          <Button variant={selected === plan.id ? "primary" : "secondary"} size="sm" aria-pressed={selected === plan.id} onclick={() => (selected = selected === plan.id ? null : plan.id)}>
            {selected === plan.id ? "Selected" : `Select ${plan.name}`}
          </Button>
        </div>
      {/each}
    </div>
    {#each visible as feature (feature.label)}
      <div role="row" class={["mc-plans__row", classNames?.row]}>
        <div role="rowheader" class="mc-plans__feature">{feature.label}</div>
        {#each plans as plan (plan.id)}
          <div role="cell" class={["mc-plans__value", { "mc-plans__value--selected": selected === plan.id, "mc-plans__value--off": feature[plan.id] === "Not included" }]}>
            <span class="mc-plans__mobile">{plan.name}</span>
            {#if feature[plan.id] === "Included"}<span class="mc-plans__included">✓ Included</span>{:else}<span>{feature[plan.id]}</span>{/if}
          </div>
        {/each}
      </div>
    {/each}
  </div>
  <p class="mc-plans__footer">Prices in USD per seat. Yearly plans are billed annually.</p>
  <p class="mc-plans__sr" role="status" aria-live="polite">{selected ? `${selected === "team" ? "Team" : "Studio"} selected` : ""}</p>
</section>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-plans { display: grid; gap: 20px; color: var(--foreground); }
.mc-plans__intro { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 16px; }
.mc-plans__title { margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -.03em; }
.mc-plans__description { margin: 6px 0 0; max-width: 46ch; color: var(--text-secondary); font-size: var(--text-sm); }
.mc-plans__billing { display: grid; gap: 6px; justify-items: end; }
.mc-plans__billing small { color: var(--text-muted); }
.mc-plans__filter { display: flex; align-items: center; justify-content: space-between; color: var(--text-secondary); font-size: var(--text-sm); }
.mc-plans__matrix { display: grid; }
.mc-plans__head, .mc-plans__row { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 12px; align-items: start; }
.mc-plans__row { padding: 14px 0; border-top: 1px solid var(--border); font-size: var(--text-sm); }
.mc-plans__feature { font-weight: 500; }
.mc-plans__plan { position: relative; display: grid; gap: 4px; justify-items: start; border: 1px solid var(--border); border-radius: 20px; padding: 16px; background: var(--surface); transition: border-color var(--duration-standard) var(--ease-standard); }
.mc-plans__plan h3 { margin: 0; font-size: 16px; }
.mc-plans__plan span { color: var(--text-muted); font-size: var(--text-xs); }
.mc-plans__plan--selected { border-color: var(--foreground); }
.mc-plans__price { margin: 6px 0; display: grid; font-size: 30px; font-weight: 600; letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
.mc-plans__price small { color: var(--text-muted); font-size: var(--text-xs); font-weight: 400; letter-spacing: 0; }
.mc-plans__value--selected { background: var(--surface-muted); border-radius: 10px; }
.mc-plans__value--off { color: var(--text-muted); }
.mc-plans__included { color: var(--success); }
.mc-plans__mobile { display: none; color: var(--text-muted); }
.mc-plans__footer { margin: 0; color: var(--text-muted); font-size: var(--text-xs); }
.mc-plans__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
@media (max-width: 540px) {
  .mc-plans__head, .mc-plans__row { grid-template-columns: 1fr 1fr; }
  .mc-plans__feature { grid-column: 1 / -1; }
  .mc-plans__mobile { display: block; }
}
}
</style>
