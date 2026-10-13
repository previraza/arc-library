import SwiftUI

public struct ManicatLineSeries: Identifiable {
    public var id: String { key }
    public let key: String
    public let label: String
    public let color: Color?
    public let dashed: Bool
    public let area: Bool

    public init(key: String, label: String, color: Color? = nil, dashed: Bool = false, area: Bool = false) {
        self.key = key
        self.label = label
        self.color = color
        self.dashed = dashed
        self.area = area
    }
}

public struct ManicatLineDatum: Identifiable {
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

/// Mirrors line-chart.tsx / line-chart.rn.tsx / line-chart.vue: lines over a shared scale, a reading that follows the pointer or the
/// arrow keys, and a legend that hides series.
public struct ManicatLineChart: View {
    public struct Styles {
        public var readout: ManicatStyle = { $0 }
        public var legend: ManicatStyle = { $0 }
        public var legendItem: ManicatStyle = { $0 }
        public var axis: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @State private var hidden: Set<String> = []
    @State private var active: Int?

    private let data: [ManicatLineDatum]
    private let series: [ManicatLineSeries]
    private let label: String
    private let unit: String
    private let height: CGFloat
    private let curve: ManicatChart.Curve
    private let legend: Bool
    private let emptyLabel: String
    private let formatValue: (Double, ManicatLineSeries) -> String
    private let formatTick: (Double) -> String
    private let styles: Styles

    public init(data: [ManicatLineDatum], series: [ManicatLineSeries], label: String, unit: String = "", height: CGFloat = 220, curve: ManicatChart.Curve = .smooth, legend: Bool = true, emptyLabel: String = "No data yet", formatValue: @escaping (Double, ManicatLineSeries) -> String = { value, _ in value.formatted() }, formatTick: @escaping (Double) -> String = { ManicatChart.compact($0) }, styles: Styles = Styles()) {
        self.data = data
        self.series = series
        self.label = label
        self.unit = unit
        self.height = height
        self.curve = curve
        self.legend = legend
        self.emptyLabel = emptyLabel
        self.formatValue = formatValue
        self.formatTick = formatTick
        self.styles = styles
    }

    public var body: some View {
        let shown = series.filter { !hidden.contains($0.key) }

        VStack(alignment: .leading, spacing: ManicatMetrics.space.s2) {
            Text(label).font(.system(size: ManicatMetrics.textSm, weight: .medium)).foregroundStyle(tokens.foreground)
            if data.isEmpty {
                Text(emptyLabel).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.textMuted)
            } else {
                Text(readout(shown))
                    .font(.system(size: ManicatMetrics.textXs))
                    .foregroundStyle(tokens.textSecondary)
                    .frame(minHeight: 16, alignment: .leading)
                    .manicatStyle(styles.readout)
                plot(shown)
                HStack {
                    ForEach(data.filter { $0.axisLabel != nil }) { datum in
                        Text(datum.axisLabel ?? "").font(.system(size: 10)).foregroundStyle(tokens.textMuted).manicatStyle(styles.axis).frame(maxWidth: .infinity)
                    }
                }
                if legend { legendRow }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("\(label). " + shown.map(\.label).joined(separator: ", "))
    }

    private func color(_ entry: ManicatLineSeries) -> Color {
        entry.color ?? tokens.series[(series.firstIndex { $0.key == entry.key } ?? 0) % 4]
    }

    private func readout(_ shown: [ManicatLineSeries]) -> String {
        guard let active, data.indices.contains(active) else { return " " }
        let datum = data[active]
        let suffix = unit.isEmpty ? "" : " \(unit)"
        return "\(datum.label) · " + shown.map { "\($0.label) \(formatValue(datum.values[$0.key] ?? 0, $0))\(suffix)" }.joined(separator: " · ")
    }

    private func plot(_ shown: [ManicatLineSeries]) -> some View {
        let top = ManicatChart.niceMax(shown.flatMap { entry in data.map { $0.values[entry.key] ?? 0 } }.max() ?? 0)
        let ticks = ManicatChart.ticks(top, count: 4)
        let left: CGFloat = 36

        return GeometryReader { proxy in
            let width = proxy.size.width
            let x = ManicatChart.linearScale(domain: (0, Double(max(1, data.count - 1))), range: (Double(left), Double(width) - 8))
            let y = ManicatChart.linearScale(domain: (0, top), range: (Double(height) - 22, 8))

            ZStack(alignment: .topLeading) {
                ForEach(ticks, id: \.self) { tick in
                    Path { path in
                        path.move(to: CGPoint(x: left, y: y(tick)))
                        path.addLine(to: CGPoint(x: width - 8, y: y(tick)))
                    }
                    .stroke(tokens.border, lineWidth: 1)
                    Text(formatTick(tick)).font(.system(size: 10)).foregroundStyle(tokens.textMuted).position(x: left / 2 - 2, y: y(tick))
                }
                ForEach(shown) { entry in
                    let points = data.enumerated().compactMap { index, datum in datum.values[entry.key].map { CGPoint(x: x(Double(index)), y: y($0)) } }
                    if entry.area { ManicatChart.areaPath(points, baseline: y(0), curve: curve).fill(color(entry).opacity(0.12)) }
                    ManicatChart.linePath(points, curve: curve)
                        .stroke(color(entry), style: StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round, dash: entry.dashed ? [5, 5] : []))
                }
                if let active, data.indices.contains(active) {
                    Path { path in
                        path.move(to: CGPoint(x: x(Double(active)), y: 8))
                        path.addLine(to: CGPoint(x: x(Double(active)), y: height - 22))
                    }
                    .stroke(tokens.borderStrong, lineWidth: 1)
                    ForEach(shown.filter { data[active].values[$0.key] != nil }) { entry in
                        Circle().fill(color(entry)).frame(width: 8, height: 8).position(x: x(Double(active)), y: y(data[active].values[entry.key] ?? 0))
                    }
                }
            }
            .contentShape(Rectangle())
            .gesture(DragGesture(minimumDistance: 0).onChanged { drag in
                let ratio = (Double(drag.location.x) - Double(left)) / max(1, Double(width) - 8 - Double(left))
                active = max(0, min(data.count - 1, Int((ratio * Double(data.count - 1)).rounded())))
            })
            .onHover { inside in if !inside { active = nil } }
        }
        .frame(height: height)
        .accessibilityAdjustableAction { direction in
            let last = data.count - 1
            switch direction {
            case .increment: active = min(last, (active ?? -1) + 1)
            case .decrement: active = max(0, (active ?? 1) - 1)
            @unknown default: break
            }
        }
    }

    private var legendRow: some View {
        ManicatFlowLayout(spacing: ManicatMetrics.space.s3, lineSpacing: 6) {
            ForEach(series) { entry in
                let off = hidden.contains(entry.key)
                Button { if off { hidden.remove(entry.key) } else { hidden.insert(entry.key) } } label: {
                    HStack(spacing: 6) {
                        Circle().fill(off ? tokens.border : color(entry)).frame(width: 10, height: 10)
                        Text(entry.label).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(off ? tokens.textMuted : tokens.textSecondary)
                    }
                    .manicatStyle(styles.legendItem)
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(off ? [] : .isSelected)
            }
        }
        .manicatStyle(styles.legend)
    }
}
