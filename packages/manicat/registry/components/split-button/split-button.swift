import SwiftUI

/// Mirrors split-button.tsx / split-button.rn.tsx / split-button.vue: a main action and a chevron that opens the alternatives.
public struct ManicatSplitButton: View {
    public enum Variant { case primary, secondary }

    public struct Styles {
        public var main: ManicatStyle = { $0 }
        public var toggle: ManicatStyle = { $0 }
        public var label: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @Environment(\.isEnabled) private var enabled

    private let label: String
    private let actions: [ManicatMenuItem]
    private let variant: Variant
    private let styles: Styles
    private let action: () -> Void

    public init(_ label: String, actions: [ManicatMenuItem], variant: Variant = .primary, styles: Styles = Styles(), action: @escaping () -> Void) {
        self.label = label
        self.actions = actions
        self.variant = variant
        self.styles = styles
        self.action = action
    }

    public var body: some View {
        let text = variant == .primary ? tokens.background : tokens.foreground
        let fill = variant == .primary ? tokens.foreground : tokens.surface
        let border = variant == .primary ? tokens.foreground : tokens.border
        let radius = ManicatMetrics.radiusControl

        HStack(spacing: 0) {
            Button(action: action) {
                Text(label)
                    .font(.system(size: ManicatMetrics.textSm, weight: .medium))
                    .foregroundStyle(text)
                    .manicatStyle(styles.label)
                    .padding(.horizontal, ManicatMetrics.space.s4)
                    .frame(minHeight: ManicatMetrics.controlHeight.md)
                    .background(fill, in: UnevenRoundedRectangle(topLeadingRadius: radius, bottomLeadingRadius: radius))
                    .overlay(UnevenRoundedRectangle(topLeadingRadius: radius, bottomLeadingRadius: radius).stroke(border, lineWidth: 1))
                    .manicatStyle(styles.main)
            }
            .buttonStyle(.plain)
            Menu {
                ForEach(actions) { item in
                    if item.separatorBefore { Divider() }
                    Button(role: item.destructive ? .destructive : nil, action: item.action) { Text(item.label) }
                        .disabled(item.disabled)
                }
            } label: {
                Text("⌄")
                    .font(.system(size: 14))
                    .foregroundStyle(text)
                    .frame(width: 40, height: ManicatMetrics.controlHeight.md)
                    .background(fill, in: UnevenRoundedRectangle(bottomTrailingRadius: radius, topTrailingRadius: radius))
                    .overlay(UnevenRoundedRectangle(bottomTrailingRadius: radius, topTrailingRadius: radius).stroke(border, lineWidth: 1))
                    .manicatStyle(styles.toggle)
            }
            .menuStyle(.button)
            .menuIndicator(.hidden)
            .buttonStyle(.plain)
            .accessibilityLabel("\(label) options")
        }
        .opacity(enabled ? 1 : 0.52)
    }
}
