import { useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { useTokens } from "@/lib/rn-tokens";

export type BlogAuthor = { name: string; avatar?: string; role?: string };
export type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  /** ISO date, used for sorting and the visible date. */
  date: string;
  /** Minutes to read. */
  readTime: number;
  author: BlogAuthor;
  image?: { src: string; alt: string };
  /** Paragraphs for the in-place reader. */
  body?: string[];
  featured?: boolean;
};

const authors: Record<string, BlogAuthor> = {
  emma: { name: "Emma Collins", role: "Product designer", avatar: "/media/people/emma-collins.jpg" },
  marcus: { name: "Marcus Johnson", role: "Frontend engineer", avatar: "/media/people/marcus-johnson.jpg" },
  jasmine: { name: "Jasmine Brooks", role: "Design lead", avatar: "/media/people/jasmine-brooks.jpg" },
  daniel: { name: "Daniel Kim", role: "Backend engineer", avatar: "/media/people/daniel-kim.jpg" },
  sofia: { name: "Sofia Ramirez", role: "Operations lead", avatar: "/media/people/sofia-ramirez.jpg" },
  chloe: { name: "Chloe Nguyen", role: "Data analyst", avatar: "/media/people/chloe-nguyen.jpg" },
  nathan: { name: "Nathan Cole", role: "Engineering manager", avatar: "/media/people/nathan-cole.jpg" },
};

const blogPosts: BlogPost[] = [
  { id: "quiet-software", featured: true, category: "Design", date: "2026-09-18", readTime: 7, author: authors.jasmine, title: "The case for quiet software", excerpt: "Why we removed half the colors from our interface and people started finishing work faster.", image: { src: "/media/photos/living-room.jpg", alt: "A bright living room with timber beams, arched windows, and cream sofas" }, body: ["Last spring we ran an experiment. We took the busiest screen in the product and removed every color that did not carry meaning. Status stayed. Selection stayed. Everything else went neutral.", "Nobody asked for it, and almost nobody noticed the change directly. What they noticed was that the screen felt easier. Task completion went up eleven percent in the first month.", "Quiet does not mean empty. It means every element has a job, and the loud moments are saved for the things that need attention."] },
  { id: "offline-sync", category: "Engineering", date: "2026-09-12", readTime: 9, author: authors.daniel, title: "How offline sync actually works", excerpt: "Conflict free replicated data, explained with the bugs we hit on the way to shipping it.", image: { src: "/media/photos/curved-facade.jpg", alt: "A white tiled building facade with curved balconies" } },
  { id: "lisbon-offsite", category: "Company", date: "2026-09-04", readTime: 4, author: authors.sofia, title: "What we learned from a week in Lisbon", excerpt: "Forty people, one shared roadmap, and no slides allowed. Notes from our autumn offsite.", image: { src: "/media/photos/lisbon-rooftops.jpg", alt: "Terracotta rooftops of Lisbon running down to the river" } },
  { id: "shared-views", category: "Product", date: "2026-08-28", readTime: 3, author: authors.emma, title: "Shared views are here", excerpt: "Save a filter, name it, and share it with your team. Everyone sees the same thing, always current.", image: { src: "/media/photos/home-office.jpg", alt: "A home office with a wooden desk and deep green walls" } },
  { id: "type-scale", category: "Design", date: "2026-08-21", readTime: 6, author: authors.jasmine, title: "Choosing a type scale you will not regret", excerpt: "Seven sizes, two weights, and the rules we use to keep them that way as the product grows.", image: { src: "/media/photos/concert-hall.jpg", alt: "Curved stainless steel panels of the Walt Disney Concert Hall against a blue sky" } },
  { id: "query-planner", category: "Engineering", date: "2026-08-14", readTime: 11, author: authors.marcus, title: "Making search ten times faster", excerpt: "A new query planner, a smarter index, and one very embarrassing N plus one we found along the way.", image: { src: "/media/photos/mountain-ridges.jpg", alt: "Layered mountain ridges under a warm evening sky" } },
  { id: "remote-rituals", category: "Company", date: "2026-08-06", readTime: 5, author: authors.nathan, title: "The rituals that keep a remote team close", excerpt: "Written standups, demo Fridays and the one meeting we will never cancel.", image: { src: "/media/photos/sunroom.jpg", alt: "A sunroom with a round dining table, plants, and windows on three sides" } },
  { id: "usage-insights", category: "Product", date: "2026-07-30", readTime: 4, author: authors.chloe, title: "Usage insights for every workspace", excerpt: "See which features your team relies on, where people get stuck, and what changed this week.", image: { src: "/media/photos/alpine-lake.jpg", alt: "A calm alpine lake reflecting a rocky peak at golden hour" } },
  { id: "motion-rules", category: "Design", date: "2026-07-22", readTime: 8, author: authors.emma, title: "Motion should explain, not decorate", excerpt: "Our rules for animation: every movement answers where something came from or where it went.", image: { src: "/media/photos/terracotta-waves.jpg", alt: "Wavy terracotta walls rising toward a blue sky" } },
  { id: "postgres-upgrade", category: "Engineering", date: "2026-07-15", readTime: 10, author: authors.daniel, title: "Upgrading Postgres with zero downtime", excerpt: "Logical replication, a dry run on a copy of production, and a cutover that took four seconds.", image: { src: "/media/photos/coastline.jpg", alt: "A long coastline with waves rolling onto a beach below green cliffs" } },
  { id: "series-b", category: "Company", date: "2026-07-08", readTime: 3, author: authors.sofia, title: "Our next chapter", excerpt: "We raised a Series B to build the calmest tool for teams. Here is what changes and what does not.", image: { src: "/media/photos/sea-at-dusk.jpg", alt: "A calm sea at dusk with a low island on the horizon" } },
  { id: "keyboard-first", category: "Product", date: "2026-06-30", readTime: 5, author: authors.marcus, title: "A keyboard shortcut for everything", excerpt: "Press question mark anywhere to see every shortcut, then make your own.", image: { src: "/media/photos/reading-chair.jpg", alt: "A grey armchair and ottoman with a knit throw in a dark green room" } },
  { id: "color-tokens", category: "Design", date: "2026-06-24", readTime: 6, author: authors.jasmine, title: "Naming color tokens by job, not by hue", excerpt: "Why surface and border beat gray-100 and gray-200, and how we migrated four hundred files.", image: { src: "/media/photos/pool-house.jpg", alt: "A modern glass house beside a long pool under a clear sky" } },
];

