import SwiftUI

public struct ManicatComboboxOption: Identifiable {
    public var id: String { value }
    public let value: String
    public let label: String
    public let disabled: Bool
    /// Extra words that match this option when searching.
    public let keywords: [String]

    public init(value: String, label: String, disabled: Bool = false, keywords: [String] = []) {
        self.value = value
        self.label = label
        self.disabled = disabled
        self.keywords = keywords
    }
}

/// Mirrors combobox.tsx / combobox.rn.tsx / combobox.vue: a text field that filters a list as you type.
public struct ManicatCombobox: View {
    public struct Styles {
        public var label: ManicatStyle = { $0 }
        public var input: ManicatStyle = { $0 }
        public var list: ManicatStyle = { $0 }
        public var option: ManicatStyle = { $0 }
        public var optionText: ManicatStyle = { $0 }
        public var empty: ManicatStyle = { $0 }
        public var hint: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @FocusState private var focused: Bool
    @State private var query: String?
    @State private var active = 0

    private let label: String
    private let options: [ManicatComboboxOption]
    @Binding private var value: String
    private let placeholder: String
    private let description: String?
    private let emptyMessage: String
    private let styles: Styles

    public init(_ label: String, options: [ManicatComboboxOption], value: Binding<String>, placeholder: String = "", description: String? = nil, emptyMessage: String = "No results", styles: Styles = Styles()) {
        self.label = label
        self.options = options
        self._value = value
        self.placeholder = placeholder
        self.description = description
        self.emptyMessage = emptyMessage
        self.styles = styles
    }

    private var results: [ManicatComboboxOption] {
        let needle = (query ?? "").trimmingCharacters(in: .whitespaces).lowercased()
        if needle.isEmpty { return options }
        return options.filter { option in ([option.label] + option.keywords).contains { $0.lowercased().contains(needle) } }
    }

    public var body: some View {
        let selected = options.first { $0.value == value }
        let shown = results

        VStack(alignment: .leading, spacing: ManicatMetrics.space.s2) {
            Text(label).font(.system(size: ManicatMetrics.textSm, weight: .medium)).foregroundStyle(tokens.foreground).manicatStyle(styles.label)
            TextField("", text: Binding(get: { query ?? selected?.label ?? "" }, set: { query = $0; active = 0 }), prompt: Text(placeholder).foregroundColor(tokens.textMuted))
                .textFieldStyle(.plain)
                .focused($focused)
                .font(.system(size: ManicatMetrics.textSm))
                .foregroundStyle(tokens.foreground)
                .padding(.horizontal, ManicatMetrics.space.s3)
                .frame(minHeight: ManicatMetrics.controlHeight.md)
                .background(tokens.surface, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
                .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(focused ? tokens.foreground : tokens.borderStrong, lineWidth: 1))
                .onSubmit { choose(shown) }
                .onKeyPress(.downArrow) { move(1, count: shown.count); return .handled }
                .onKeyPress(.upArrow) { move(-1, count: shown.count); return .handled }
                .onKeyPress(.escape) { close(); return .handled }
                .accessibilityLabel(label)
                .manicatStyle(styles.input)
            if focused {
                list(shown)
            }
            if let description {
                Text(description).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted).manicatStyle(styles.hint)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func list(_ shown: [ManicatComboboxOption]) -> some View {
        ScrollView {
            VStack(spacing: 0) {
                if shown.isEmpty {
                    Text(emptyMessage).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.textMuted).padding(ManicatMetrics.space.s3).manicatStyle(styles.empty)
                }
                ForEach(Array(shown.enumerated()), id: \.element.id) { index, option in
                    Button { pick(option) } label: {
                        HStack {
                            Text(option.label).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.foreground).manicatStyle(styles.optionText)
                            Spacer(minLength: 0)
                            if option.value == value { Text("✓").foregroundStyle(tokens.foreground) }
                        }
                        .padding(.horizontal, ManicatMetrics.space.s3)
                        .frame(minHeight: ManicatMetrics.controlHeight.sm + 4)
                        .background(index == active ? tokens.surfaceMuted : .clear, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl - 4))
                        .manicatStyle(styles.option)
                    }
                    .buttonStyle(.plain)
                    .disabled(option.disabled)
                    .opacity(option.disabled ? 0.45 : 1)
                    .onHover { inside in if inside { active = index } }
                    .accessibilityAddTraits(option.value == value ? .isSelected : [])
                }
            }
            .padding(6)
        }
        .frame(maxHeight: 260)
        .background(tokens.surface, in: RoundedRectangle(cornerRadius: 22))
        .overlay(RoundedRectangle(cornerRadius: 22).stroke(tokens.border, lineWidth: 1))
        .manicatStyle(styles.list)
    }

    private func move(_ step: Int, count: Int) {
        guard count > 0 else { return }
        active = (active + step + count) % count
    }

    private func choose(_ shown: [ManicatComboboxOption]) {
        guard shown.indices.contains(active), !shown[active].disabled else { return }
        pick(shown[active])
    }

    private func pick(_ option: ManicatComboboxOption) {
        value = option.value
        close()
    }

    private func close() {
        query = nil
        focused = false
    }
}
