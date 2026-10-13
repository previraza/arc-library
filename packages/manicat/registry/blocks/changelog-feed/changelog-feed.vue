<script setup lang="ts">
import { computed, ref } from "vue";

export type ChangelogKind = "new" | "improved" | "fixed";
export type ChangelogMedia =
  | { type: "photo"; src: string; alt: string; caption: string }
  | { type: "code"; file: string; code: string };
export type ChangelogEntry = { id: string; month: string; date: string; iso: string; version: string; kind: ChangelogKind; title: string; summary: string; details: string[]; media?: ChangelogMedia };
export type ChangelogMonth = { key: string; label: string; short: string };

const kinds: { id: ChangelogKind; label: string }[] = [
  { id: "new", label: "New" },
  { id: "improved", label: "Improved" },
  { id: "fixed", label: "Fixed" },
];
const exampleMonths: ChangelogMonth[] = [
  { key: "2026-09", label: "September 2026", short: "Sep" },
  { key: "2026-08", label: "August 2026", short: "Aug" },
  { key: "2026-07", label: "July 2026", short: "Jul" },
  { key: "2026-06", label: "June 2026", short: "Jun" },
];

const webhookSnippet = `import { verifyWebhook } from "@halden/node";

const event = verifyWebhook(body, headers, secret);

if (event.type === "order.paid") {
  await fulfil(event.data.order); // ord_7Hq2Lx
}`;

const dnsSnippet = `Type    Name       Value
CNAME   shop       edge.halden.example
TXT     _halden    verify=hd_4f81c2`;

