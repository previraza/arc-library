import SwiftUI

public enum ManicatFaqVariant { case accordion, columns, search }

public struct ManicatFaqItem: Identifiable {
    public var id: String
    public let question: String
    /// Plain text answer; it is also what search matches.
    public let answer: String
    public let category: String?

    public init(id: String? = nil, question: String, answer: String, category: String? = nil) {
        self.id = id ?? question
        self.question = question
        self.answer = answer
        self.category = category
    }
}

/// Mirrors faq-section.tsx / faq-section.rn.tsx / faq-section.vue: questions that open to answers, optionally grouped by topic or
/// searchable. The questions below are examples; pass your own.
public struct ManicatFaqSection: View {
    public struct Styles {
        public var title: ManicatStyle = { $0 }
        public var description: ManicatStyle = { $0 }
        public var item: ManicatStyle = { $0 }
        public var question: ManicatStyle = { $0 }
        public var answer: ManicatStyle = { $0 }
        public init() {}
    }

    public static let exampleItems = [
        ManicatFaqItem(question: "What is Manicat UI?", answer: "Manicat UI is a library of components and blocks with springs, states and details already done. You copy the source into your project, so every line is yours to change.", category: "General"),
        ManicatFaqItem(question: "Does it work with my design system?", answer: "Yes. Components read semantic tokens such as surface, border, and accent, so mapping them to your palette takes one file.", category: "General"),
        ManicatFaqItem(question: "Is reduced motion supported?", answer: "Every animation has a reduced motion branch. It keeps the final state, focus, and feedback while removing travel and looping.", category: "General"),
        ManicatFaqItem(question: "Which frameworks are supported?", answer: "React, React Native, Vue, Svelte and SwiftUI, with the same names and the same behavior in each.", category: "Technical"),
        ManicatFaqItem(question: "How do I install a component?", answer: "Run the shadcn CLI with the component name, or copy the files by hand. Each page lists the packages it needs.", category: "Technical"),
        ManicatFaqItem(question: "How do updates work?", answer: "New components and fixes ship in small releases. Run the CLI again to pull the latest version of anything you installed.", category: "Technical"),
        ManicatFaqItem(question: "Can I use Manicat UI in client projects?", answer: "Yes. Free components are MIT licensed, and a Pro license covers commercial work for you or your team.", category: "Licensing"),
        ManicatFaqItem(question: "What happens when my plan ends?", answer: "You keep every component you installed. Renewing only matters for new releases and updates.", category: "Licensing"),
    ]

    @Environment(\.manicat) private var tokens
    @State private var open: Set<String>
    @State private var category: String
    @State private var query = ""

    private let variant: ManicatFaqVariant
    private let title: String
    private let description: String?
    private let items: [ManicatFaqItem]
    private let multiple: Bool
    private let contact: (label: String, description: String?, onPress: (() -> Void)?)?
    private let styles: Styles
    private let onValueChange: ((Set<String>) -> Void)?

    public init(variant: ManicatFaqVariant = .accordion, title: String = "Frequently asked questions", description: String? = "Everything you need to know before you install your first component.", items: [ManicatFaqItem] = ManicatFaqSection.exampleItems, multiple: Bool = false, defaultValue: Set<String>? = nil, contact: (label: String, description: String?, onPress: (() -> Void)?)? = ("Still have a question?", "Write to us and a person answers.", nil), styles: Styles = Styles(), onValueChange: ((Set<String>) -> Void)? = nil) {
        self.variant = variant
        self.title = title
        self.description = description
        self.items = items
        self.multiple = multiple
        self.contact = contact
        self.styles = styles
        self.onValueChange = onValueChange
        self._open = State(wrappedValue: defaultValue ?? Set(items.first.map { [$0.id] } ?? []))
        self._category = State(wrappedValue: items.first?.category ?? "General")
    }

    private var categories: [String] {
        var seen: [String] = []
        for item in items where !seen.contains(item.category ?? "General") { seen.append(item.category ?? "General") }
        return seen
    }

