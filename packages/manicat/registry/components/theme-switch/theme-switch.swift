import SwiftUI

public enum ManicatTheme { case light, dark }

/// Mirrors theme-switch.tsx / theme-switch.rn.tsx / theme-switch.vue. The React version animates a reveal over the page; here the
/// switch flips the value you own, which you pass to `.preferredColorScheme`.
public struct ManicatThemeSwitch: View {
    public struct Styles {
        public var icon: ManicatStyle = { $0 }
        public var label: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens

    @Binding private var theme: ManicatTheme
    private let label: String?
    private let iconOnly: Bool
    private let styles: Styles

    public init(theme: Binding<ManicatTheme>, label: String? = nil, iconOnly: Bool = true, styles: Styles = Styles()) {
        self._theme = theme
        self.label = label
        self.iconOnly = iconOnly
        self.styles = styles
    }

    public var body: some View {
        let next: ManicatTheme = theme == .dark ? .light : .dark

        Button { theme = next } label: {
            HStack(spacing: 6) {
                Text(theme == .dark ? "☾" : "☀")
                    .font(.system(size: 16))
                    .foregroundStyle(tokens.foreground)
                    .manicatStyle(styles.icon)
                if !iconOnly {
                    Text(label ?? (theme == .dark ? "Dark" : "Light"))
                        .font(.system(size: ManicatMetrics.textSm, weight: .medium))
                        .foregroundStyle(tokens.foreground)
                        .manicatStyle(styles.label)
                }
            }
            .padding(.horizontal, ManicatMetrics.space.s3)
            .frame(minWidth: ManicatMetrics.controlHeight.sm, minHeight: ManicatMetrics.controlHeight.sm)
            .background(tokens.surface, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
            .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(tokens.border, lineWidth: 1))
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Switch to \(next == .dark ? "dark" : "light") theme")
        .accessibilityValue(theme == .dark ? "On" : "Off")
        .accessibilityAddTraits(.isToggle)
    }
}
