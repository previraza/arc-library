import SwiftUI

public struct ManicatMorphOption: Identifiable {
    public var id: String { value }
    public let value: String
    public let label: String
    public let icon: AnyView?
    /// Short trailing detail such as an offset or a count.
    public let meta: String?
    /// Extra words that match this option when searching.
    public let keywords: String
    public let disabled: Bool

    public init(value: String, label: String, meta: String? = nil, keywords: String = "", disabled: Bool = false, icon: AnyView? = nil) {
        self.value = value
        self.label = label
        self.meta = meta
        self.keywords = keywords
        self.disabled = disabled
        self.icon = icon
    }
}

public struct ManicatMorphGroup: Identifiable {
    public var id: String { label }
    public let label: String
    public let options: [ManicatMorphOption]

    public init(_ label: String = "", options: [ManicatMorphOption]) {
        self.label = label
        self.options = options
    }
}

/// Mirrors morph-select.tsx / morph-select.rn.tsx / morph-select.vue: a pill that opens a grouped, searchable list.
public struct ManicatMorphSelect: View {
    public struct Styles {
        public var trigger: ManicatStyle = { $0 }
        public var valueText: ManicatStyle = { $0 }
        public var content: ManicatStyle = { $0 }
        public var group: ManicatStyle = { $0 }
        public var option: ManicatStyle = { $0 }
        public var optionText: ManicatStyle = { $0 }
        public var meta: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @Environment(\.isEnabled) private var enabled
    @State private var open = false
    @State private var query = ""

    private let label: String
    private let groups: [ManicatMorphGroup]
    @Binding private var value: String?
    private let placeholder: String
    private let searchable: Bool?
    private let searchPlaceholder: String
    private let styles: Styles

    /// `searchable` nil shows the search box from eight options up.
    public init(_ label: String, groups: [ManicatMorphGroup], value: Binding<String?>, placeholder: String = "Select…", searchable: Bool? = nil, searchPlaceholder: String = "Search", styles: Styles = Styles()) {
        self.label = label
        self.groups = groups
        self._value = value
        self.placeholder = placeholder
        self.searchable = searchable
        self.searchPlaceholder = searchPlaceholder
        self.styles = styles
    }

    public var body: some View {
        let all = groups.flatMap(\.options)
        let selected = all.first { $0.value == value }

        Button { open = true } label: {
            HStack(spacing: ManicatMetrics.space.s2) {
                selected?.icon
                Text(selected?.label ?? placeholder)
                    .font(.system(size: ManicatMetrics.textSm, weight: .medium))
                    .foregroundStyle(selected == nil ? tokens.textMuted : tokens.foreground)
                    .manicatStyle(styles.valueText)
                Text("⌄").font(.system(size: 14)).foregroundStyle(tokens.textMuted)
            }
            .padding(.horizontal, ManicatMetrics.space.s3)
            .frame(minHeight: ManicatMetrics.controlHeight.sm)
            .background(tokens.surface, in: Capsule())
            .overlay(Capsule().stroke(tokens.border, lineWidth: 1))
            .opacity(enabled ? 1 : 0.5)
            .manicatStyle(styles.trigger)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label)
        .accessibilityValue(selected?.label ?? placeholder)
        .popover(isPresented: $open) { list(all: all) }
    }

    private func list(all: [ManicatMorphOption]) -> some View {
        let needle = query.trimmingCharacters(in: .whitespaces).lowercased()
        let visible = groups.map { group in
            ManicatMorphGroup(group.label, options: group.options.filter { option in needle.isEmpty || [option.label, option.meta ?? "", option.keywords].contains { $0.lowercased().contains(needle) } })
        }.filter { !$0.options.isEmpty }

        return VStack(spacing: 0) {
            if searchable ?? (all.count >= 8) {
                TextField("", text: $query, prompt: Text(searchPlaceholder).foregroundColor(tokens.textMuted))
                    .textFieldStyle(.plain)
                    .font(.system(size: ManicatMetrics.textSm))
                    .foregroundStyle(tokens.foreground)
                    .padding(.horizontal, ManicatMetrics.space.s4)
                    .frame(minHeight: ManicatMetrics.controlHeight.md)
                    .overlay(alignment: .bottom) { Rectangle().fill(tokens.border).frame(height: 1) }
                    .accessibilityLabel(searchPlaceholder)
            }
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    ForEach(visible) { group in
                        if !group.label.isEmpty {
                            Text(group.label)
                                .font(.system(size: ManicatMetrics.textXs, weight: .medium))
                                .foregroundStyle(tokens.textMuted)
                                .padding(.horizontal, ManicatMetrics.space.s4)
                                .padding(.top, ManicatMetrics.space.s3)
                                .padding(.bottom, 4)
                                .manicatStyle(styles.group)
                        }
                        ForEach(group.options) { option in
                            Button { value = option.value; open = false; query = "" } label: {
                                HStack(spacing: ManicatMetrics.space.s3) {
                                    option.icon
                                    Text(option.label).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.foreground).manicatStyle(styles.optionText)
                                    Spacer(minLength: 0)
                                    if let meta = option.meta {
                                        Text(meta).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted).manicatStyle(styles.meta)
                                    }
                                    if option.value == value { Text("✓").foregroundStyle(tokens.foreground) }
                                }
                                .padding(.horizontal, ManicatMetrics.space.s4)
                                .frame(minHeight: ManicatMetrics.controlHeight.md)
                                .contentShape(Rectangle())
                                .manicatStyle(styles.option)
                            }
                            .buttonStyle(.plain)
                            .disabled(option.disabled)
                            .opacity(option.disabled ? 0.45 : 1)
                            .accessibilityAddTraits(option.value == value ? .isSelected : [])
                        }
                    }
                    if visible.isEmpty {
                        Text("No results.").font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.textMuted).padding(ManicatMetrics.space.s4)
                    }
                }
            }
        }
        .frame(minWidth: 260, maxHeight: 360)
        .background(tokens.surface)
        .manicatStyle(styles.content)
        .presentationCompactAdaptation(.popover)
    }
}