    private func normalize(_ text: String) -> String { text.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: nil) }

    public var body: some View {
        let needle = normalize(query.trimmingCharacters(in: .whitespaces))
        let shown: [ManicatFaqItem] = variant == .columns
            ? items.filter { ($0.category ?? "General") == category }
            : variant == .search && !needle.isEmpty ? items.filter { normalize($0.question + " " + $0.answer).contains(needle) } : items

        VStack(alignment: .leading, spacing: 12) {
            Text(title).font(.system(size: 26, weight: .semibold)).tracking(-0.5).foregroundStyle(tokens.foreground).accessibilityAddTraits(.isHeader).manicatStyle(styles.title)
            if let description { Text(description).font(.system(size: 14)).lineSpacing(3).foregroundStyle(tokens.textSecondary).manicatStyle(styles.description) }
            if variant == .columns {
                ManicatSegmentedControl(options: categories.map { ManicatSegment(value: $0, label: $0) }, value: $category, label: "Question topics")
            }
            if variant == .search {
                ManicatSearchField("Search questions", text: $query, placeholder: "Try install, license, or motion")
                Text(needle.isEmpty ? "\(items.count) questions" : "\(shown.count) \(shown.count == 1 ? "answer" : "answers")").font(.system(size: 12)).foregroundStyle(tokens.textMuted)
            }
            VStack(spacing: 0) {
                ForEach(shown) { item in row(item) }
            }
            .overlay(alignment: .top) { Rectangle().fill(tokens.border).frame(height: 1) }
            if variant == .search, !needle.isEmpty, shown.isEmpty {
                VStack(spacing: 6) {
                    Text("No answers mention “\(query.trimmingCharacters(in: .whitespaces))”.").foregroundStyle(tokens.textSecondary)
                    Button { query = "" } label: { Text("Clear search").fontWeight(.medium).foregroundStyle(tokens.foreground) }.buttonStyle(.plain)
                }
                .frame(maxWidth: .infinity)
            }
            if let contact {
                Button { contact.onPress?() } label: {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(contact.label).fontWeight(.medium).foregroundStyle(tokens.foreground)
                            if let detail = contact.description { Text(detail).font(.system(size: 13)).foregroundStyle(tokens.textSecondary).multilineTextAlignment(.leading) }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        Text("→").foregroundStyle(tokens.foreground)
                    }
                    .padding(14)
                    .background(tokens.surfaceMuted, in: RoundedRectangle(cornerRadius: 20))
                    .overlay(RoundedRectangle(cornerRadius: 20).stroke(tokens.border, lineWidth: 1))
                }
                .buttonStyle(.plain)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func row(_ item: ManicatFaqItem) -> some View {
        let isOpen = open.contains(item.id)

        return VStack(alignment: .leading, spacing: 0) {
            Button { toggle(item.id) } label: {
                HStack(spacing: 12) {
                    Text(item.question).font(.system(size: 16, weight: .medium)).foregroundStyle(tokens.foreground).multilineTextAlignment(.leading).frame(maxWidth: .infinity, alignment: .leading).manicatStyle(styles.question)
                    Text(isOpen ? "−" : "+").font(.system(size: 20)).foregroundStyle(tokens.textMuted)
                }
                .padding(.vertical, 16)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityAddTraits(isOpen ? .isSelected : [])
            if isOpen {
                Text(item.answer).font(.system(size: 14)).lineSpacing(4).foregroundStyle(tokens.textSecondary).padding(.bottom, 16).manicatStyle(styles.answer)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(alignment: .bottom) { Rectangle().fill(tokens.border).frame(height: 1) }
        .manicatStyle(styles.item)
    }

    private func toggle(_ id: String) {
        if open.contains(id) { open.remove(id) } else if multiple { open.insert(id) } else { open = [id] }
        onValueChange?(open)
    }
}
