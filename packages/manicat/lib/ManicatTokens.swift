import SwiftUI

/// The Manicat UI design tokens as SwiftUI values. Same names and meaning as registry/foundation.css and lib/rn-tokens.ts.
/// `scripts/check-parity.mjs` compares every colour below with rn-tokens.ts, so the three never drift.
public struct ManicatTokens {
    public let background, surface, surfaceMuted, foreground, textSecondary, textMuted, border, borderStrong: Color
    public let accent, accentStrong, accentSubtle, success, warning, danger: Color
    public let controlOn, controlTrack, controlThumb, controlThumbOn: Color
    /// Four distinguishable colours for chart series, the counterpart of --series-1 to --series-4.
    public let series: [Color]

    public static let light = ManicatTokens(
        background: Color(hex: "#ffffff"), surface: Color(hex: "#ffffff"), surfaceMuted: Color(hex: "#f6f6f6"),
        foreground: Color(hex: "#1b1b1b"), textSecondary: Color(hex: "#6e6e6e"), textMuted: Color(hex: "#8f8f8f"),
        border: Color(hex: "#ebebeb"), borderStrong: Color(hex: "#c9c9c9"),
        accent: Color(hex: "#4a4a4a"), accentStrong: Color(hex: "#303030"), accentSubtle: Color(hex: "#4a4a4a", opacity: 0.1),
        success: Color(hex: "#1f8a4c"), warning: Color(hex: "#b8741a"), danger: Color(hex: "#d03b3b"),
        controlOn: Color(hex: "#2c2c2c"), controlTrack: Color(hex: "#e2e2e2"), controlThumb: Color(hex: "#ffffff"), controlThumbOn: Color(hex: "#ffffff"),
        series: [Color(hex: "#1f7dcf"), Color(hex: "#7128a5"), Color(hex: "#e58f00"), Color(hex: "#009e84")]
    )

    public static let dark = ManicatTokens(
        background: Color(hex: "#2b2b2b"), surface: Color(hex: "#303030"), surfaceMuted: Color(hex: "#3c3c3c"),
        foreground: Color(hex: "#f1f1f1"), textSecondary: Color(hex: "#c4c4c4"), textMuted: Color(hex: "#a0a0a0"),
        border: Color(hex: "#454545"), borderStrong: Color(hex: "#5c5c5c"),
        accent: Color(hex: "#cfcfcf"), accentStrong: Color(hex: "#e6e6e6"), accentSubtle: Color(hex: "#cfcfcf", opacity: 0.13),
        success: Color(hex: "#5fd48a"), warning: Color(hex: "#f0b95c"), danger: Color(hex: "#ff8a80"),
        controlOn: Color(hex: "#ececec"), controlTrack: Color(hex: "#515151"), controlThumb: Color(hex: "#f4f4f4"), controlThumbOn: Color(hex: "#2b2b2b"),
        series: [Color(hex: "#55adff"), Color(hex: "#9c37be"), Color(hex: "#e66e00"), Color(hex: "#00a861")]
    )
}

/// Shape and rhythm shared by every component, in points.
public enum ManicatMetrics {
    public static let radiusControl: CGFloat = 18
    public static let controlHeight: (sm: CGFloat, md: CGFloat, lg: CGFloat) = (36, 44, 50)
    public static let space: (s1: CGFloat, s2: CGFloat, s3: CGFloat, s4: CGFloat, s5: CGFloat) = (4, 8, 12, 16, 20)
    public static let textXs: CGFloat = 12
    public static let textSm: CGFloat = 14
    public static let textLg: CGFloat = 18
}

private struct ManicatTokensKey: EnvironmentKey {
    static let defaultValue = ManicatTokens.light
}

public extension EnvironmentValues {
    /// The tokens for the current colour scheme. Read them with `@Environment(\.manicat)`.
    var manicat: ManicatTokens {
        get { colorScheme == .dark ? .dark : self[ManicatTokensKey.self] }
        set { self[ManicatTokensKey.self] = newValue }
    }
}

public extension Color {
    init(hex: String, opacity: Double = 1) {
        let digits = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        var value: UInt64 = 0
        Scanner(string: digits).scanHexInt64(&value)
        self.init(.sRGB, red: Double((value >> 16) & 0xff) / 255, green: Double((value >> 8) & 0xff) / 255, blue: Double(value & 0xff) / 255, opacity: opacity)
    }
}
