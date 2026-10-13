import SwiftUI

public enum ManicatBadgeTone { case neutral, success, info, warning, danger }

/// Mirrors badge.tsx / badge.rn.tsx / badge.vue.
public struct ManicatBadge: View {
    public struct Styles {
        public var root: ManicatStyle = { $0 }
        public var icon: ManicatStyle = { $0 }
        public var label: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens

    private let title: String
    private let tone: ManicatBadgeTone
    private let small: Bool
    private let icon: AnyView?
    private let styles: Styles

    public init(_ title: String, tone: ManicatBadgeTone = .neutral, small: Bool = false, icon: AnyView? = nil, styles: Styles = Styles()) {
        self.title = title
        self.tone = tone
        self.small = small
        self.icon = icon
        self.styles = styles
    }

    public var body: some View {
        let color = palette
        HStack(spacing: 4) {
            if let icon { icon.manicatStyle(styles.icon) }
            Text(title)
                .font(.system(size: small ? 11 : ManicatMetrics.textXs, weight: .medium))
                .lineLimit(1)
                .manicatStyle(styles.label)
        }
        .foregroundStyle(color.text)
        .padding(.horizontal, small ? 8 : 10)
        .frame(minHeight: small ? 22 : 26)
        .background(color.background, in: Capsule())
        .overlay(Capsule().stroke(color.border, lineWidth: 1))
        .manicatStyle(styles.root)
    }

    private var palette: (text: Color, background: Color, border: Color) {
        switch tone {
        case .neutral: return (tokens.textSecondary, tokens.surfaceMuted, tokens.border)
        case .success: return (tokens.success, tokens.success.opacity(0.10), tokens.success.opacity(0.25))
        case .info: return (tokens.accentStrong, tokens.accentSubtle, tokens.accent.opacity(0.24))
        case .warning: return (tokens.warning, tokens.warning.opacity(0.11), tokens.warning.opacity(0.27))
        case .danger: return (tokens.danger, tokens.danger.opacity(0.10), tokens.danger.opacity(0.26))
        }
    }
}