export interface BlogGridProps extends ViewProps {
  title?: string;
  description?: string;
  posts?: BlogPost[];
  /** Category filter labels, in order. "All" is added in front. */
  categories?: string[];
  /** Cards per page below the featured post. Defaults to 6. */
  pageSize?: number;
  /** Shows the newest post of the current filter as a large card on page one. Defaults to true. */
  showFeatured?: boolean;
  /** Prefix for relative image paths, such as your CDN origin. */
  mediaBase?: string;
  /** Called when a post opens in the reader. */
  onPostOpen?: (post: BlogPost) => void;
  /** Extend the inner, named parts of the block. The React Native counterpart of `classNames`. */
  styles?: { title?: StyleProp<TextStyle>; description?: StyleProp<TextStyle>; card?: StyleProp<ViewStyle>; cardTitle?: StyleProp<TextStyle> };
}

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const formatDate = (iso: string) => dateFormat.format(new Date(`${iso}T00:00:00Z`));

export function BlogGrid({ title = "Journal", description = "Product news, design notes and engineering deep dives from the team.", posts = blogPosts, categories = ["Product", "Design", "Engineering", "Company"], pageSize = 6, showFeatured = true, mediaBase = "", onPostOpen, style, styles: parts, ...props }: BlogGridProps) {
  const tokens = useTokens();
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [reading, setReading] = useState<BlogPost | null>(null);

  const sorted = [...posts].sort((a, b) => b.date.localeCompare(a.date));
  const filtered = category === "All" ? sorted : sorted.filter((post) => post.category === category);
  const featured = showFeatured && filtered.length > 1 ? (filtered.find((post) => post.featured) ?? filtered[0]) : null;
  const rest = featured ? filtered.filter((post) => post !== featured) : filtered;
  const pageCount = Math.max(1, Math.ceil(rest.length / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const pagePosts = rest.slice((safePage - 1) * pageSize, safePage * pageSize);

  const open = (post: BlogPost) => { onPostOpen?.(post); setReading(post); };
  const byline = (post: BlogPost) => (
    <View style={local.byline}>
      {post.author.avatar ? <Image source={{ uri: mediaBase + post.author.avatar }} alt="" style={local.avatar} /> : null}
      <Text style={{ color: tokens.foreground, fontSize: 13 }}>{post.author.name}</Text>
      <Text style={{ color: tokens.textMuted, fontSize: 13 }}>{post.readTime} min read</Text>
    </View>
  );
  const meta = (post: BlogPost) => <Text style={{ color: tokens.textMuted, fontSize: 12 }}>{post.category} · {formatDate(post.date)}</Text>;

  if (reading) {
    return (
      <View {...props} style={[local.root, style]}>
        <Pressable accessibilityRole="button" onPress={() => setReading(null)}><Text style={{ color: tokens.foreground, fontWeight: "500" }}>← All posts</Text></Pressable>
        {meta(reading)}
        <Text accessibilityRole="header" style={[local.heading, { color: tokens.foreground }]}>{reading.title}</Text>
        {byline(reading)}
        {reading.image ? <Image source={{ uri: mediaBase + reading.image.src }} alt={reading.image.alt} style={local.hero} /> : null}
        <Text style={{ color: tokens.foreground, fontSize: 16, lineHeight: 24 }}>{reading.excerpt}</Text>
        {(reading.body ?? []).map((paragraph) => <Text key={paragraph} style={{ color: tokens.textSecondary, fontSize: 15, lineHeight: 23 }}>{paragraph}</Text>)}
      </View>
    );
  }

  const card = (post: BlogPost, big = false) => (
    <Pressable key={post.id} accessibilityRole="link" onPress={() => open(post)} style={[local.card, { borderColor: tokens.border, backgroundColor: tokens.surface }, parts?.card]}>
      {post.image ? <Image source={{ uri: mediaBase + post.image.src }} alt={post.image.alt} style={big ? local.hero : local.thumb} /> : null}
      <View style={{ gap: 6, padding: 14 }}>
        {meta(post)}
        <Text style={[{ color: tokens.foreground, fontSize: big ? 22 : 17, fontWeight: "600", letterSpacing: -0.3 }, parts?.cardTitle]}>{post.title}</Text>
        <Text style={{ color: tokens.textSecondary, fontSize: 14, lineHeight: 21 }}>{post.excerpt}</Text>
        {byline(post)}
      </View>
    </Pressable>
  );

  return (
    <View {...props} accessibilityLabel={title} style={[local.root, style]}>
      <Text accessibilityRole="header" style={[local.heading, { color: tokens.foreground }, parts?.title]}>{title}</Text>
      {description ? <Text style={[{ color: tokens.textSecondary, fontSize: 14, lineHeight: 21 }, parts?.description]}>{description}</Text> : null}
      <View accessibilityLabel="Filter by category" style={local.filters}>
        {["All", ...categories].map((tab) => (
          <Pressable key={tab} accessibilityRole="button" accessibilityState={{ selected: tab === category }} onPress={() => { setCategory(tab); setPage(1); }} style={[local.filter, { borderColor: tab === category ? tokens.foreground : tokens.border, backgroundColor: tab === category ? tokens.surfaceMuted : "transparent" }]}>
            <Text style={{ color: tokens.foreground, fontSize: 13 }}>{tab}</Text>
          </Pressable>
        ))}
      </View>
      {featured && safePage === 1 ? card(featured, true) : null}
      {pagePosts.map((post) => card(post))}
      {pageCount > 1 ? (
        <View style={local.pager}>
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: safePage === 1 }} onPress={() => setPage(safePage - 1)}><Text style={{ color: safePage === 1 ? tokens.textMuted : tokens.foreground }}>← Previous</Text></Pressable>
          <Text style={{ color: tokens.textSecondary }}>Page {safePage} of {pageCount}</Text>
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: safePage === pageCount }} onPress={() => setPage(safePage + 1)}><Text style={{ color: safePage === pageCount ? tokens.textMuted : tokens.foreground }}>Next →</Text></Pressable>
        </View>
      ) : null}
    </View>
  );
}

const local = StyleSheet.create({
  root: { gap: 12 },
  heading: { fontSize: 28, fontWeight: "600", letterSpacing: -0.6 },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filter: { borderWidth: 1, borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 6 },
  card: { overflow: "hidden", borderWidth: 1, borderRadius: 24 },
  hero: { width: "100%", aspectRatio: 16 / 9 },
  thumb: { width: "100%", aspectRatio: 16 / 10 },
  byline: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatar: { width: 24, height: 24, borderRadius: 12 },
  pager: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});

export default BlogGrid;
