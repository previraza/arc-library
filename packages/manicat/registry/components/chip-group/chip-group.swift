import SwiftUI

public struct ManicatChipOption: Identifiable, Hashable {
    public var id: String { value }
    public let value: String
    public let label: String

    public init(value: String, label: String) {
        self.value = value
        self.label = label
    }
}

/// Mirrors chip-group.tsx / chip-group.rn.tsx / chip-group.vue: toggleable chips that wrap, with a "+N more" chip past `maxVisible`.
public struct ManicatChipGroup: View {
    public struct Styles {
        public var chip: ManicatStyle = { $0 }
        public var selected: ManicatStyle = { $0 }
        public var chipText: ManicatStyle = { $0 }
        public var more: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @State private var expanded = false

    private let options: [ManicatChipOption]
    @Binding private var value: Set<String>
    private let label: String
    private let multiple: Bool
    private let maxVisible: Int
    private let styles: Styles

    public init(options: [ManicatChipOption], value: Binding<Set<String>>, label: String, multiple: Bool = true, maxVisible: Int = .max, styles: Styles = Styles()) {
        self.options = options
        self._value = value
        self.label = label
        self.multiple = multiple
        self.maxVisible = maxVisible
        self.styles = styles
    }

    public var body: some View {
        let shown = expanded ? options : Array(options.prefix(maxVisible))
        let hidden = options.count - shown.count

        ManicatFlowLayout(spacing: ManicatMetrics.space.s2, lineSpacing: ManicatMetrics.space.s2) {
            ForEach(shown) { option in
                let selected = value.contains(option.value)
                Button { toggle(option.value) } label: {
                    Text(option.label)
                        .font(.system(size: ManicatMetrics.textSm, weight: .medium))
                        .foregroundStyle(selected ? tokens.background : tokens.foreground)
                        .manicatStyle(styles.chipText)
                        .padding(.horizontal, ManicatMetrics.space.s3)
                        .frame(minHeight: ManicatMetrics.controlHeight.sm)
                        .background(selected ? tokens.foreground : tokens.surface, in: Capsule())
                        .overlay(Capsule().stroke(selected ? tokens.foreground : tokens.border, lineWidth: 1))
                        .manicatStyle(styles.chip)
                        .manicatStyle(selected ? styles.selected : { $0 })
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(selected ? .isSelected : [])
            }
            if hidden > 0 {
                Button { expanded = true } label: {
                    Text("+\(hidden) more")
                        .font(.system(size: ManicatMetrics.textSm, weight: .medium))
                        .foregroundStyle(tokens.textSecondary)
                        .padding(.horizontal, ManicatMetrics.space.s3)
                        .frame(minHeight: ManicatMetrics.controlHeight.sm)
                        .background(tokens.surfaceMuted, in: Capsule())
                        .overlay(Capsule().stroke(tokens.border, lineWidth: 1))
                        .manicatStyle(styles.more)
                }
                .buttonStyle(.plain)
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
    }

    private func toggle(_ option: String) {
        if !multiple {
            value = value.contains(option) ? [] : [option]
        } else if value.contains(option) {
            value.remove(option)
        } else {
            value.insert(option)
        }
    }
}
