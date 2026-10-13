import SwiftUI

public struct ManicatRidgelineSeries: Identifiable {
    public let id: String
    public let label: String
    public let values: [Double]

    public init(id: String, label: String, values: [Double]) {
        self.id = id
        self.label = label
        self.values = values
    }
}

/// Mirrors ridgeline.tsx / ridgeline.rn.tsx / ridgeline.vue: stacked, overlapping area charts that share one scale.
public struct ManicatRidgeline: View {
    public struct Styles {
        public var readout: ManicatStyle = { $0 }
        public var rowLabel: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @State private var active: String?

    private let series: [ManicatRidgelineSeries]
    private let label: String
    private let unit: String
    private let formatValue: (Double) -> String
    private let overlap: Double
    private let rowHeight: CGFloat
    private let tint: Bool
    private let emptyLabel: String
    private let styles: Styles

    public init(series: [ManicatRidgelineSeries], label: String, unit: String = "", formatValue: @escaping (Double) -> String = { $0.formatted() }, overlap: Double = 0.6, rowHeight: CGFloat = 56, tint: Bool = false, emptyLabel: String = "No data yet", styles: Styles = Styles()) {
        self.series = series
        self.label = label
        self.unit = unit
        self.formatValue = formatValue
        self.overlap = overlap
        self.rowHeight = rowHeight
        self.tint = tint
        self.emptyLabel = emptyLabel
        self.styles = styles
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: ManicatMetrics.space.s2) {
            Text(label).font(.system(size: ManicatMetrics.textSm, weight: .medium)).foregroundStyle(tokens.foreground)
            if series.isEmpty {
                Text(emptyLabel).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.textMuted)
            } else {
                Text(active.flatMap { id in series.first { $0.id == id } }.map { "\($0.label): average \(formatValue(mean($0).rounded()))\(unit.isEmpty ? "" : " \(unit)")" } ?? " ")
                    .font(.system(size: ManicatMetrics.textXs))
                    .foregroundStyle(tokens.textSecondary)
                    .frame(minHeight: 16, alignment: .leading)
                    .manicatStyle(styles.readout)
                chart
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var chart: some View {
        let step = rowHeight * CGFloat(1 - overlap)
        let height = step * CGFloat(series.count - 1) + rowHeight + 4
        let top = max(1, series.flatMap(\.values).max() ?? 1)

        return GeometryReader { proxy in
            ZStack(alignment: .topLeading) {
                ForEach(Array(series.enumerated()), id: \.element.id) { index, entry in
                    let base = CGFloat(index) * step + rowHeight
                    let x = ManicatChart.linearScale(domain: (0, Double(max(1, entry.values.count - 1))), range: (0, Double(proxy.size.width)))
                    let y = ManicatChart.linearScale(domain: (0, top), range: (Double(base), Double(base - rowHeight)))
                    let points = entry.values.enumerated().map { CGPoint(x: x(Double($0.offset)), y: y($0.element)) }
                    let color = tint ? tokens.series[index % 4] : tokens.series[0]
                    ZStack(alignment: .topLeading) {
                        ManicatChart.areaPath(points, baseline: base).fill(color.opacity(0.35))
                        ManicatChart.linePath(points).stroke(color, lineWidth: 1.5)
                        Text(entry.label).font(.system(size: 11)).foregroundStyle(tokens.foreground).manicatStyle(styles.rowLabel).offset(y: base - 18)
                    }
                    .opacity(active != nil && active != entry.id ? 0.35 : 1)
                    .onTapGesture { active = active == entry.id ? nil : entry.id }
                    .accessibilityLabel("\(entry.label), average \(formatValue(mean(entry).rounded()))")
                }
            }
        }
        .frame(height: height)
    }

    private func mean(_ entry: ManicatRidgelineSeries) -> Double { entry.values.reduce(0, +) / Double(max(1, entry.values.count)) }
}
