import SwiftUI

public struct ManicatFilterChip: Identifiable {
    public let id: String
    public let label: String
    public let value: String?

    public init(id: String, label: String, value: String? = nil) {
        self.id = id
        self.label = label
        self.value = value
    }
}

public struct ManicatFilterOption: Identifiable {
    public var id: String { value }
    public let value: String
    public let label: String?
    public let hint: String?

    public init(_ value: String, label: String? = nil, hint: String? = nil) {
        self.value = value
        self.label = label
        self.hint = hint
    }
}

public struct ManicatFilterField: Identifiable {
    public let id: String
    public let label: String
    public let options: [ManicatFilterOption]

    public init(id: String, label: String, options: [ManicatFilterOption]) {
        self.id = id
        self.label = label
        self.options = options
    }
}

/// Mirrors filter-toolbar.tsx / filter-toolbar.rn.tsx / filter-toolbar.vue: your own controls, the active filters as removable chips,
/// an add-filter menu and Clear all. The menu is the system menu, with one submenu per field.
public struct ManicatFilterToolbar<Leading: View>: View {
    public struct Styles {
        public var chip: ManicatStyle = { $0 }
        public var remove: ManicatStyle = { $0 }
        public var add: ManicatStyle = { $0 }
        public var clear: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens

    @Binding private var filters: [ManicatFilterChip]
    private let fields: [ManicatFilterField]
    private let label: String
    private let addLabel: String
    private let styles: Styles
    private let onAdd: ((ManicatFilterChip, ManicatFilterField) -> Void)?
    private let leading: Leading

    public init(filters: Binding<[ManicatFilterChip]>, fields: [ManicatFilterField] = [], label: String = "Active filters", addLabel: String = "Add filter", styles: Styles = Styles(), onAdd: ((ManicatFilterChip, ManicatFilterField) -> Void)? = nil, @ViewBuilder leading: () -> Leading) {
        self._filters = filters
        self.fields = fields
        self.label = label
        self.addLabel = addLabel
        self.styles = styles
        self.onAdd = onAdd
        self.leading = leading()
    }

    public var body: some View {
        ManicatFlowLayout(spacing: ManicatMetrics.space.s2, lineSpacing: ManicatMetrics.space.s2) {
            leading
            ForEach(filters) { filter in
                HStack(spacing: 6) {
                    Text(filter.label).font(.system(size: ManicatMetrics.textXs, weight: .medium)).foregroundStyle(tokens.foreground)
                    Button { filters.removeAll { $0.id == filter.id } } label: {
                        Text("×").font(.system(size: 14)).foregroundStyle(tokens.textMuted).manicatStyle(styles.remove)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Remove \(filter.label)")
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 5)
                .background(tokens.surfaceMuted, in: Capsule())
                .overlay(Capsule().stroke(tokens.border, lineWidth: 1))
                .manicatStyle(styles.chip)
            }
            if !fields.isEmpty { addMenu }
            if filters.count > 1 {
                Button { filters = [] } label: {
                    Text("Clear all").font(.system(size: ManicatMetrics.textXs, weight: .medium)).foregroundStyle(tokens.textSecondary).padding(.vertical, 5).manicatStyle(styles.clear)
                }
                .buttonStyle(.plain)
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
    }

    private var addMenu: some View {
        Menu {
            ForEach(fields) { field in
                Menu {
                    ForEach(field.options) { option in
                        Button { add(option, to: field) } label: { Text(option.label ?? option.value) + Text(option.hint.map { "  \($0)" } ?? "") }
                            .disabled(filters.contains { $0.id == field.id && $0.value == option.value })
                    }
                } label: { Text(field.label) }
            }
        } label: {
            Text("+ \(addLabel)")
                .font(.system(size: ManicatMetrics.textXs, weight: .medium))
                .foregroundStyle(tokens.textSecondary)
                .padding(.horizontal, 10)
                .padding(.vertical, 5)
                .overlay(Capsule().stroke(tokens.borderStrong, style: StrokeStyle(lineWidth: 1, dash: [3, 3])))
                .manicatStyle(styles.add)
        }
        .menuStyle(.button)
        .menuIndicator(.hidden)
        .buttonStyle(.plain)
    }

    private func add(_ option: ManicatFilterOption, to field: ManicatFilterField) {
        let chip = ManicatFilterChip(id: field.id, label: option.label ?? option.value, value: option.value)
        filters = filters.filter { $0.id != chip.id } + [chip]
        onAdd?(chip, field)
    }
}

public extension ManicatFilterToolbar where Leading == EmptyView {
    init(filters: Binding<[ManicatFilterChip]>, fields: [ManicatFilterField] = [], label: String = "Active filters", addLabel: String = "Add filter", styles: Styles = Styles(), onAdd: ((ManicatFilterChip, ManicatFilterField) -> Void)? = nil) {
        self.init(filters: filters, fields: fields, label: label, addLabel: addLabel, styles: styles, onAdd: onAdd) { EmptyView() }
    }
}
