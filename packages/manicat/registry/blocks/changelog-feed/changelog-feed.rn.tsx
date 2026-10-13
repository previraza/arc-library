import { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { useTokens } from "@/lib/rn-tokens";

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

export interface ChangelogFeedProps extends ViewProps {
  entries?: ChangelogEntry[];
  months?: ChangelogMonth[];
  title?: string;
  subtitle?: string;
  endNote?: string;
  /** Ids of the entries open at first. Defaults to the newest. */
  defaultOpen?: string[];
  /** Prefix for relative image paths, such as your CDN origin. */
  mediaBase?: string;
  /** Extend the inner, named parts of the block. The React Native counterpart of `classNames`. */
  styles?: { title?: StyleProp<TextStyle>; entry?: StyleProp<ViewStyle>; entryTitle?: StyleProp<TextStyle>; code?: StyleProp<TextStyle> };
}

export function ChangelogFeed({ entries = exampleEntries, months = exampleMonths, title = "Changelog", subtitle = "Halden 4.12 shipped on September 18, 2026", endNote = "That is everything since Halden 4.5 in June.", defaultOpen, mediaBase = "", style, styles: parts, ...props }: ChangelogFeedProps) {
  const tokens = useTokens();
  const [filters, setFilters] = useState<ChangelogKind[]>([]);
  const [open, setOpen] = useState<string[]>(() => defaultOpen ?? (entries[0] ? [entries[0].id] : []));
  const tone = { new: tokens.success, improved: tokens.series[0], fixed: tokens.warning };
  const groups = useMemo(
    () => months.map((month) => ({ ...month, items: entries.filter((entry) => (filters.length === 0 || filters.includes(entry.kind)) && entry.month === month.key) })).filter((group) => group.items.length > 0),
    [months, entries, filters],
  );
  const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);

  return (
    <View {...props} style={[local.root, style]}>
      <Text accessibilityRole="header" style={[local.title, { color: tokens.foreground }, parts?.title]}>{title}</Text>
      <Text style={{ color: tokens.textSecondary, fontSize: 14 }}>{subtitle}</Text>
      <View accessibilityLabel="Filter by kind" style={local.filters}>
        {kinds.map((kind) => {
          const on = filters.includes(kind.id);
          const count = entries.filter((entry) => entry.kind === kind.id).length;
          return (
            <Pressable key={kind.id} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => setFilters((current) => toggle(current, kind.id))} style={[local.chip, { borderColor: on ? tokens.foreground : tokens.border, backgroundColor: on ? tokens.surfaceMuted : "transparent" }]}>
              <Text style={{ color: tokens.foreground, fontSize: 13 }}>{kind.label} · {count}</Text>
            </Pressable>
          );
        })}
      </View>
      {groups.map((group) => (
        <View key={group.key} style={{ gap: 8 }}>
          <Text accessibilityRole="header" style={{ color: tokens.textMuted, fontSize: 12, fontWeight: "600", letterSpacing: 0.6, textTransform: "uppercase" }}>{group.label}</Text>
          {group.items.map((entry) => {
            const isOpen = open.includes(entry.id);
            return (
              <View key={entry.id} style={[local.entry, { borderColor: tokens.border, backgroundColor: tokens.surface }, parts?.entry]}>
                <Pressable accessibilityRole="button" accessibilityState={{ expanded: isOpen }} onPress={() => setOpen((current) => toggle(current, entry.id))} style={{ gap: 4 }}>
                  <Text style={{ color: tokens.textMuted, fontSize: 12 }}>{entry.date} · v{entry.version} · <Text style={{ color: tone[entry.kind], fontWeight: "600" }}>{entry.kind}</Text></Text>
                  <Text style={[{ color: tokens.foreground, fontSize: 17, fontWeight: "600" }, parts?.entryTitle]}>{entry.title}</Text>
                  <Text style={{ color: tokens.textSecondary, fontSize: 14, lineHeight: 21 }}>{entry.summary}</Text>
                </Pressable>
                {isOpen ? (
                  <View style={{ gap: 8 }}>
                    {entry.details.map((line) => <Text key={line} style={{ color: tokens.textSecondary, fontSize: 14 }}>• {line}</Text>)}
                    {entry.media?.type === "photo" ? (
                      <View style={{ gap: 4 }}>
                        <Image source={{ uri: mediaBase + entry.media.src }} alt={entry.media.alt} style={local.photo} />
                        <Text style={{ color: tokens.textMuted, fontSize: 12 }}>{entry.media.caption}</Text>
                      </View>
                    ) : null}
                    {entry.media?.type === "code" ? (
                      <View style={[local.code, { backgroundColor: tokens.surfaceMuted, borderColor: tokens.border }]}>
                        <Text style={{ color: tokens.textMuted, fontSize: 11 }}>{entry.media.file}</Text>
                        <Text selectable style={[{ color: tokens.foreground, fontFamily: "monospace", fontSize: 12 }, parts?.code]}>{entry.media.code}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      ))}
      {groups.length === 0 ? <Text style={{ color: tokens.textSecondary }}>No entries match these filters.</Text> : null}
      <Text style={{ color: tokens.textMuted, fontSize: 13 }}>{endNote}</Text>
    </View>
  );
}

const local = StyleSheet.create({
  root: { gap: 14 },
  title: { fontSize: 28, fontWeight: "600", letterSpacing: -0.6 },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 6 },
  entry: { gap: 10, borderWidth: 1, borderRadius: 20, padding: 14 },
  photo: { width: "100%", aspectRatio: 16 / 10, borderRadius: 14 },
  code: { gap: 4, borderWidth: 1, borderRadius: 14, padding: 12 },
});

export default ChangelogFeed;
