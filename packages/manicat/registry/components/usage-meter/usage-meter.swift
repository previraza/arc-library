import SwiftUI

public struct ManicatUsageSegment: Identifiable {
    public let id: String
    public let label: String
    public let value: Double

    public init(id: String, label: String, value: Double) {
        self.id = id
        self.label = label
        self.value = value
    }
}

/// Mirrors usage-meter.tsx / usage-meter.rn.tsx / usage-meter.vue: a segmented bar against a limit that warns near it and turns
/// red over it.
public struct ManicatUsageMeter: View {
    public struct Styles {
        public var track: ManicatStyle = { $0 }
        public var segment: ManicatStyle = { $0 }
        public var legend: ManicatStyle = { $0 }
        public var readout: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens

    private let label: String
    private let segments: [ManicatUsageSegment]
    private let limit: Double
    private let unit: String
    private let decimals: Int
    private let freeLabel: String
    private let overLabel: String
    private let warnAt: Double
    private let styles: Styles

    public init(label: String, segments: [ManicatUsageSegment], limit: Double, unit: String = "", decimals: Int = 1, freeLabel: String = "Free", overLabel: String = "Over limit", warnAt: Double = 0.9, styles: Styles = Styles()) {
        self.label = label
        self.segments = segments
        self.limit = limit
        self.unit = unit
        self.decimals = decimals
        self.freeLabel = freeLabel
        self.overLabel = overLabel
        self.warnAt = warnAt
        self.styles = styles
    }

    public var body: some View {
        let used = segments.reduce(0) { $0 + $1.value }
        let over = used > limit
        let warn = !over && limit > 0 && used / limit >= warnAt
        let shades = [tokens.foreground, tokens.accent, tokens.textMuted, tokens.borderStrong]

        VStack(alignment: .leading, spacing: ManicatMetrics.space.s2) {
            HStack {
                Text(label).font(.system(size: ManicatMetrics.textSm, weight: .medium)).foregroundStyle(tokens.foreground)
                Spacer(minLength: 0)
                Text("\(format(used)) / \(format(limit))")
                    .font(.system(size: ManicatMetrics.textXs)).monospacedDigit()
                    .foregroundStyle(over ? tokens.danger : warn ? tokens.warning : tokens.textSecondary)
                    .manicatStyle(styles.readout)
            }
            GeometryReader { proxy in
                HStack(spacing: 0) {
                    ForEach(Array(segments.enumerated()), id: \.element.id) { index, segment in
                        Rectangle()
                            .fill(over ? tokens.danger : warn ? tokens.warning : shades[index % shades.count])
                            .frame(width: proxy.size.width * min(1, segment.value / max(used, limit)))
                            .manicatStyle(styles.segment)
                    }
                    Spacer(minLength: 0)
                }
                .background(tokens.surfaceMuted)
                .clipShape(Capsule())
                .overlay(Capsule().stroke(tokens.border, lineWidth: 1))
                .manicatStyle(styles.track)
            }
            .frame(height: 8)
            Text(over ? "\(overLabel) by \(format(used - limit))" : "\(format(max(0, limit - used))) \(freeLabel.lowercased())")
                .font(.system(size: ManicatMetrics.textXs))
                .foregroundStyle(over ? tokens.danger : tokens.textMuted)
                .manicatStyle(styles.legend)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(label): \(format(used)) of \(format(limit))")
        .accessibilityValue("\(Int((min(used, limit) / max(limit, 1) * 100).rounded())) percent")
    }

    private func format(_ value: Double) -> String {
        String(format: "%.\(decimals)f", value) + (unit.isEmpty ? "" : " \(unit)")
    }
}
