import SwiftUI

public enum ManicatButtonVariant { case primary, secondary, ghost, danger }
public enum ManicatButtonSize { case sm, md, lg }

/// Mirrors button.tsx / button.rn.tsx / button.vue: same variants, sizes, loading and disabled behaviour, same press feedback.
/// Customise a part with `styles`, the counterpart of `classNames` on the web.
public struct ManicatButton<Label: View>: View {
    public struct Styles {
        public var root: (AnyView) -> AnyView = { $0 }
        public var label: (AnyView) -> AnyView = { $0 }
        public var spinner: (AnyView) -> AnyView = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @Environment(\.isEnabled) private var enabled

    private let variant: ManicatButtonVariant
    private let size: ManicatButtonSize
    private let loading: Bool
    private let styles: Styles
    private let action: () -> Void
    private let label: Label

    public init(variant: ManicatButtonVariant = .primary, size: ManicatButtonSize = .md, loading: Bool = false, styles: Styles = Styles(), action: @escaping () -> Void, @ViewBuilder label: () -> Label) {
        self.variant = variant
        self.size = size
        self.loading = loading
        self.styles = styles
        self.action = action
        self.label = label()
    }

    public var body: some View {
        // Loading keeps the button focusable and swallows presses instead of disabling it.
        Button(action: { if !loading { action() } }) {
            styles.label(AnyView(
                label
                    .font(.system(size: ManicatMetrics.textSm, weight: .medium))
                    .opacity(loading ? 0 : 1)
                    .overlay { if loading { styles.spinner(AnyView(ProgressView().controlSize(.small).tint(palette.text))) } }
            ))
        }
        .buttonStyle(PressStyle(palette: palette, size: size, metrics: dimensions, dimmed: !enabled))
        .accessibilityAddTraits(loading ? .updatesFrequently : [])
    }

    private var dimensions: (height: CGFloat, padding: CGFloat) {
        switch size {
        case .sm: return (ManicatMetrics.controlHeight.sm, ManicatMetrics.space.s3)
        case .md: return (ManicatMetrics.controlHeight.md, ManicatMetrics.space.s4)
        case .lg: return (ManicatMetrics.controlHeight.lg, ManicatMetrics.space.s5)
        }
    }

    fileprivate struct Palette { let text, background, border, pressed: Color }

    private var palette: Palette {
        switch variant {
        case .primary: return Palette(text: tokens.background, background: tokens.foreground, border: tokens.foreground, pressed: tokens.foreground)
        case .secondary: return Palette(text: tokens.foreground, background: tokens.surface, border: tokens.border, pressed: tokens.surfaceMuted)
        case .ghost: return Palette(text: tokens.textSecondary, background: .clear, border: .clear, pressed: tokens.surfaceMuted)
        case .danger: return Palette(text: tokens.danger, background: tokens.surface, border: tokens.border, pressed: tokens.surfaceMuted)
        }
    }

    private struct PressStyle: ButtonStyle {
        let palette: Palette
        let size: ManicatButtonSize
        let metrics: (height: CGFloat, padding: CGFloat)
        let dimmed: Bool

        private var pressedScale: CGFloat { size == .sm ? 0.96 : size == .lg ? 0.985 : 0.97 }

        func makeBody(configuration: Configuration) -> some View {
            configuration.label
                .foregroundStyle(palette.text)
                .padding(.horizontal, metrics.padding)
                .frame(minHeight: metrics.height)
                .background(configuration.isPressed ? palette.pressed : palette.background, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
                .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(palette.border, lineWidth: 1))
                .opacity(dimmed ? 0.52 : 1)
                .scaleEffect(configuration.isPressed ? pressedScale : 1)
                .animation(.spring(response: 0.25, dampingFraction: 0.9), value: configuration.isPressed)
        }
    }
}

public extension ManicatButton where Label == Text {
    init(_ title: String, variant: ManicatButtonVariant = .primary, size: ManicatButtonSize = .md, loading: Bool = false, action: @escaping () -> Void) {
        self.init(variant: variant, size: size, loading: loading, action: action) { Text(title) }
    }
}