const exampleEntries: ChangelogEntry[] = [
  { id: "masonry", month: "2026-09", date: "Sep 18", iso: "2026-09-18", version: "4.12.0", kind: "new", title: "Masonry gallery layout", summary: "Mix portrait and landscape work without cropping a single frame.", details: ["Choose two to five columns for each breakpoint.", "Drag an image and the columns rebalance while you move it.", "Captions fall back to the image alt text."], media: { type: "photo", src: "/media/photos/terracotta-waves.jpg", alt: "Wavy terracotta walls rising toward a blue sky", caption: "Gallery by Oda Lindqvist Ceramics, Bergen" } },
  { id: "resumable", month: "2026-09", date: "Sep 18", iso: "2026-09-18", version: "4.12.0", kind: "improved", title: "Uploads resume after a dropped connection", summary: "Large uploads continue from the last finished chunk instead of starting over.", details: ["Files upload in 8 MB chunks, each retried up to five times.", "The upload queue survives a page reload."] },
  { id: "currency", month: "2026-09", date: "Sep 9", iso: "2026-09-09", version: "4.11.2", kind: "fixed", title: "Discount codes stay applied after a currency switch", summary: "Switching from EUR to CHF at checkout no longer clears an applied code.", details: ["Affected 0.4% of checkouts since 4.11.0.", "Totals are now recalculated on the server after every switch."] },
  { id: "webhooks", month: "2026-09", date: "Sep 2", iso: "2026-09-02", version: "4.11.0", kind: "new", title: "Order webhooks", summary: "Receive a signed request when an order is paid, refunded, or shipped.", details: ["Every request carries a timestamped signature.", "Failed deliveries retry with backoff for 72 hours."], media: { type: "code", file: "webhooks.ts", code: webhookSnippet } },
  { id: "covers", month: "2026-08", date: "Aug 26", iso: "2026-08-26", version: "4.10.0", kind: "new", title: "Journal posts with full-bleed covers", summary: "Open a story with one photograph that runs edge to edge on every screen.", details: ["Set a focal point so the crop holds on narrow phones.", "Covers load a blurred preview first, then the full image."], media: { type: "photo", src: "/media/photos/alpine-lake.jpg", alt: "A calm alpine lake reflecting a rocky peak at golden hour", caption: "Journal cover from Studio Varga, Budapest" } },
  { id: "avif", month: "2026-08", date: "Aug 26", iso: "2026-08-26", version: "4.10.0", kind: "improved", title: "Product pages load 38% faster on mobile", summary: "Images now ship as AVIF with responsive sizes for each device.", details: ["Median largest paint dropped from 2.9 s to 1.8 s.", "Older browsers still receive WebP or JPEG."] },
  { id: "inventory", month: "2026-08", date: "Aug 14", iso: "2026-08-14", version: "4.9.3", kind: "fixed", title: "Stock no longer goes negative during a sale", summary: "Concurrent checkouts now reserve inventory in a single step.", details: ["Two buyers can no longer purchase the last item at the same moment.", "Oversold orders from August 9 to 13 were refunded automatically."] },
  { id: "shortcuts", month: "2026-08", date: "Aug 5", iso: "2026-08-05", version: "4.9.0", kind: "improved", title: "Keyboard shortcuts in the editor", summary: "Move, duplicate, and publish blocks without reaching for the mouse.", details: ["Press ⌘K to open the command menu from anywhere.", "Press ⌘D to duplicate the selected block.", "Press ⇧⌘P to publish the current page."] },
  { id: "variants", month: "2026-07", date: "Jul 22", iso: "2026-07-22", version: "4.8.0", kind: "new", title: "Variants with their own photos", summary: "Each colour or size can show its own gallery on the product page.", details: ["The page switches photos when a buyer picks a variant.", "Variants without photos fall back to the product gallery."], media: { type: "photo", src: "/media/photos/wine-bar.jpg", alt: "A carafe of red wine on a bar table in evening light", caption: "Carafe, 500 ml from Ferment Lab, Lyon" } },
  { id: "timezone", month: "2026-07", date: "Jul 10", iso: "2026-07-10", version: "4.7.1", kind: "fixed", title: "Scheduled posts respect the studio time zone", summary: "A post scheduled for 09:00 in Zurich no longer goes live at 09:00 UTC.", details: ["Existing schedules were corrected on July 10.", "The scheduler now shows the time zone next to every slot."] },
  { id: "domains", month: "2026-07", date: "Jul 3", iso: "2026-07-03", version: "4.7.0", kind: "improved", title: "Custom domains verify in under a minute", summary: "Add two DNS records and Halden checks them every few seconds.", details: ["Certificates are issued as soon as the records resolve.", "Verification used to take up to an hour."], media: { type: "code", file: "DNS records", code: dnsSnippet } },
  { id: "rooms", month: "2026-06", date: "Jun 24", iso: "2026-06-24", version: "4.6.0", kind: "new", title: "Shoppable room photos", summary: "Tag products directly on an interior photo and link each tag to checkout.", details: ["Tags follow the photo when it is cropped or resized.", "Up to twelve products per photo."], media: { type: "photo", src: "/media/photos/living-room.jpg", alt: "A bright living room with timber beams, arched windows, and cream sofas", caption: "Room by Maison Aubert, Montréal" } },
  { id: "csv", month: "2026-06", date: "Jun 12", iso: "2026-06-12", version: "4.5.2", kind: "fixed", title: "CSV exports keep accented names", summary: "Names like Zoë and Håkon now open correctly in every spreadsheet app.", details: ["Exports are written as UTF-8 with a byte order mark.", "Re-export any file created since 4.5.0."] },
  { id: "search", month: "2026-06", date: "Jun 3", iso: "2026-06-03", version: "4.5.0", kind: "improved", title: "Media search understands subject and colour", summary: "Type what is in the picture and the library finds it.", details: ["Search works across 40,000 images in under 200 ms.", "Results group near-duplicates so each shot appears once."], media: { type: "photo", src: "/media/photos/sea-at-dusk.jpg", alt: "A calm sea at dusk with a low island on the horizon", caption: "Result for “sea at dusk” in the media library" } },
];

const props = withDefaults(
  defineProps<{
    entries?: ChangelogEntry[];
    months?: ChangelogMonth[];
    title?: string;
    subtitle?: string;
    endNote?: string;
    /** Ids of the entries open at first. Defaults to the newest. */
    defaultOpen?: string[];
    /** Extend the inner, named parts of the block: title, entry, entryTitle or code. */
    classNames?: { title?: string; entry?: string; entryTitle?: string; code?: string };
  }>(),
  { entries: () => exampleEntries, months: () => exampleMonths, title: "Changelog", subtitle: "Halden 4.12 shipped on September 18, 2026", endNote: "That is everything since Halden 4.5 in June." },
);

const filters = ref<ChangelogKind[]>([]);
const open = ref<string[]>(props.defaultOpen ?? (props.entries[0] ? [props.entries[0].id] : []));
const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
const count = (kind: ChangelogKind) => props.entries.filter((entry) => entry.kind === kind).length;
const groups = computed(() =>
  props.months
    .map((month) => ({ ...month, items: props.entries.filter((entry) => (filters.value.length === 0 || filters.value.includes(entry.kind)) && entry.month === month.key) }))
    .filter((group) => group.items.length > 0),
);
</script>

