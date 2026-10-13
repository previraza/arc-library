import SwiftUI

public struct ManicatSelectOption: Identifiable {
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

/// Mirrors select.tsx / select.rn.tsx / select.vue. The list is the system menu, so type-ahead, keyboard and VoiceOver work as
/// they do everywhere else on the platform.
public struct ManicatSelect: View {
    public struct Styles {
        public var label: ManicatStyle = { $0 }
        public var trigger: ManicatStyle = { $0 }
        public var valueText: ManicatStyle = { $0 }
        public var chevron: ManicatStyle = { $0 }
        public var hint: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @Environment(\.isEnabled) private var enabled

    private let label: String
    private let options: [ManicatSelectOption]
    @Binding private var selection: String?
    private let description: String?
    private let placeholder: String
    private let styles: Styles

    public init(_ label: String, options: [ManicatSelectOption], selection: Binding<String?>, description: String? = nil, placeholder: String = "Select…", styles: Styles = Styles()) {
        self.label = label
        self.options = options
        self._selection = selection
        self.description = description
        self.placeholder = placeholder
        self.styles = styles
    }

    public var body: some View {
        let selected = options.first { $0.value == selection }

        VStack(alignment: .leading, spacing: ManicatMetrics.space.s2) {
            Text(label).font(.system(size: ManicatMetrics.textSm, weight: .medium)).foregroundStyle(tokens.foreground).manicatStyle(styles.label)
            Menu {
                ForEach(options) { option in
                    Button { selection = option.value } label: {
                        if option.value == selection { Text("✓ \(option.label)") } else { Text(option.label) }
                    }
                    .disabled(option.disabled)
                }
            } label: {
                HStack(spacing: ManicatMetrics.space.s3) {
                    Text(selected?.label ?? placeholder)
                        .font(.system(size: ManicatMetrics.textSm))
                        .foregroundStyle(selected == nil ? tokens.textMuted : tokens.foreground)
                        .manicatStyle(styles.valueText)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    Text("⌄").font(.system(size: 14)).foregroundStyle(tokens.textMuted).manicatStyle(styles.chevron)
                }
                .padding(.horizontal, ManicatMetrics.space.s3)
                .frame(minHeight: ManicatMetrics.controlHeight.md)
                .background(tokens.surface, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
                .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(tokens.borderStrong, lineWidth: 1))
                .opacity(enabled ? 1 : 0.5)
                .manicatStyle(styles.trigger)
            }
            .menuStyle(.button)
            .menuIndicator(.hidden)
            .buttonStyle(.plain)
            .accessibilityLabel(label)
            .accessibilityValue(selected?.label ?? placeholder)
            if let description {
                Text(description).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted).manicatStyle(styles.hint)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
