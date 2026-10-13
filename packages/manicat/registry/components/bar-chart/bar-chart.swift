import SwiftUI

public struct ManicatBarChartDatum: Identifiable {
    public var id: String { key }
    public let key: String
    public let label: String
    public let axisLabel: String?
    public let value: Double

    public init(key: String, label: String, axisLabel: String? = nil, value: Double) {
        self.key = key
        self.label = label
        self.axisLabel = axisLabel
        self.value = value
    }
}

/// Mirrors bar-chart.tsx / bar-chart.rn.tsx / bar-chart.vue. Press a bar to read its value.
public struct ManicatBarChart: View {
    public struct Styles {
        public var readout: ManicatStyle = { $0 }
        public var plot: ManicatStyle = { $0 }
        public var bar: ManicatStyle = { $0 }
        public var barActive: ManicatStyle = { $0 }
        public var axis: ManicatStyle = { $0 }
        public var average: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @State private var active: String?

    private let data: [ManicatBarChartDatum]
    private let label: String
    private let period: String
    private let unit: String
    private let averageLabel: String
    private let showAverage: Bool
    private let height: CGFloat
    private let formatValue: (Double) -> String
    private let styles: Styles

    public init(data: [ManicatBarChartDatum], label: String, period: String, unit: String = "", averageLabel: String = "Average", showAverage: Bool = false, height: CGFloat = 180, formatValue: @escaping (Double) -> String = { $0.formatted() }, styles: Styles = Styles()) {
        self.data = data
        self.label = label
        self.period = period
        self.unit = unit
        self.averageLabel = averageLabel
        self.showAverage = showAverage
        self.height = height
        self.formatValue = formatValue
        self.styles = styles
    }

    public var body: some View {
        let max = ManicatChart.niceMax(data.map(\.value).max() ?? 0)
        let average = data.reduce(0) { $0 + $1.value } / Double(Swift.max(1, data.count))
        let picked = data.first { $0.key == active }
        let grid = Array(ManicatChart.ticks(max, count: 2).dropFirst())
        let suffix = unit.isEmpty ? "" : " \(unit)"

        VStack(alignment: .leading, spacing: ManicatMetrics.space.s2) {
            HStack {
                Text(label).font(.system(size: ManicatMetrics.textSm, weight: .medium)).foregroundStyle(tokens.foreground)
                Spacer(minLength: 0)
                Text(period).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted)
            }
            Text(picked.map { "\($0.label): \(formatValue($0.value))\(suffix)" } ?? (showAverage ? "\(averageLabel): \(formatValue(average.rounded()))\(suffix)" : " "))
                .font(.system(size: ManicatMetrics.textXs))
                .foregroundStyle(tokens.textSecondary)
                .frame(minHeight: 16, alignment: .leading)
                .manicatStyle(styles.readout)
            ZStack(alignment: .bottom) {
                ForEach(grid, id: \.self) { tick in
                    Rectangle().fill(tokens.border).frame(height: 1)
                        .overlay(alignment: .topLeading) { Text(ManicatChart.compact(tick)).font(.system(size: 10)).foregroundStyle(tokens.textMuted).offset(y: -14) }
                        .frame(maxHeight: .infinity, alignment: .bottom)
                        .padding(.bottom, CGFloat(tick / max) * height)
                }
                if showAverage {
                    Rectangle().fill(tokens.textMuted).frame(height: 1)
                        .frame(maxHeight: .infinity, alignment: .bottom)
                        .padding(.bottom, CGFloat(average / max) * height)
                        .manicatStyle(styles.average)
                }
                HStack(alignment: .bottom, spacing: 6) {
                    ForEach(data) { datum in
                        Button { active = active == datum.key ? nil : datum.key } label: {
                            RoundedRectangle(cornerRadius: 6)
                                .fill(active == nil || active == datum.key ? tokens.series[0] : tokens.series[0].opacity(0.33))
                                .frame(height: Swift.max(2, CGFloat(datum.value / max) * height))
                                .manicatStyle(styles.bar)
                                .manicatStyle(active == datum.key ? styles.barActive : { $0 })
                                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottom)
                                .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("\(datum.label), \(formatValue(datum.value))")
                    }
                }
            }
            .frame(height: height)
            .manicatStyle(styles.plot)
            HStack(spacing: 6) {
                ForEach(data) { datum in
                    Text(datum.axisLabel ?? datum.label).font(.system(size: 10)).foregroundStyle(tokens.textMuted).manicatStyle(styles.axis).frame(maxWidth: .infinity)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("\(label), \(period)")
    }
}
