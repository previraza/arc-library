import SwiftUI

/// Mirrors metric-card.tsx / metric-card.rn.tsx / metric-card.vue.
public struct ManicatMetricCard: View {
    public struct Styles {
        public var label: ManicatStyle = { $0 }
        public var value: ManicatStyle = { $0 }
        public var change: ManicatStyle = { $0 }
        public var changeText: ManicatStyle = { $0 }
        public var context: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens

    private let label: String
    private let value: Double
    private let suffix: String?
    private let context: String
    private let change: String?
    private let styles: Styles

    public init(label: String, value: Double, suffix: String? = nil, context: String, change: String? = nil, styles: Styles = Styles()) {
        self.label = label
        self.value = value
        self.suffix = suffix
        self.context = context
        self.change = change
        self.styles = styles
    }

    public var body: some View {
        let down = change.map { $0.trimmingCharacters(in: .whitespaces).hasPrefix("-") || $0.trimmingCharacters(in: .whitespaces).hasPrefix("−") } ?? false
        let tone = down ? tokens.danger : tokens.success

        VStack(alignment: .leading, spacing: ManicatMetrics.space.s2) {
            Text(label)
                .font(.system(size: ManicatMetrics.textSm))
                .foregroundStyle(tokens.textSecondary)
                .manicatStyle(styles.label)
            HStack(alignment: .firstTextBaseline, spacing: ManicatMetrics.space.s3) {
                (Text(value.formatted()).foregroundColor(tokens.foreground) + Text(suffix ?? "").font(.system(size: ManicatMetrics.textSm)).foregroundColor(tokens.textMuted))
                    .font(.system(size: 30, weight: .semibold))
                    .monospacedDigit()
                    .manicatStyle(styles.value)
                if let change {
                    Text(change)
                        .font(.system(size: ManicatMetrics.textXs, weight: .medium))
                        .foregroundStyle(tone)
                        .manicatStyle(styles.changeText)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(tone.opacity(0.1), in: Capsule())
                        .manicatStyle(styles.change)
                }
            }
            Text(context)
                .font(.system(size: ManicatMetrics.textXs))
                .foregroundStyle(tokens.textMuted)
                .manicatStyle(styles.context)
        }
        .padding(ManicatMetrics.space.s5)
        .frame(minWidth: 200, alignment: .leading)
        .background(tokens.surface, in: RoundedRectangle(cornerRadius: 26))
        .overlay(RoundedRectangle(cornerRadius: 26).stroke(tokens.border, lineWidth: 1))
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(label): \(value.formatted())\(suffix ?? "")\(change.map { ", \($0)" } ?? ""). \(context)")
    }
}
