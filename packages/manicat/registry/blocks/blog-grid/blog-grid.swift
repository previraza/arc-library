import SwiftUI

public struct ManicatBlogAuthor {
    public let name: String
    public let avatar: URL?
    public let role: String?

    public init(name: String, avatar: URL? = nil, role: String? = nil) {
        self.name = name
        self.avatar = avatar
        self.role = role
    }
}

public struct ManicatBlogPost: Identifiable {
    public let id: String
    public let title: String
    public let excerpt: String
    public let category: String
    /// The date, used for sorting and the visible date.
    public let date: Date
    /// Minutes to read.
    public let readTime: Int
    public let author: ManicatBlogAuthor
    public let image: URL?
    public let imageAlt: String
    /// Paragraphs for the in-place reader.
    public let body: [String]
    public let featured: Bool

    public init(id: String, title: String, excerpt: String, category: String, date: Date, readTime: Int, author: ManicatBlogAuthor, image: URL? = nil, imageAlt: String = "", body: [String] = [], featured: Bool = false) {
        self.id = id
        self.title = title
        self.excerpt = excerpt
        self.category = category
        self.date = date
        self.readTime = readTime
        self.author = author
        self.image = image
        self.imageAlt = imageAlt
        self.body = body
        self.featured = featured
    }
}

/// Mirrors blog-grid.tsx / blog-grid.rn.tsx / blog-grid.vue: a journal with category filters, a featured post, paging and an in-place
/// reader. The posts below are examples; pass your own.
public struct ManicatBlogGrid: View {
    public struct Styles {
        public var title: ManicatStyle = { $0 }
        public var description: ManicatStyle = { $0 }
        public var card: ManicatStyle = { $0 }
        public var cardTitle: ManicatStyle = { $0 }
        public init() {}
    }

    private static func day(_ iso: String) -> Date {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone(identifier: "UTC")
        formatter.locale = Locale(identifier: "en_US_POSIX")
        return formatter.date(from: iso) ?? Date()
    }

    public static let examples: [ManicatBlogPost] = [
        ManicatBlogPost(id: "quiet-software", title: "The case for quiet software", excerpt: "Why we removed half the colors from our interface and people started finishing work faster.", category: "Design", date: day("2026-09-18"), readTime: 7, author: ManicatBlogAuthor(name: "Jasmine Brooks", role: "Design lead"), body: ["Every color in an interface asks for attention. We started by counting how many asked at once.", "After the cleanup, task completion rose and support questions about where to click dropped."], featured: true),
        ManicatBlogPost(id: "offline-sync", title: "How offline sync actually works", excerpt: "Conflict free replicated data, explained with the bugs we hit on the way to shipping it.", category: "Engineering", date: day("2026-09-12"), readTime: 9, author: ManicatBlogAuthor(name: "Daniel Kim", role: "Backend engineer")),
        ManicatBlogPost(id: "lisbon-offsite", title: "What we learned from a week in Lisbon", excerpt: "Forty people, one shared roadmap, and no slides allowed. Notes from our autumn offsite.", category: "Company", date: day("2026-09-04"), readTime: 4, author: ManicatBlogAuthor(name: "Sofia Ramirez", role: "Operations lead")),
        ManicatBlogPost(id: "shared-views", title: "Shared views are here", excerpt: "Save a filter, name it, and share it with your team. Everyone sees the same thing, always current.", category: "Product", date: day("2026-08-28"), readTime: 3, author: ManicatBlogAuthor(name: "Emma Collins", role: "Product designer")),
        ManicatBlogPost(id: "type-scale", title: "Choosing a type scale you will not regret", excerpt: "Seven sizes, two weights, and the rules we use to keep them that way as the product grows.", category: "Design", date: day("2026-08-21"), readTime: 6, author: ManicatBlogAuthor(name: "Jasmine Brooks", role: "Design lead")),
        ManicatBlogPost(id: "query-planner", title: "Making search ten times faster", excerpt: "A new query planner, a smarter index, and one very embarrassing N plus one we found along the way.", category: "Engineering", date: day("2026-08-14"), readTime: 11, author: ManicatBlogAuthor(name: "Marcus Johnson", role: "Frontend engineer")),
        ManicatBlogPost(id: "remote-rituals", title: "The rituals that keep a remote team close", excerpt: "Written standups, demo Fridays and the one meeting we will never cancel.", category: "Company", date: day("2026-08-06"), readTime: 5, author: ManicatBlogAuthor(name: "Nathan Cole", role: "Engineering manager")),
        ManicatBlogPost(id: "usage-insights", title: "Usage insights for every workspace", excerpt: "See which features your team relies on, where people get stuck, and what changed this week.", category: "Product", date: day("2026-07-30"), readTime: 4, author: ManicatBlogAuthor(name: "Chloe Nguyen", role: "Data analyst")),
    ]

    @Environment(\.manicat) private var tokens
    @State private var category = "All"
    @State private var page = 1
    @State private var reading: ManicatBlogPost?

    private let title: String
    private let description: String?
    private let posts: [ManicatBlogPost]
    private let categories: [String]
    private let pageSize: Int
    private let showFeatured: Bool
    private let styles: Styles
    private let onPostOpen: ((ManicatBlogPost) -> Void)?

    public init(title: String = "Journal", description: String? = "Product news, design notes and engineering deep dives from the team.", posts: [ManicatBlogPost] = ManicatBlogGrid.examples, categories: [String] = ["Product", "Design", "Engineering", "Company"], pageSize: Int = 6, showFeatured: Bool = true, styles: Styles = Styles(), onPostOpen: ((ManicatBlogPost) -> Void)? = nil) {
        self.title = title
        self.description = description
        self.posts = posts
        self.categories = categories
        self.pageSize = pageSize
        self.showFeatured = showFeatured
        self.styles = styles
        self.onPostOpen = onPostOpen
    }

