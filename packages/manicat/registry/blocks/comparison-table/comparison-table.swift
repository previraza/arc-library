import SwiftUI

public enum ManicatComparisonValue: Equatable {
    case yes, no, partial
    case text(String)
    /// A value with a short note under it, such as "Enterprise plan".
    indirect case note(ManicatComparisonValue, String)

    var resolved: (value: ManicatComparisonValue, note: String?) {
        if case let .note(inner, text) = self { return (inner, text) }
        return (self, nil)
    }
}

public struct ManicatComparisonColumn: Identifiable {
    public let id: String
    public let name: String
    public let caption: String?
    public let highlight: Bool

    public init(id: String, name: String, caption: String? = nil, highlight: Bool = false) {
        self.id = id
        self.name = name
        self.caption = caption
        self.highlight = highlight
    }
}

public struct ManicatComparisonRow: Identifiable {
    public let id: String
    public let feature: String
    public let hint: String?
    public let values: [String: ManicatComparisonValue]

    public init(id: String, feature: String, hint: String? = nil, values: [String: ManicatComparisonValue]) {
        self.id = id
        self.feature = feature
        self.hint = hint
        self.values = values
    }
}

public struct ManicatComparisonSection: Identifiable {
    public let id: String
    public let title: String
    public let rows: [ManicatComparisonRow]

    public init(id: String, title: String, rows: [ManicatComparisonRow]) {
        self.id = id
        self.title = title
        self.rows = rows
    }
}

/// Mirrors comparison-table.tsx / comparison-table.rn.tsx / comparison-table.vue. Phones stack the table into two columns: yours beside
/// one competitor you pick. The data below is an example; pass your own.
public struct ManicatComparisonTable: View {
    public struct Styles {
        public var title: ManicatStyle = { $0 }
        public var description: ManicatStyle = { $0 }
        public var section: ManicatStyle = { $0 }
        public var row: ManicatStyle = { $0 }
        public var feature: ManicatStyle = { $0 }
        public init() {}
    }

    public static let exampleColumns = [
        ManicatComparisonColumn(id: "relay", name: "Relay", caption: "$10 per seat", highlight: true),
        ManicatComparisonColumn(id: "suite", name: "Legacy suite", caption: "$24 per seat"),
        ManicatComparisonColumn(id: "sheets", name: "Spreadsheets", caption: "Free"),
        ManicatComparisonColumn(id: "point", name: "Point tools", caption: "$16 per seat"),
    ]

    public static let exampleSections = [
        ManicatComparisonSection(id: "planning", title: "Planning", rows: [
            ManicatComparisonRow(id: "projects", feature: "Projects", values: ["relay": .text("Unlimited"), "suite": .text("Up to 50"), "sheets": .text("Unlimited"), "point": .text("Up to 10")]),
            ManicatComparisonRow(id: "roadmaps", feature: "Timelines and roadmaps", values: ["relay": .yes, "suite": .yes, "sheets": .no, "point": .note(.partial, "Timeline only")]),
            ManicatComparisonRow(id: "dependencies", feature: "Dependencies", hint: "Blocked work moves when its blocker does", values: ["relay": .yes, "suite": .yes, "sheets": .no, "point": .no]),
        ]),
        ManicatComparisonSection(id: "collaboration", title: "Collaboration", rows: [
            ManicatComparisonRow(id: "realtime", feature: "Real time editing", values: ["relay": .yes, "suite": .no, "sheets": .yes, "point": .yes]),
            ManicatComparisonRow(id: "guests", feature: "Free guest access", values: ["relay": .yes, "suite": .no, "sheets": .yes, "point": .note(.partial, "Five guests")]),
            ManicatComparisonRow(id: "comments", feature: "Comments and mentions", values: ["relay": .yes, "suite": .yes, "sheets": .yes, "point": .yes]),
            ManicatComparisonRow(id: "offline", feature: "Offline mode", hint: "Edits sync when you reconnect", values: ["relay": .yes, "suite": .no, "sheets": .note(.partial, "Desktop app only"), "point": .no]),
        ]),
        ManicatComparisonSection(id: "automation", title: "Automation", rows: [
            ManicatComparisonRow(id: "rules", feature: "Rules and triggers", values: ["relay": .yes, "suite": .yes, "sheets": .no, "point": .note(.partial, "Paid add on")]),
            ManicatComparisonRow(id: "ai", feature: "AI summaries", values: ["relay": .yes, "suite": .no, "sheets": .no, "point": .no]),
        ]),
        ManicatComparisonSection(id: "security", title: "Security", rows: [
            ManicatComparisonRow(id: "sso", feature: "SAML single sign on", values: ["relay": .yes, "suite": .yes, "sheets": .note(.partial, "Enterprise plan"), "point": .no]),
            ManicatComparisonRow(id: "audit", feature: "Audit log", values: ["relay": .yes, "suite": .yes, "sheets": .no, "point": .no]),
        ]),
    ]

    @Environment(\.manicat) private var tokens
    @State private var differencesOnly: Bool
    @State private var compareWith: String
    @State private var done = false

    private let title: String
    private let description: String?
    private let columns: [ManicatComparisonColumn]
    private let sections: [ManicatComparisonSection]
    private let cta: (label: String, doneLabel: String?, onPress: (() -> Void)?)?
    private let styles: Styles

