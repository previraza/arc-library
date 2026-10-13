import SwiftUI

public enum ManicatChangelogKind: String, CaseIterable {
    case new, improved, fixed

    var label: String { rawValue.capitalized }
}

public enum ManicatChangelogMedia {
    case photo(url: URL?, alt: String, caption: String)
    case code(file: String, code: String)
}

public struct ManicatChangelogEntry: Identifiable {
    public let id: String
    /// The key of the month it belongs to, such as "2026-09".
    public let month: String
    public let date: String
    public let version: String
    public let kind: ManicatChangelogKind
    public let title: String
    public let summary: String
    public let details: [String]
    public let media: ManicatChangelogMedia?

    public init(id: String, month: String, date: String, version: String, kind: ManicatChangelogKind, title: String, summary: String, details: [String] = [], media: ManicatChangelogMedia? = nil) {
        self.id = id
        self.month = month
        self.date = date
        self.version = version
        self.kind = kind
        self.title = title
        self.summary = summary
        self.details = details
        self.media = media
    }
}

public struct ManicatChangelogMonth: Identifiable {
    public var id: String { key }
    public let key: String
    public let label: String

    public init(key: String, label: String) {
        self.key = key
        self.label = label
    }
}

/// Mirrors changelog-feed.tsx / changelog-feed.rn.tsx / changelog-feed.vue: entries grouped by month, filterable by kind, each opening
/// to its details and a photo or a code sample. The entries below are examples; pass your own.
public struct ManicatChangelogFeed: View {
    public struct Styles {
        public var title: ManicatStyle = { $0 }
        public var entry: ManicatStyle = { $0 }
        public var entryTitle: ManicatStyle = { $0 }
        public var code: ManicatStyle = { $0 }
        public init() {}
    }

    public static let exampleMonths = [
        ManicatChangelogMonth(key: "2026-09", label: "September 2026"),
        ManicatChangelogMonth(key: "2026-08", label: "August 2026"),
        ManicatChangelogMonth(key: "2026-07", label: "July 2026"),
    ]

    public static let exampleEntries = [
        ManicatChangelogEntry(id: "masonry", month: "2026-09", date: "Sep 18", version: "4.12.0", kind: .new, title: "Masonry gallery layout", summary: "Mix portrait and landscape work without cropping a single frame.", details: ["Choose two to five columns for each breakpoint.", "Drag an image and the columns rebalance while you move it."]),
        ManicatChangelogEntry(id: "resumable", month: "2026-09", date: "Sep 18", version: "4.12.0", kind: .improved, title: "Uploads resume after a dropped connection", summary: "Large uploads continue from the last finished chunk instead of starting over.", details: ["Files upload in 8 MB chunks, each retried up to five times."]),
        ManicatChangelogEntry(id: "currency", month: "2026-09", date: "Sep 9", version: "4.11.2", kind: .fixed, title: "Discount codes stay applied after a currency switch", summary: "Switching from EUR to CHF at checkout no longer clears an applied code.", details: ["Affected 0.4% of checkouts since 4.11.0."]),
        ManicatChangelogEntry(id: "webhooks", month: "2026-09", date: "Sep 2", version: "4.11.0", kind: .new, title: "Order webhooks", summary: "Receive a signed request when an order is paid, refunded, or shipped.", details: ["Every request carries a timestamped signature.", "Failed deliveries retry with backoff for 72 hours."], media: .code(file: "webhook.ts", code: "const event = verifyWebhook(body, headers, secret);\n\nif (event.type === \"order.paid\") {\n  await fulfil(event.data.order);\n}")),
        ManicatChangelogEntry(id: "avif", month: "2026-08", date: "Aug 26", version: "4.10.0", kind: .improved, title: "Product pages load 38% faster on mobile", summary: "Images now ship as AVIF with responsive sizes for each device.", details: ["Median largest paint dropped from 2.9 s to 1.8 s."]),
        ManicatChangelogEntry(id: "inventory", month: "2026-08", date: "Aug 14", version: "4.9.3", kind: .fixed, title: "Stock no longer goes negative during a sale", summary: "Concurrent checkouts now reserve inventory in a single step.", details: ["Two buyers can no longer purchase the last item at the same moment."]),
        ManicatChangelogEntry(id: "variants", month: "2026-07", date: "Jul 22", version: "4.8.0", kind: .new, title: "Variants with their own photos", summary: "Each colour or size can show its own gallery on the product page.", details: ["The page switches photos when a buyer picks a variant."]),
        ManicatChangelogEntry(id: "domains", month: "2026-07", date: "Jul 3", version: "4.7.0", kind: .improved, title: "Custom domains verify in under a minute", summary: "Add two DNS records and Halden checks them every few seconds.", details: ["Certificates are issued as soon as the records resolve."], media: .code(file: "DNS records", code: "Type    Name       Value\nCNAME   shop       edge.halden.example\nTXT     _halden    verify=hd_4f81c2")),
    ]

    @Environment(\.manicat) private var tokens
    @State private var filters: Set<ManicatChangelogKind> = []
    @State private var open: Set<String>

    private let entries: [ManicatChangelogEntry]
    private let months: [ManicatChangelogMonth]
    private let title: String
    private let subtitle: String
    private let endNote: String
    private let styles: Styles

