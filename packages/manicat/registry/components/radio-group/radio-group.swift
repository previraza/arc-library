import SwiftUI

public struct ManicatRadioOption: Identifiable {
    public var id: String { value }
    public let value: String
    public let label: String
    public let description: String?

    public init(value: String, label: String, description: String? = nil) {
        self.value = value
        self.label = label
        self.description = description
    }
}

/// Mirrors radio-group.tsx / radio-group.rn.tsx / radio-group.vue.
public struct ManicatRadioGroup: View {
    public struct Styles {
        public var label: ManicatStyle = { $0 }
        public var option: ManicatStyle = { $0 }
        public var mark: ManicatStyle = { $0 }
        public var dot: ManicatStyle = { $0 }
        public var optionLabel: ManicatStyle = { $0 }
        public var description: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens

    private let label: String
    private let options: [ManicatRadioOption]
    @Binding private var value: String
    private let styles: Styles

    public init(_ label: String, options: [ManicatRadioOption], value: Binding<String>, styles: Styles = Styles()) {
        self.label = label
        self.options = options
        self._value = value
        self.styles = styles
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(label)
                .font(.system(size: ManicatMetrics.textSm, weight: .medium))
                .foregroundStyle(tokens.foreground)
                .padding(.bottom, ManicatMetrics.space.s1)
                .manicatStyle(styles.label)
            ForEach(options) { option in
                let selected = option.value == value
                Button { value = option.value } label: {
                    HStack(alignment: .top, spacing: 0) {
                        Circle()
                            .fill(tokens.surface)
                            .overlay(Circle().stroke(selected ? tokens.controlOn : tokens.borderStrong, lineWidth: 1))
                            .overlay { if selected { Circle().fill(tokens.controlOn).frame(width: 8, height: 8).manicatStyle(styles.dot) } }
                            .frame(width: 18, height: 18)
                            .manicatStyle(styles.mark)
                            .frame(width: ManicatMetrics.controlHeight.md, height: ManicatMetrics.controlHeight.md)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(option.label).font(.system(size: ManicatMetrics.textSm, weight: .medium)).foregroundStyle(tokens.foreground).manicatStyle(styles.optionLabel)
                            if let description = option.description {
                                Text(description).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted).manicatStyle(styles.description)
                            }
                        }
                        .padding(.top, (ManicatMetrics.controlHeight.md - ManicatMetrics.textSm * 1.4) / 2)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .contentShape(Rectangle())
                    .manicatStyle(styles.option)
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(selected ? .isSelected : [])
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
    }
}