    public init(title: String = "How Relay compares", description: String? = "Everything a growing team needs, without the enterprise price or the spreadsheet sprawl.", columns: [ManicatComparisonColumn] = ManicatComparisonTable.exampleColumns, sections: [ManicatComparisonSection] = ManicatComparisonTable.exampleSections, defaultDifferencesOnly: Bool = false, cta: (label: String, doneLabel: String?, onPress: (() -> Void)?)? = nil, styles: Styles = Styles()) {
        self.title = title
        self.description = description
        self.columns = columns
        self.sections = sections
        self.cta = cta
        self.styles = styles
        let own = columns.first { $0.highlight } ?? columns[0]
        self._differencesOnly = State(wrappedValue: defaultDifferencesOnly)
        self._compareWith = State(wrappedValue: columns.first { $0.id != own.id }?.id ?? own.id)
    }

    private var own: ManicatComparisonColumn { columns.first { $0.highlight } ?? columns[0] }
    private var others: [ManicatComparisonColumn] { columns.filter { $0.id != own.id } }
    private var visible: [ManicatComparisonColumn] { [own] + columns.filter { $0.id == compareWith && $0.id != own.id } }

    public var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title).font(.system(size: 26, weight: .semibold)).tracking(-0.5).foregroundStyle(tokens.foreground).accessibilityAddTraits(.isHeader).manicatStyle(styles.title)
            if let description { Text(description).font(.system(size: 14)).lineSpacing(3).foregroundStyle(tokens.textSecondary).manicatStyle(styles.description) }
            ManicatSwitch(isOn: $differencesOnly, label: "Only differences")
            if others.count > 1 {
                ManicatFlowLayout(spacing: 8, lineSpacing: 8) {
                    ForEach(others) { column in
                        Button { compareWith = column.id } label: {
                            Text(column.name).font(.system(size: 13)).foregroundStyle(tokens.foreground)
                                .padding(.horizontal, 12).padding(.vertical, 6)
                                .background(column.id == compareWith ? tokens.surfaceMuted : .clear, in: Capsule())
                                .overlay(Capsule().stroke(column.id == compareWith ? tokens.foreground : tokens.border, lineWidth: 1))
                        }
                        .buttonStyle(.plain)
                        .accessibilityAddTraits(column.id == compareWith ? .isSelected : [])
                    }
                }
            }
            line {
                Color.clear.frame(height: 1).layoutPriority(1.3).frame(maxWidth: .infinity)
                ForEach(visible) { column in
                    VStack(spacing: 0) {
                        Text(column.name).font(.system(size: 14, weight: .semibold)).foregroundStyle(tokens.foreground)
                        if let caption = column.caption { Text(caption).font(.system(size: 11)).foregroundStyle(tokens.textMuted) }
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            ForEach(sections) { section in
                let rows = differencesOnly ? section.rows.filter(differs) : section.rows
                if !rows.isEmpty {
                    VStack(alignment: .leading, spacing: 0) {
                        Text(section.title.uppercased()).font(.system(size: 12, weight: .semibold)).tracking(0.6).foregroundStyle(tokens.textMuted).padding(.top, 8).manicatStyle(styles.section)
                        ForEach(rows) { row in
                            line {
                                VStack(alignment: .leading, spacing: 0) {
                                    Text(row.feature).font(.system(size: 14)).foregroundStyle(tokens.foreground).manicatStyle(styles.feature)
                                    if let hint = row.hint { Text(hint).font(.system(size: 11)).foregroundStyle(tokens.textMuted) }
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                                ForEach(visible) { column in mark(row.values[column.id], color: column.id == own.id ? tokens.success : tokens.foreground).frame(maxWidth: .infinity) }
                            }
                            .overlay(alignment: .top) { Rectangle().fill(tokens.border).frame(height: 1) }
                            .manicatStyle(styles.row)
                        }
                    }
                }
            }
            if let cta {
                ManicatButton(done ? "✓ \(cta.doneLabel ?? cta.label)" : cta.label) {
                    cta.onPress?()
                    if cta.doneLabel != nil { done = true }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func line<Content: View>(@ViewBuilder _ content: () -> Content) -> some View {
        HStack(spacing: 8) { content() }.padding(.vertical, 10)
    }

    private func differs(_ row: ManicatComparisonRow) -> Bool {
        Set(visible.map { "\(row.values[$0.id]?.resolved.value ?? .no)" }).count > 1
    }

    @ViewBuilder private func mark(_ value: ManicatComparisonValue?, color: Color) -> some View {
        let resolved = (value ?? .no).resolved
        if case let .text(text) = resolved.value {
            Text(text).font(.system(size: 13)).foregroundStyle(tokens.foreground).multilineTextAlignment(.center)
        } else {
            VStack(spacing: 0) {
                Text(resolved.value == .yes ? "✓" : resolved.value == .partial ? "◐" : "–").font(.system(size: 18)).foregroundStyle(resolved.value == .no ? tokens.textMuted : color)
                    .accessibilityLabel(resolved.value == .yes ? "Included" : resolved.value == .partial ? "Partial" : "Not included")
                if let note = resolved.note { Text(note).font(.system(size: 11)).foregroundStyle(tokens.textMuted).multilineTextAlignment(.center) }
            }
        }
    }
}
