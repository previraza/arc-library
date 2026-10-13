import SwiftUI

public enum ManicatBadgeTone { case neutral, success, info, warning, danger }

/// Mirrors badge.tsx / badge.rn.tsx / badge.vue.
public struct ManicatBadge: View {
    @Environment(\.manicat) private var tokens

    private let title: String
    private let tone: ManicatBadgeTone
    private let small: Bool

    public init(_ title: String, tone: ManicatBadgeTone = .neutral, small: Bool = false) {
        self.title = title
        self.tone = tone
        self.small = small
    }

    public var body: some View {
        let color = palette
        Text(title)
            .font(.system(size: small ? 11 : ManicatMetrics.textXs, weight: .medium))
            .foregroundStyle(color.text)
            .lineLimit(1)
            .padding(.horizontal, small ? 8 : 10)
            .frame(minHeight: small ? 22 : 26)
            .background(color.background, in: Capsule())
            .overlay(Capsule().stroke(color.border, lineWidth: 1))
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
