import SwiftUI

public struct ManicatCommandItem: Identifiable {
    public let id: String
    public let label: String
    public let description: String?
    public let group: String?
    public let keywords: [String]
    public let shortcut: String?

    public init(id: String, label: String, description: String? = nil, group: String? = nil, keywords: [String] = [], shortcut: String? = nil) {
        self.id = id
        self.label = label
        self.description = description
        self.group = group
        self.keywords = keywords
        self.shortcut = shortcut
    }
}

/// Mirrors command-palette.tsx / command-palette.rn.tsx / command-palette.vue: a search field over grouped, filtered commands. The
/// arrow keys move, Return selects and Escape calls `onClose`.
public struct ManicatCommandPalette: View {
    public struct Styles {
        public var input: ManicatStyle = { $0 }
        public var list: ManicatStyle = { $0 }
        public var group: ManicatStyle = { $0 }
        public var item: ManicatStyle = { $0 }
        public var itemText: ManicatStyle = { $0 }
        public var empty: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @FocusState private var focused: Bool
    @State private var query = ""
    @State private var active = 0

    private let items: [ManicatCommandItem]
    private let placeholder: String
    private let label: String
    private let autoFocus: Bool
    private let onSelect: (ManicatCommandItem) -> Void
    private let onClose: (() -> Void)?
    private let styles: Styles

    public init(items: [ManicatCommandItem], placeholder: String = "Search commands", label: String = "Command palette", autoFocus: Bool = false, styles: Styles = Styles(), onClose: (() -> Void)? = nil, onSelect: @escaping (ManicatCommandItem) -> Void) {
        self.items = items
        self.placeholder = placeholder
        self.label = label
        self.autoFocus = autoFocus
        self.styles = styles
        self.onClose = onClose
        self.onSelect = onSelect
    }

    private var results: [ManicatCommandItem] {
        let needle = query.trimmingCharacters(in: .whitespaces).lowercased()
        if needle.isEmpty { return items }
        return items.filter { item in ([item.label, item.description ?? "", item.group ?? ""] + item.keywords).contains { $0.lowercased().contains(needle) } }
    }

    public var body: some View {
        let shown = results

        VStack(spacing: 0) {
            field(shown)
            list(shown)
        }
        .background(tokens.surface, in: RoundedRectangle(cornerRadius: 26))
        .overlay(RoundedRectangle(cornerRadius: 26).stroke(tokens.border, lineWidth: 1))
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
        .onAppear { if autoFocus { focused = true } }
    }

    private func field(_ shown: [ManicatCommandItem]) -> some View {
        TextField("", text: $query, prompt: Text(placeholder).foregroundColor(tokens.textMuted))
            .textFieldStyle(.plain)
            .focused($focused)
            .font(.system(size: ManicatMetrics.textSm))
            .foregroundStyle(tokens.foreground)
            .padding(.horizontal, ManicatMetrics.space.s4)
            .frame(minHeight: ManicatMetrics.controlHeight.md)
            .overlay(alignment: .bottom) { Rectangle().fill(tokens.border).frame(height: 1) }
            .onChange(of: query) { _, _ in active = 0 }
            .onSubmit { if shown.indices.contains(active) { onSelect(shown[active]) } }
            .onKeyPress(.downArrow) { move(1, count: shown.count); return .handled }
            .onKeyPress(.upArrow) { move(-1, count: shown.count); return .handled }
            .onKeyPress(.escape) { onClose?(); return .handled }
            .accessibilityLabel(placeholder)
            .manicatStyle(styles.input)
    }

    private func list(_ shown: [ManicatCommandItem]) -> some View {
        var groups: [String] = []
        for item in shown where !groups.contains(item.group ?? "") { groups.append(item.group ?? "") }

        return ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                if shown.isEmpty {
                    Text("No results").font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.textMuted).padding(ManicatMetrics.space.s3).manicatStyle(styles.empty)
                }
                ForEach(groups, id: \.self) { group in
                    section(group, shown)
                }
            }
            .padding(6)
        }
        .frame(maxHeight: 320)
        .manicatStyle(styles.list)
    }

    @ViewBuilder private func section(_ group: String, _ shown: [ManicatCommandItem]) -> some View {
        if !group.isEmpty {
            Text(group)
                .font(.system(size: ManicatMetrics.textXs, weight: .medium))
                .foregroundStyle(tokens.textMuted)
                .padding(.horizontal, ManicatMetrics.space.s3)
                .padding(.top, ManicatMetrics.space.s3)
                .padding(.bottom, 4)
                .manicatStyle(styles.group)
        }
        ForEach(shown.filter { ($0.group ?? "") == group }) { item in
            row(item, index: shown.firstIndex { $0.id == item.id } ?? 0)
        }
    }

    private func row(_ item: ManicatCommandItem, index: Int) -> some View {
        Button { onSelect(item) } label: {
            HStack(spacing: ManicatMetrics.space.s3) {
                VStack(alignment: .leading, spacing: 0) {
                    Text(item.label).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.foreground).manicatStyle(styles.itemText)
                    if let description = item.description {
                        Text(description).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted)
                    }
                }
                Spacer(minLength: 0)
                if let shortcut = item.shortcut { Text(shortcut).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted) }
            }
            .padding(.horizontal, ManicatMetrics.space.s3)
            .frame(minHeight: ManicatMetrics.controlHeight.md)
            .background(index == active ? tokens.surfaceMuted : .clear, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl - 4))
            .contentShape(Rectangle())
            .manicatStyle(styles.item)
        }
        .buttonStyle(.plain)
        .onHover { inside in if inside { active = index } }
    }

    private func move(_ step: Int, count: Int) {
        guard count > 0 else { return }
        active = (active + step + count) % count
    }
}