<template>
  <section class="mc-changelog">
    <header>
      <h2 :class="['mc-changelog__title', classNames?.title]">{{ title }}</h2>
      <p class="mc-changelog__subtitle">{{ subtitle }}</p>
    </header>
    <div class="mc-changelog__filters" role="group" aria-label="Filter by kind">
      <button v-for="kind in kinds" :key="kind.id" type="button" class="mc-changelog__chip" :aria-pressed="filters.includes(kind.id)" @click="filters = toggle(filters, kind.id)">{{ kind.label }} · {{ count(kind.id) }}</button>
    </div>
    <section v-for="group in groups" :key="group.key" class="mc-changelog__group">
      <h3 class="mc-changelog__month">{{ group.label }}</h3>
      <article v-for="entry in group.items" :key="entry.id" :class="['mc-changelog__entry', classNames?.entry]" :data-open="open.includes(entry.id) || undefined">
        <button type="button" class="mc-changelog__trigger" :aria-expanded="open.includes(entry.id)" @click="open = toggle(open, entry.id)">
          <span class="mc-changelog__meta"><time :datetime="entry.iso">{{ entry.date }}</time> · v{{ entry.version }} · <b :class="`mc-changelog__kind mc-changelog__kind--${entry.kind}`">{{ entry.kind }}</b></span>
          <span :class="['mc-changelog__entryTitle', classNames?.entryTitle]">{{ entry.title }}</span>
          <span class="mc-changelog__summary">{{ entry.summary }}</span>
        </button>
        <div v-if="open.includes(entry.id)" class="mc-changelog__details">
          <ul><li v-for="line in entry.details" :key="line">{{ line }}</li></ul>
          <figure v-if="entry.media?.type === 'photo'" class="mc-changelog__photo"><img :src="entry.media.src" :alt="entry.media.alt" loading="lazy" /><figcaption>{{ entry.media.caption }}</figcaption></figure>
          <figure v-else-if="entry.media?.type === 'code'" class="mc-changelog__codeBox"><figcaption>{{ entry.media.file }}</figcaption><pre :class="classNames?.code"><code>{{ entry.media.code }}</code></pre></figure>
        </div>
      </article>
    </section>
    <p v-if="!groups.length" class="mc-changelog__subtitle">No entries match these filters.</p>
    <p class="mc-changelog__end">{{ endNote }}</p>
  </section>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-changelog { display: grid; gap: 18px; max-width: 720px; color: var(--foreground); }
.mc-changelog__title { margin: 0; font-size: 32px; font-weight: 600; letter-spacing: -.04em; }
.mc-changelog__subtitle { margin: 6px 0 0; color: var(--text-secondary); font-size: var(--text-sm); }
.mc-changelog__filters { display: flex; flex-wrap: wrap; gap: 8px; }
.mc-changelog__chip { border: 1px solid var(--border); border-radius: var(--radius-pill); padding: 6px 12px; background: none; color: inherit; font: inherit; font-size: var(--text-sm); cursor: pointer; }
.mc-changelog__chip[aria-pressed="true"] { border-color: var(--foreground); background: var(--surface-muted); }
.mc-changelog__group { display: grid; gap: 10px; }
.mc-changelog__month { margin: 0; color: var(--text-muted); font-size: 12px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; }
.mc-changelog__entry { display: grid; gap: 10px; border: 1px solid var(--border); border-radius: 20px; padding: 16px; background: var(--surface); }
.mc-changelog__trigger { display: grid; gap: 4px; border: 0; padding: 0; background: none; color: inherit; font: inherit; text-align: start; cursor: pointer; }
.mc-changelog__meta { color: var(--text-muted); font-size: var(--text-xs); }
.mc-changelog__kind { font-weight: 600; }
.mc-changelog__kind--new { color: var(--success); }
.mc-changelog__kind--improved { color: var(--series-1, var(--accent)); }
.mc-changelog__kind--fixed { color: var(--warning); }
.mc-changelog__entryTitle { font-size: 18px; font-weight: 600; letter-spacing: -.02em; }
.mc-changelog__summary { color: var(--text-secondary); font-size: var(--text-sm); }
.mc-changelog__details { display: grid; gap: 12px; color: var(--text-secondary); font-size: var(--text-sm); }
.mc-changelog__details ul { margin: 0; padding-inline-start: 18px; }
.mc-changelog__photo, .mc-changelog__codeBox { margin: 0; display: grid; gap: 6px; }
.mc-changelog__photo img { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; border-radius: 14px; }
.mc-changelog__photo figcaption, .mc-changelog__codeBox figcaption { color: var(--text-muted); font-size: 11px; }
.mc-changelog__codeBox pre { margin: 0; overflow: auto; border: 1px solid var(--border); border-radius: 14px; padding: 12px; background: var(--surface-muted); color: var(--foreground); font-size: 12px; }
.mc-changelog__end { margin: 0; color: var(--text-muted); font-size: var(--text-xs); }
</style>
