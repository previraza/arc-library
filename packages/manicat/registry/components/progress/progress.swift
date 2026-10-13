import SwiftUI

/// Mirrors progress.tsx / progress.rn.tsx / progress.vue. The fill turns green at 100%.
public struct ManicatProgress: View {
    public struct Styles {
        public var meta: ManicatStyle = { $0 }
        public var label: ManicatStyle = { $0 }
        public var value: ManicatStyle = { $0 }
        public var track: ManicatStyle = { $0 }
        public var fill: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens

    private let value: Double
    private let max: Double
    private let label: String?
    private let showValue: Bool
    private let styles: Styles

    public init(value: Double = 0, max: Double = 100, label: String? = nil, showValue: Bool = false, styles: Styles = Styles()) {
        self.value = value
        self.max = max
        self.label = label
        self.showValue = showValue
        self.styles = styles
    }

    public var body: some View {
        let percent = Swift.max(0, Swift.min(100, (value / max) * 100))
        let complete = percent >= 100

        VStack(alignment: .leading, spacing: 8) {
            if label != nil || showValue {
                HStack(spacing: 12) {
                    if let label { Text(label).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.textSecondary).manicatStyle(styles.label) }
                    Spacer(minLength: 0)
                    if showValue {
                        Text("\(Int(percent.rounded()))%")
                            .font(.system(size: ManicatMetrics.textSm)).monospacedDigit()
                            .foregroundStyle(complete ? tokens.success : tokens.textMuted)
                            .manicatStyle(styles.value)
                    }
                }
                .manicatStyle(styles.meta)
            }
            GeometryReader { proxy in
                ZStack(alignment: .leading) {
                    Capsule().fill(tokens.surfaceMuted).overlay(Capsule().stroke(tokens.border, lineWidth: 1))
                        .manicatStyle(styles.track)
                    Capsule().fill(complete ? tokens.success : tokens.accent)
                        .frame(width: proxy.size.width * percent / 100)
                        .manicatStyle(styles.fill)
                }
            }
            .frame(height: 7)
            .animation(.timingCurve(0.215, 0.61, 0.355, 1, duration: 0.32), value: percent)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(label ?? "Progress")
        .accessibilityValue("\(Int(percent.rounded())) percent")
    }
}
