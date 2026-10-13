import SwiftUI

public enum ManicatStatVisual {
    case trend(values: [Double])
    case uptime(days: [Double])
    case distribution(bins: [Double], max: Double, marker: Double)
}

public struct ManicatStat: Identifiable {
    public var id: String { label }
    public let value: Double
    public let prefix: String
    public let suffix: String
    public let decimals: Int
    /// Shortens large numbers to 2.3M or 12K.
    public let compact: Bool
    public let label: String
    public let detail: String?
    public let context: String?
    public let visual: ManicatStatVisual?

    public init(value: Double, prefix: String = "", suffix: String = "", decimals: Int = 0, compact: Bool = false, label: String, detail: String? = nil, context: String? = nil, visual: ManicatStatVisual? = nil) {
        self.value = value
        self.prefix = prefix
        self.suffix = suffix
        self.decimals = decimals
        self.compact = compact
        self.label = label
        self.detail = detail
        self.context = context
        self.visual = visual
    }
}

public enum ManicatStatsLayout { case plain, divided }

/// Mirrors stats-band.tsx / stats-band.rn.tsx / stats-band.vue: key numbers that count up, with a small bar visual each. Press and hold
/// a stat to read its context. The stats below are examples; pass your own.
public struct ManicatStatsBand: View {
    public struct Styles {
        public var title: ManicatStyle = { $0 }
        public var description: ManicatStyle = { $0 }
        public var stat: ManicatStyle = { $0 }
        public var number: ManicatStyle = { $0 }
        public var label: ManicatStyle = { $0 }
        public init() {}
    }

    public static let examples = [
        ManicatStat(value: 2_334_000, decimals: 1, compact: true, label: "Deploys in the last 12 months", detail: "Across 12,400 teams", context: "Up from 1.4M the year before", visual: .trend(values: [141, 148, 139, 162, 171, 184, 196, 203, 221, 238, 257, 274])),
        ManicatStat(value: 99.99, suffix: "%", decimals: 2, label: "API uptime over 90 days", detail: "Measured every 30 seconds", context: "12 minutes down, 11 of them on July 14", visual: .uptime(days: (0..<90).map { $0 == 51 ? 99.24 : $0 == 23 ? 99.93 : 100 })),
        ManicatStat(value: 38, suffix: "ms", label: "Median response time", detail: "At the edge, worldwide", context: "p95 is 96 ms, down from 141 ms", visual: .distribution(bins: [2, 8, 18, 26, 15, 10, 7, 5, 3, 2, 1.5, 1, 0.8, 0.7, 0.5, 0.3], max: 160, marker: 38)),
        ManicatStat(value: 35, label: "Edge regions on six continents", detail: "Most people are under 20 ms away", context: "Eight added this year, including Lagos"),
    ]

    @Environment(\.manicat) private var tokens
    @State private var active: String?
    @State private var progress: Double = 0

    private let stats: [ManicatStat]
    private let layout: ManicatStatsLayout
    private let title: String?
    private let description: String?
    private let duration: Double
    private let locale: Locale
    private let styles: Styles

    public init(stats: [ManicatStat] = ManicatStatsBand.examples, layout: ManicatStatsLayout = .plain, title: String? = nil, description: String? = nil, duration: Double = 1.6, locale: Locale = Locale(identifier: "en_US"), styles: Styles = Styles()) {
        self.stats = stats
        self.layout = layout
        self.title = title
        self.description = description
        self.duration = duration
        self.locale = locale
        self.styles = styles
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if title != nil || description != nil {
                VStack(alignment: .leading, spacing: 6) {
                    if let title { Text(title).font(.system(size: 24, weight: .semibold)).tracking(-0.4).foregroundStyle(tokens.foreground).accessibilityAddTraits(.isHeader).manicatStyle(styles.title) }
                    if let description { Text(description).font(.system(size: 14)).lineSpacing(3).foregroundStyle(tokens.textSecondary).manicatStyle(styles.description) }
                }
                .padding(.vertical, 8)
            }
            ForEach(Array(stats.enumerated()), id: \.element.id) { index, stat in
                VStack(alignment: .leading, spacing: 4) {
                    Text(stat.label).font(.system(size: 13)).foregroundStyle(tokens.textSecondary).manicatStyle(styles.label)
                    Text(text(stat, progress * stat.value)).font(.system(size: 38, weight: .semibold).monospacedDigit()).tracking(-1).foregroundStyle(tokens.foreground).manicatStyle(styles.number)
                        .accessibilityLabel(text(stat, stat.value))
                    Text((active == stat.id ? stat.context : nil) ?? stat.detail ?? "").font(.system(size: 13)).foregroundStyle(tokens.textMuted)
                    if let visual = stat.visual { bars(visual, ink: active == stat.id ? tokens.series[0] : tokens.foreground) }
                }
                .padding(.vertical, 14)
                .frame(maxWidth: .infinity, alignment: .leading)
                .overlay(alignment: .top) { if layout == .divided, index > 0 { Rectangle().fill(tokens.border).frame(height: 1) } }
                .contentShape(Rectangle())
                .gesture(DragGesture(minimumDistance: 0).onChanged { _ in active = stat.id }.onEnded { _ in active = nil })
                .manicatStyle(styles.stat)
            }
        }
        .overlay(alignment: .top) { if layout == .divided { Rectangle().fill(tokens.border).frame(height: 1) } }
        .overlay(alignment: .bottom) { if layout == .divided { Rectangle().fill(tokens.border).frame(height: 1) } }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(title ?? "Key numbers")
        .onAppear { withAnimation(.timingCurve(0.215, 0.61, 0.355, 1, duration: duration)) { progress = 1 } }
    }

    private func text(_ stat: ManicatStat, _ value: Double) -> String {
        let digits = FloatingPointFormatStyle<Double>.number.precision(.fractionLength(stat.decimals)).locale(locale)
        guard stat.compact else { return stat.prefix + value.formatted(digits) + stat.suffix }
        let size = abs(stat.value)
        let (scale, unit): (Double, String) = size >= 1e9 ? (1e9, "B") : size >= 1e6 ? (1e6, "M") : size >= 1e3 ? (1e3, "K") : (1, "")
        return stat.prefix + (value / scale).formatted(digits) + unit + stat.suffix
    }

    private func bars(_ visual: ManicatStatVisual, ink: Color) -> some View {
        let items: [(height: Double, ink: Bool)]
        switch visual {
        case let .trend(values):
            let low = values.min() ?? 0
            let span = (values.max() ?? 0) - low
            items = values.map { (0.2 + ($0 - low) / (span == 0 ? 1 : span) * 0.8, true) }
        case let .uptime(days):
            items = days.map { (min(1, max(0.3, 1 - (100 - $0) * 0.7)), $0 < 100) }
        case let .distribution(bins, max, marker):
            let peak = bins.max() ?? 1
            let width = max / Double(bins.count)
            items = bins.enumerated().map { (Swift.max(0.04, $1 / peak), Double($0) * width < marker) }
        }

        return HStack(alignment: .bottom, spacing: 1) {
            ForEach(Array(items.enumerated()), id: \.offset) { _, bar in
                RoundedRectangle(cornerRadius: 1).fill(bar.ink ? ink : tokens.borderStrong).frame(maxWidth: .infinity).frame(height: 36 * bar.height)
            }
        }
        .frame(height: 36, alignment: .bottom)
        .padding(.top, 6)
        .accessibilityHidden(true)
    }
}
