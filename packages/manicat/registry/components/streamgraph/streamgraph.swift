import SwiftUI

public struct ManicatStreamSeries: Identifiable {
    public var id: String { key }
    public let key: String
    public let label: String
    public let color: Color?

    public init(key: String, label: String, color: Color? = nil) {
        self.key = key
        self.label = label
        self.color = color
    }
}

public struct ManicatStreamDatum: Identifiable {
    public var id: String { key }
    public let key: String
    public let label: String
    public let axisLabel: String?
    public let values: [String: Double]

    public init(key: String, label: String, axisLabel: String? = nil, values: [String: Double]) {
        self.key = key
        self.label = label
        self.axisLabel = axisLabel
        self.values = values
    }
}

/// Mirrors streamgraph.tsx / streamgraph.rn.tsx / streamgraph.vue: stacked bands around a centre line, or on a baseline.
public struct ManicatStreamgraph: View {
    public enum Offset { case silhouette, zero }

    public struct Styles {
        public var readout: ManicatStyle = { $0 }
        public var legend: ManicatStyle = { $0 }
        public var axis: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @State private var focus: String?

    private let data: [ManicatStreamDatum]
    private let series: [ManicatStreamSeries]
    private let label: String
    private let unit: String
    private let height: CGFloat
    private let offset: Offset
    private let formatValue: (Double, ManicatStreamSeries) -> String
    private let legend: Bool
    private let emptyLabel: String
    private let styles: Styles

    public init(data: [ManicatStreamDatum], series: [ManicatStreamSeries], label: String, unit: String = "", height: CGFloat = 220, offset: Offset = .silhouette, formatValue: @escaping (Double, ManicatStreamSeries) -> String = { value, _ in value.formatted() }, legend: Bool = true, emptyLabel: String = "No data yet", styles: Styles = Styles()) {
        self.data = data
        self.series = series
        self.label = label
        self.unit = unit
        self.height = height
        self.offset = offset
        self.formatValue = formatValue
        self.legend = legend
        self.emptyLabel = emptyLabel
        self.styles = styles
    }

    public var body: some View {
        let picked = series.first { $0.key == focus }

        VStack(alignment: .leading, spacing: ManicatMetrics.space.s2) {
            Text(label).font(.system(size: ManicatMetrics.textSm, weight: .medium)).foregroundStyle(tokens.foreground)
            if data.isEmpty {
                Text(emptyLabel).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.textMuted)
            } else {
                Text(readout(picked))
                    .font(.system(size: ManicatMetrics.textXs))
                    .foregroundStyle(tokens.textSecondary)
                    .frame(minHeight: 16, alignment: .leading)
                    .manicatStyle(styles.readout)
                bands
                HStack {
                    ForEach(data.filter { $0.axisLabel != nil }) { datum in
                        Text(datum.axisLabel ?? "").font(.system(size: 10)).foregroundStyle(tokens.textMuted).manicatStyle(styles.axis).frame(maxWidth: .infinity)
                    }
                }
                if legend {
                    ManicatFlowLayout(spacing: ManicatMetrics.space.s3, lineSpacing: 6) {
                        ForEach(series) { entry in
                            Button { focus = focus == entry.key ? nil : entry.key } label: {
                                HStack(spacing: 6) {
                                    Circle().fill(color(entry)).frame(width: 10, height: 10)
                                    Text(entry.label).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textSecondary)
                                }
                            }
                            .buttonStyle(.plain)
                            .accessibilityAddTraits(focus == entry.key ? .isSelected : [])
                        }
                    }
                    .manicatStyle(styles.legend)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("\(label). " + series.map(\.label).joined(separator: ", "))
    }

    private func color(_ entry: ManicatStreamSeries) -> Color {
        entry.color ?? tokens.series[(series.firstIndex { $0.key == entry.key } ?? 0) % 4]
    }

    private func readout(_ picked: ManicatStreamSeries?) -> String {
        guard let picked else { return " " }
        let peak = data.map { $0.values[picked.key] ?? 0 }.max() ?? 0
        return "\(picked.label): peak \(formatValue(peak, picked))\(unit.isEmpty ? "" : " \(unit)")"
    }

    private var bands: some View {
        let totals = data.map { datum in series.reduce(0) { $0 + (datum.values[$1.key] ?? 0) } }
        let peak = max(totals.max() ?? 1, 1)

        return GeometryReader { proxy in
            let x = ManicatChart.linearScale(domain: (0, Double(max(1, data.count - 1))), range: (0, Double(proxy.size.width)))
            let y = ManicatChart.linearScale(domain: offset == .zero ? (0, peak) : (-peak / 2, peak / 2), range: (Double(height), 0))
            let layers = stack(totals: totals, x: x, y: y)

            ZStack {
                ForEach(layers, id: \.entry.key) { layer in
                    layer.path.fill(color(layer.entry))
                        .opacity(focus == nil || focus == layer.entry.key ? 0.85 : 0.2)
                        .onTapGesture { focus = focus == layer.entry.key ? nil : layer.entry.key }
                        .accessibilityLabel(layer.entry.label)
                }
            }
        }
        .frame(height: height)
    }

    private func stack(totals: [Double], x: ManicatChart.Scale, y: ManicatChart.Scale) -> [(entry: ManicatStreamSeries, path: Path)] {
        var lower = data.indices.map { offset == .zero ? 0 : -totals[$0] / 2 }
        return series.map { entry in
            let upper = lower.enumerated().map { $0.element + (data[$0.offset].values[entry.key] ?? 0) }
            let top = upper.enumerated().map { CGPoint(x: x(Double($0.offset)), y: y($0.element)) }
            let bottom = lower.enumerated().map { CGPoint(x: x(Double($0.offset)), y: y($0.element)) }
            lower = upper
            return (entry, ManicatChart.bandPath(upper: top, lower: bottom))
        }
    }
}
