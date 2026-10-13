import SwiftUI

public enum ManicatAlertTone { case info, success, warning, danger }

/// Mirrors alert.tsx / alert.rn.tsx / alert.vue. Pass `onDismiss` for a dismiss button; give it body copy with the trailing closure.
public struct ManicatAlert<Content: View>: View {
    public struct Styles {
        public var icon: ManicatStyle = { $0 }
        public var copy: ManicatStyle = { $0 }
        public var title: ManicatStyle = { $0 }
        public var description: ManicatStyle = { $0 }
        public var dismiss: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens

    private let tone: ManicatAlertTone
    private let title: String
    private let open: Bool
    private let onDismiss: (() -> Void)?
    private let styles: Styles
    private let content: Content

    public init(tone: ManicatAlertTone = .info, title: String, open: Bool = true, onDismiss: (() -> Void)? = nil, styles: Styles = Styles(), @ViewBuilder content: () -> Content) {
        self.tone = tone
        self.title = title
        self.open = open
        self.onDismiss = onDismiss
        self.styles = styles
        self.content = content()
    }

    public var body: some View {
        if open {
            HStack(alignment: .top, spacing: ManicatMetrics.space.s3) {
                Text(glyph)
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(color)
                    .frame(width: 18, height: 18)
                    .overlay(Circle().stroke(color, lineWidth: 1.5))
                    .padding(.top, 1)
                    .manicatStyle(styles.icon)
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.system(size: ManicatMetrics.textSm, weight: .medium))
                        .foregroundStyle(tokens.foreground)
                        .manicatStyle(styles.title)
                    content
                        .font(.system(size: ManicatMetrics.textXs))
                        .foregroundStyle(tokens.textSecondary)
                        .manicatStyle(styles.description)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .manicatStyle(styles.copy)
                if let onDismiss {
                    Button(action: onDismiss) {
                        Text("×").font(.system(size: 18)).foregroundStyle(tokens.textMuted).frame(width: 28, height: 28)
                    }
                    .buttonStyle(.plain)
                    .padding(.top, -5)
                    .padding(.trailing, -6)
                    .accessibilityLabel("Dismiss")
                    .manicatStyle(styles.dismiss)
                }
            }
            .padding(ManicatMetrics.space.s4)
            .background(tokens.surface, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
            .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(tokens.border, lineWidth: 1))
            .accessibilityElement(children: .combine)
        }
    }

    private var color: Color {
        switch tone { case .info: return tokens.accent; case .success: return tokens.success; case .warning: return tokens.warning; case .danger: return tokens.danger }
    }

    private var glyph: String {
        switch tone { case .info: return "i"; case .success: return "✓"; case .warning: return "!"; case .danger: return "×" }
    }
}

public extension ManicatAlert where Content == EmptyView {
    init(tone: ManicatAlertTone = .info, title: String, open: Bool = true, onDismiss: (() -> Void)? = nil, styles: Styles = Styles()) {
        self.init(tone: tone, title: title, open: open, onDismiss: onDismiss, styles: styles) { EmptyView() }
    }
}
