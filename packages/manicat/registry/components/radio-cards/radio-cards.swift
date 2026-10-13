import SwiftUI

public struct ManicatRadioCard: Identifiable {
    public var id: String { value }
    public let value: String
    public let label: String
    public let description: String?
    public let meta: String?
    public let disabled: Bool

    public init(value: String, label: String, description: String? = nil, meta: String? = nil, disabled: Bool = false) {
        self.value = value
        self.label = label
        self.description = description
        self.meta = meta
        self.disabled = disabled
    }
}

/// Mirrors radio-cards.tsx / radio-cards.rn.tsx / radio-cards.vue: radio options drawn as cards.
public struct ManicatRadioCards: View {
    public struct Styles {
        public var card: ManicatStyle = { $0 }
        public var selected: ManicatStyle = { $0 }
        public var title: ManicatStyle = { $0 }
        public var description: ManicatStyle = { $0 }
        public var meta: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens

    private let options: [ManicatRadioCard]
    @Binding private var value: String?
    private let styles: Styles

    public init(options: [ManicatRadioCard], value: Binding<String?>, styles: Styles = Styles()) {
        self.options = options
        self._value = value
        self.styles = styles
    }

    public var body: some View {
        VStack(spacing: ManicatMetrics.space.s2) {
            ForEach(options) { option in
                let selected = option.value == value
                Button { value = option.value } label: {
                    HStack(spacing: ManicatMetrics.space.s3) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(option.label).font(.system(size: ManicatMetrics.textSm, weight: .medium)).foregroundStyle(tokens.foreground).manicatStyle(styles.title)
                            if let description = option.description {
                                Text(description).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textSecondary).manicatStyle(styles.description)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        if let meta = option.meta {
                            Text(meta).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted).manicatStyle(styles.meta)
                        }
                    }
                    .padding(ManicatMetrics.space.s4)
                    .background(selected ? tokens.surfaceMuted : tokens.surface, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
                    .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(selected ? tokens.foreground : tokens.border, lineWidth: 1))
                    .manicatStyle(styles.card)
                    .manicatStyle(selected ? styles.selected : { $0 })
                    .opacity(option.disabled ? 0.5 : 1)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .disabled(option.disabled)
                .accessibilityAddTraits(selected ? .isSelected : [])
            }
        }
        .accessibilityElement(children: .contain)
    }
}