    public init(entries: [ManicatChangelogEntry] = ManicatChangelogFeed.exampleEntries, months: [ManicatChangelogMonth] = ManicatChangelogFeed.exampleMonths, title: String = "Changelog", subtitle: String = "Halden 4.12 shipped on September 18, 2026", endNote: String = "That is everything since Halden 4.7 in July.", defaultOpen: Set<String>? = nil, styles: Styles = Styles()) {
        self.entries = entries
        self.months = months
        self.title = title
        self.subtitle = subtitle
        self.endNote = endNote
        self.styles = styles
        self._open = State(wrappedValue: defaultOpen ?? Set(entries.first.map { [$0.id] } ?? []))
    }

    private func tone(_ kind: ManicatChangelogKind) -> Color {
        switch kind {
        case .new: return tokens.success
        case .improved: return tokens.series[0]
        case .fixed: return tokens.warning
        }
    }

    public var body: some View {
        let groups = months.map { month in (month: month, items: entries.filter { (filters.isEmpty || filters.contains($0.kind)) && $0.month == month.key }) }.filter { !$0.items.isEmpty }

        VStack(alignment: .leading, spacing: 14) {
            Text(title).font(.system(size: 28, weight: .semibold)).tracking(-0.6).foregroundStyle(tokens.foreground).accessibilityAddTraits(.isHeader).manicatStyle(styles.title)
            Text(subtitle).font(.system(size: 14)).foregroundStyle(tokens.textSecondary)
            ManicatFlowLayout(spacing: 8, lineSpacing: 8) {
                ForEach(ManicatChangelogKind.allCases, id: \.self) { kind in
                    let on = filters.contains(kind)
                    Button { if on { filters.remove(kind) } else { filters.insert(kind) } } label: {
                        Text("\(kind.label) · \(entries.filter { $0.kind == kind }.count)").font(.system(size: 13)).foregroundStyle(tokens.foreground)
                            .padding(.horizontal, 12).padding(.vertical, 6)
                            .background(on ? tokens.surfaceMuted : .clear, in: Capsule())
                            .overlay(Capsule().stroke(on ? tokens.foreground : tokens.border, lineWidth: 1))
                    }
                    .buttonStyle(.plain)
                    .accessibilityAddTraits(on ? .isSelected : [])
                }
            }
            .accessibilityLabel("Filter by kind")
            ForEach(groups, id: \.month.key) { group in
                VStack(alignment: .leading, spacing: 8) {
                    Text(group.month.label.uppercased()).font(.system(size: 12, weight: .semibold)).tracking(0.6).foregroundStyle(tokens.textMuted).accessibilityAddTraits(.isHeader)
                    ForEach(group.items) { entry in entryView(entry) }
                }
            }
            if groups.isEmpty { Text("No entries match these filters.").foregroundStyle(tokens.textSecondary) }
            Text(endNote).font(.system(size: 13)).foregroundStyle(tokens.textMuted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func entryView(_ entry: ManicatChangelogEntry) -> some View {
        let isOpen = open.contains(entry.id)

        return VStack(alignment: .leading, spacing: 10) {
            Button { if isOpen { open.remove(entry.id) } else { open.insert(entry.id) } } label: {
                VStack(alignment: .leading, spacing: 4) {
                    (Text("\(entry.date) · v\(entry.version) · ").foregroundColor(tokens.textMuted) + Text(entry.kind.rawValue).fontWeight(.semibold).foregroundColor(tone(entry.kind))).font(.system(size: 12))
                    Text(entry.title).font(.system(size: 17, weight: .semibold)).foregroundStyle(tokens.foreground).multilineTextAlignment(.leading).manicatStyle(styles.entryTitle)
                    Text(entry.summary).font(.system(size: 14)).lineSpacing(3).foregroundStyle(tokens.textSecondary).multilineTextAlignment(.leading)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityAddTraits(isOpen ? .isSelected : [])
            if isOpen {
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(entry.details, id: \.self) { line in Text("• \(line)").font(.system(size: 14)).foregroundStyle(tokens.textSecondary) }
                    media(entry.media)
                }
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(tokens.surface, in: RoundedRectangle(cornerRadius: 20))
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(tokens.border, lineWidth: 1))
        .manicatStyle(styles.entry)
    }

    @ViewBuilder private func media(_ media: ManicatChangelogMedia?) -> some View {
        switch media {
        case let .photo(url, alt, caption)?:
            VStack(alignment: .leading, spacing: 4) {
                AsyncImage(url: url) { phase in
                    if let loaded = phase.image { loaded.resizable().scaledToFill() } else { tokens.surfaceMuted }
                }
                .aspectRatio(16.0 / 10, contentMode: .fit)
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .accessibilityLabel(alt)
                Text(caption).font(.system(size: 12)).foregroundStyle(tokens.textMuted)
            }
        case let .code(file, code)?:
            VStack(alignment: .leading, spacing: 4) {
                Text(file).font(.system(size: 11)).foregroundStyle(tokens.textMuted)
                Text(code).font(.system(size: 12, design: .monospaced)).foregroundStyle(tokens.foreground).textSelection(.enabled).manicatStyle(styles.code)
            }
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(tokens.surfaceMuted, in: RoundedRectangle(cornerRadius: 14))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(tokens.border, lineWidth: 1))
        case nil:
            EmptyView()
        }
    }
}
