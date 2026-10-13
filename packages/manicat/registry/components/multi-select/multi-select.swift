import SwiftUI

public struct ManicatMultiSelectOption: Identifiable {
    public var id: String { value }
    public let value: String
    public let label: String
    public let disabled: Bool

    public init(value: String, label: String, disabled: Bool = false) {
        self.value = value
        self.label = label
        self.disabled = disabled
    }
}

/// Mirrors multi-select.tsx / multi-select.rn.tsx / multi-select.vue: a field that shows what is chosen as chips and opens a list of
/// checkboxes.
public struct ManicatMultiSelect: View {
    public struct Styles {
        public var label: ManicatStyle = { $0 }
        public var trigger: ManicatStyle = { $0 }
        public var chip: ManicatStyle = { $0 }
        public var content: ManicatStyle = { $0 }
        public var item: ManicatStyle = { $0 }
        public var hint: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @Environment(\.isEnabled) private var enabled
    @State private var open = false

    private let label: String
    private let options: [ManicatMultiSelectOption]
    @Binding private var value: Set<String>
    private let placeholder: String
    private let description: String?
    private let maxVisible: Int
    private let styles: Styles

    public init(_ label: String, options: [ManicatMultiSelectOption], value: Binding<Set<String>>, placeholder: String = "Select options", description: String? = nil, maxVisible: Int = 2, styles: Styles = Styles()) {
        self.label = label
        self.options = options
        self._value = value
        self.placeholder = placeholder
        self.description = description
        self.maxVisible = maxVisible
        self.styles = styles
    }

    public var body: some View {
        let chosen = options.filter { value.contains($0.value) }

        VStack(alignment: .leading, spacing: ManicatMetrics.space.s2) {
            Text(label).font(.system(size: ManicatMetrics.textSm, weight: .medium)).foregroundStyle(tokens.foreground).manicatStyle(styles.label)
            Button { open = true } label: {
                HStack(spacing: ManicatMetrics.space.s3) {
                    ManicatFlowLayout(spacing: 6, lineSpacing: 6) {
                        if chosen.isEmpty {
                            Text(placeholder).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.textMuted)
                        }
                        ForEach(chosen.prefix(maxVisible)) { option in
                            Text(option.label)
                                .font(.system(size: ManicatMetrics.textXs, weight: .medium))
                                .foregroundStyle(tokens.foreground)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 2)
                                .background(tokens.surfaceMuted, in: Capsule())
                                .overlay(Capsule().stroke(tokens.border, lineWidth: 1))
                                .manicatStyle(styles.chip)
                        }
                        if chosen.count > maxVisible {
                            Text("+\(chosen.count - maxVisible)").font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textSecondary)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    Text("⌄").font(.system(size: 14)).foregroundStyle(tokens.textMuted)
                }
                .padding(.horizontal, ManicatMetrics.space.s3)
                .padding(.vertical, 6)
                .frame(minHeight: ManicatMetrics.controlHeight.md)
                .background(tokens.surface, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
                .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(tokens.borderStrong, lineWidth: 1))
                .opacity(enabled ? 1 : 0.5)
                .manicatStyle(styles.trigger)
            }
            .buttonStyle(.plain)
            .accessibilityLabel(label)
            .accessibilityValue(chosen.isEmpty ? placeholder : chosen.map(\.label).joined(separator: ", "))
            .popover(isPresented: $open) { list }
            if let description {
                Text(description).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted).manicatStyle(styles.hint)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var list: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(spacing: 0) {
                    ForEach(options) { option in
                        let on = value.contains(option.value)
                        Button { toggle(option.value) } label: {
                            HStack(spacing: ManicatMetrics.space.s3) {
                                RoundedRectangle(cornerRadius: 5)
                                    .fill(on ? tokens.controlOn : tokens.surface)
                                    .overlay(RoundedRectangle(cornerRadius: 5).stroke(on ? tokens.controlOn : tokens.borderStrong, lineWidth: 1))
                                    .overlay { if on { Text("✓").font(.system(size: 11, weight: .bold)).foregroundStyle(tokens.controlThumbOn) } }
                                    .frame(width: 18, height: 18)
                                Text(option.label).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.foreground)
                                Spacer(minLength: 0)
                            }
                            .padding(.horizontal, ManicatMetrics.space.s4)
                            .frame(minHeight: ManicatMetrics.controlHeight.md)
                            .contentShape(Rectangle())
                            .manicatStyle(styles.item)
                        }
                        .buttonStyle(.plain)
                        .disabled(option.disabled)
                        .opacity(option.disabled ? 0.45 : 1)
                        .accessibilityAddTraits(on ? .isSelected : [])
                    }
                }
            }
            Button { open = false } label: {
                Text("Done").font(.system(size: ManicatMetrics.textSm, weight: .medium)).foregroundStyle(tokens.foreground).frame(maxWidth: .infinity, minHeight: ManicatMetrics.controlHeight.md)
            }
            .buttonStyle(.plain)
            .overlay(alignment: .top) { Rectangle().fill(tokens.border).frame(height: 1) }
        }
        .frame(minWidth: 260, maxHeight: 420)
        .background(tokens.surface)
        .manicatStyle(styles.content)
        .presentationCompactAdaptation(.popover)
    }

    private func toggle(_ option: String) {
        if value.contains(option) { value.remove(option) } else { value.insert(option) }
    }
}