    public var body: some View {
        if let reading { reader(reading) } else { list }
    }

    private var list: some View {
        let sorted = posts.sorted { $0.date > $1.date }
        let filtered = category == "All" ? sorted : sorted.filter { $0.category == category }
        let featured: ManicatBlogPost? = showFeatured && filtered.count > 1 ? (filtered.first { $0.featured } ?? filtered.first) : nil
        let rest = featured.map { top in filtered.filter { $0.id != top.id } } ?? filtered
        let pageCount = max(1, Int((Double(rest.count) / Double(pageSize)).rounded(.up)))
        let safePage = min(max(1, page), pageCount)
        let pagePosts = Array(rest.dropFirst((safePage - 1) * pageSize).prefix(pageSize))

        return VStack(alignment: .leading, spacing: 12) {
            Text(title).font(.system(size: 28, weight: .semibold)).tracking(-0.6).foregroundStyle(tokens.foreground).accessibilityAddTraits(.isHeader).manicatStyle(styles.title)
            if let description { Text(description).font(.system(size: 14)).lineSpacing(3).foregroundStyle(tokens.textSecondary).manicatStyle(styles.description) }
            ManicatFlowLayout(spacing: 8, lineSpacing: 8) {
                ForEach(["All"] + categories, id: \.self) { tab in
                    Button { category = tab; page = 1 } label: {
                        Text(tab).font(.system(size: 13)).foregroundStyle(tokens.foreground)
                            .padding(.horizontal, 12).padding(.vertical, 6)
                            .background(tab == category ? tokens.surfaceMuted : .clear, in: Capsule())
                            .overlay(Capsule().stroke(tab == category ? tokens.foreground : tokens.border, lineWidth: 1))
                    }
                    .buttonStyle(.plain)
                    .accessibilityAddTraits(tab == category ? .isSelected : [])
                }
            }
            .accessibilityLabel("Filter by category")
            if let featured, safePage == 1 { card(featured, big: true) }
            ForEach(pagePosts) { post in card(post, big: false) }
            if pageCount > 1 {
                HStack {
                    Button { page = safePage - 1 } label: { Text("← Previous").foregroundStyle(safePage == 1 ? tokens.textMuted : tokens.foreground) }.buttonStyle(.plain).disabled(safePage == 1)
                    Spacer(minLength: 0)
                    Text("Page \(safePage) of \(pageCount)").foregroundStyle(tokens.textSecondary)
                    Spacer(minLength: 0)
                    Button { page = safePage + 1 } label: { Text("Next →").foregroundStyle(safePage == pageCount ? tokens.textMuted : tokens.foreground) }.buttonStyle(.plain).disabled(safePage == pageCount)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(title)
    }

    private func card(_ post: ManicatBlogPost, big: Bool) -> some View {
        Button {
            onPostOpen?(post)
            reading = post
        } label: {
            VStack(alignment: .leading, spacing: 0) {
                image(post, ratio: big ? 16.0 / 9 : 16.0 / 10)
                VStack(alignment: .leading, spacing: 6) {
                    meta(post)
                    Text(post.title).font(.system(size: big ? 22 : 17, weight: .semibold)).tracking(-0.3).foregroundStyle(tokens.foreground).multilineTextAlignment(.leading).manicatStyle(styles.cardTitle)
                    Text(post.excerpt).font(.system(size: 14)).lineSpacing(3).foregroundStyle(tokens.textSecondary).multilineTextAlignment(.leading)
                    byline(post)
                }
                .padding(14)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(tokens.surface)
            .clipShape(RoundedRectangle(cornerRadius: 24))
            .overlay(RoundedRectangle(cornerRadius: 24).stroke(tokens.border, lineWidth: 1))
            .manicatStyle(styles.card)
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(.isLink)
    }

    @ViewBuilder private func image(_ post: ManicatBlogPost, ratio: CGFloat) -> some View {
        if let url = post.image {
            AsyncImage(url: url) { phase in
                if let loaded = phase.image { loaded.resizable().scaledToFill() } else { tokens.surfaceMuted }
            }
            .aspectRatio(ratio, contentMode: .fit)
            .clipped()
            .accessibilityLabel(post.imageAlt)
        }
    }

    private func meta(_ post: ManicatBlogPost) -> some View {
        Text("\(post.category) · \(post.date.formatted(.dateTime.month(.abbreviated).day().year().locale(Locale(identifier: "en_US"))))").font(.system(size: 12)).foregroundStyle(tokens.textMuted)
    }

    private func byline(_ post: ManicatBlogPost) -> some View {
        HStack(spacing: 8) {
            if let avatar = post.author.avatar { ManicatAvatar(name: post.author.name, url: avatar, size: .sm) }
            Text(post.author.name).font(.system(size: 13)).foregroundStyle(tokens.foreground)
            Text("\(post.readTime) min read").font(.system(size: 13)).foregroundStyle(tokens.textMuted)
        }
    }

    private func reader(_ post: ManicatBlogPost) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Button { reading = nil } label: { Text("← All posts").fontWeight(.medium).foregroundStyle(tokens.foreground) }.buttonStyle(.plain)
            meta(post)
            Text(post.title).font(.system(size: 28, weight: .semibold)).tracking(-0.6).foregroundStyle(tokens.foreground).accessibilityAddTraits(.isHeader)
            byline(post)
            image(post, ratio: 16.0 / 9)
            Text(post.excerpt).font(.system(size: 16)).lineSpacing(4).foregroundStyle(tokens.foreground)
            ForEach(post.body, id: \.self) { paragraph in Text(paragraph).font(.system(size: 15)).lineSpacing(4).foregroundStyle(tokens.textSecondary) }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
