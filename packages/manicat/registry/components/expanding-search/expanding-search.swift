import SwiftUI

public struct ManicatSearchItem: Identifiable {
    public let id: String
    public let title: String
    public let meta: String?
    public let group: String?
    public let keywords: [String]

    public init(id: String, title: String, meta: String? = nil, group: String? = nil, keywords: [String] = []) {
        self.id = id
        self.title = title
        self.meta = meta
        self.group = group
        self.keywords = keywords
    }
}

/// Mirrors expanding-search.tsx / expanding-search.rn.tsx / expanding-search.vue: a search icon that grows into a field with results.
/// Return opens the highlighted result and Escape folds it back.
public struct ManicatExpandingSearch: View {
    public struct Styles {
        public var trigger: ManicatStyle = { $0 }
        public var field: ManicatStyle = { $0 }
        public var input: ManicatStyle = { $0 }
        public var results: ManicatStyle = { $0 }
        public var result: ManicatStyle = { $0 }
        public var empty: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @FocusState private var focused: Bool
    @State private var expanded = false
    @State private var query = ""
    @State private var active = 0

    private let label: String
    private let items: [ManicatSearchItem]
    private let suggestions: [ManicatSearchItem]
    private let suggestionsLabel: String
    private let placeholder: String
    private let expandedWidth: CGFloat
    private let maxResults: Int
    private let emptyHint: String
    private let styles: Styles
    private let onSelect: ((ManicatSearchItem) -> Void)?
    private let onExpandedChange: ((Bool) -> Void)?

    public init(_ label: String, items: [ManicatSearchItem], suggestions: [ManicatSearchItem] = [], suggestionsLabel: String = "Recent", placeholder: String = "Search", expandedWidth: CGFloat = 360, maxResults: Int = 6, emptyHint: String = "Try a shorter word.", styles: Styles = Styles(), onSelect: ((ManicatSearchItem) -> Void)? = nil, onExpandedChange: ((Bool) -> Void)? = nil) {
        self.label = label
        self.items = items
        self.suggestions = suggestions
        self.suggestionsLabel = suggestionsLabel
        self.placeholder = placeholder
        self.expandedWidth = expandedWidth
        self.maxResults = maxResults
        self.emptyHint = emptyHint
        self.styles = styles
        self.onSelect = onSelect
        self.onExpandedChange = onExpandedChange
    }

    private var results: [ManicatSearchItem] {
        let needle = query.trimmingCharacters(in: .whitespaces).lowercased()
        if needle.isEmpty { return Array(suggestions.prefix(maxResults)) }
        return Array(items.filter { item in ([item.title, item.meta ?? "", item.group ?? ""] + item.keywords).contains { $0.lowercased().contains(needle) } }.prefix(maxResults))
    }

    public var body: some View {
        Group {
            if expanded { panel } else { trigger }
        }
        .animation(.timingCurve(0.215, 0.61, 0.355, 1, duration: 0.25), value: expanded)
    }

    private var trigger: some View {
        Button { open() } label: {
            Text("⌕").font(.system(size: 18)).foregroundStyle(tokens.foreground)
                .frame(width: ManicatMetrics.controlHeight.md, height: ManicatMetrics.controlHeight.md)
                .background(tokens.surface, in: Circle())
                .overlay(Circle().stroke(tokens.border, lineWidth: 1))
                .manicatStyle(styles.trigger)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label)
    }

    private var panel: some View {
        let shown = results

        return VStack(spacing: 0) {
            HStack(spacing: ManicatMetrics.space.s2) {
                Text("⌕").font(.system(size: 16)).foregroundStyle(tokens.textMuted)
                TextField("", text: $query, prompt: Text(placeholder).foregroundColor(tokens.textMuted))
                    .textFieldStyle(.plain)
                    .focused($focused)
                    .font(.system(size: ManicatMetrics.textSm))
                    .foregroundStyle(tokens.foreground)
                    .onChange(of: query) { _, _ in active = 0 }
                    .onSubmit { if shown.indices.contains(active) { choose(shown[active]) } }
                    .onKeyPress(.downArrow) { if !shown.isEmpty { active = (active + 1) % shown.count }; return .handled }
                    .onKeyPress(.upArrow) { if !shown.isEmpty { active = (active - 1 + shown.count) % shown.count }; return .handled }
                    .onKeyPress(.escape) { close(); return .handled }
                    .accessibilityLabel(label)
                    .manicatStyle(styles.input)
                Button { close() } label: { Text("×").font(.system(size: 16)).foregroundStyle(tokens.textMuted).frame(width: 24, height: 24) }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Close search")
            }
            .padding(.horizontal, ManicatMetrics.space.s3)
            .frame(minHeight: ManicatMetrics.controlHeight.md)
            VStack(alignment: .leading, spacing: 0) {
                if query.trimmingCharacters(in: .whitespaces).isEmpty, !suggestions.isEmpty {
                    Text(suggestionsLabel).font(.system(size: ManicatMetrics.textXs, weight: .medium)).foregroundStyle(tokens.textMuted).padding(.horizontal, ManicatMetrics.space.s3).padding(.vertical, 6)
                }
                if shown.isEmpty, !query.trimmingCharacters(in: .whitespaces).isEmpty {
                    Text(emptyHint).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.textMuted).padding(ManicatMetrics.space.s3).manicatStyle(styles.empty)
                }
                ForEach(Array(shown.enumerated()), id: \.element.id) { index, item in
                    Button { choose(item) } label: {
                        HStack {
                            Text(item.title).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.foreground)
                            Spacer(minLength: 0)
                            if let meta = item.meta { Text(meta).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted) }
                        }
                        .padding(.horizontal, ManicatMetrics.space.s3)
                        .frame(minHeight: ManicatMetrics.controlHeight.sm + 4)
                        .background(index == active ? tokens.surfaceMuted : .clear, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl - 4))
                        .contentShape(Rectangle())
                        .manicatStyle(styles.result)
                    }
                    .buttonStyle(.plain)
                    .onHover { inside in if inside { active = index } }
                }
            }
            .padding(6)
            .manicatStyle(styles.results)
        }
        .frame(width: expandedWidth)
        .background(tokens.surface, in: RoundedRectangle(cornerRadius: 26))
        .overlay(RoundedRectangle(cornerRadius: 26).stroke(tokens.border, lineWidth: 1))
        .manicatStyle(styles.field)
        .task { focused = true }
    }

    private func open() {
        expanded = true
        onExpandedChange?(true)
    }

    private func close() {
        expanded = false
        query = ""
        active = 0
        onExpandedChange?(false)
    }

    private func choose(_ item: ManicatSearchItem) {
        onSelect?(item)
        close()
    }
}
