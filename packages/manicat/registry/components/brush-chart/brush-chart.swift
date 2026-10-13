import SwiftUI

public struct ManicatBrushDatum {
    public let date: Date
    public let value: Double

    public init(date: Date, value: Double) {
        self.date = date
        self.value = value
    }
}

public struct ManicatBrushAnnotation {
    public let date: Date
    public let label: String
    public let description: String?

    public init(date: Date, label: String, description: String? = nil) {
        self.date = date
        self.label = label
        self.description = description
    }
}

/// Mirrors brush-chart.tsx / brush-chart.rn.tsx / brush-chart.vue: an area chart with a range slider that zooms the window.
public struct ManicatBrushChart: View {
    public struct Styles {
        public var readout: ManicatStyle = { $0 }
        public var annotation: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @State private var active: Int?
    @State private var window: ClosedRange<Double>?

    private let data: [ManicatBrushDatum]
    private let label: String
    private let unit: String
    private let formatValue: (Double) -> String
    private let formatDate: (Date) -> String
    private let annotations: [ManicatBrushAnnotation]
    private let height: CGFloat
    private let emptyLabel: String
    private let styles: Styles

    public init(data: [ManicatBrushDatum], label: String, unit: String = "", formatValue: @escaping (Double) -> String = { $0.formatted() }, formatDate: @escaping (Date) -> String = { $0.formatted(.dateTime.month(.abbreviated).day()) }, annotations: [ManicatBrushAnnotation] = [], height: CGFloat = 200, emptyLabel: String = "No data yet", styles: Styles = Styles()) {
        self.data = data
        self.label = label
        self.unit = unit
        self.formatValue = formatValue
        self.formatDate = formatDate
        self.annotations = annotations
        self.height = height
        self.emptyLabel = emptyLabel
        self.styles = styles
    }

    public var body: some View {
        let sorted = data.sorted { $0.date < $1.date }

        VStack(alignment: .leading, spacing: ManicatMetrics.space.s2) {
            Text(label).font(.system(size: ManicatMetrics.textSm, weight: .medium)).foregroundStyle(tokens.foreground)
            if sorted.isEmpty {
                Text(emptyLabel).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.textMuted)
            } else {
                content(sorted)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    @ViewBuilder private func content(_ sorted: [ManicatBrushDatum]) -> some View {
        let first = sorted[0].date.timeIntervalSince1970
        let last = sorted[sorted.count - 1].date.timeIntervalSince1970
        let bounds = window ?? first...last
        let visible = sorted.filter { $0.date.timeIntervalSince1970 >= bounds.lowerBound && $0.date.timeIntervalSince1970 <= bounds.upperBound }
        let shown = visible.count > 1 ? visible : sorted
        let picked = active.flatMap { shown.indices.contains($0) ? shown[$0] : nil }
        let notes = annotations.filter { $0.date.timeIntervalSince1970 >= bounds.lowerBound && $0.date.timeIntervalSince1970 <= bounds.upperBound }

        Text(picked.map { "\(formatDate($0.date)): \(formatValue($0.value))\(unit.isEmpty ? "" : " \(unit)")" } ?? "\(formatDate(Date(timeIntervalSince1970: bounds.lowerBound))) – \(formatDate(Date(timeIntervalSince1970: bounds.upperBound)))")
            .font(.system(size: ManicatMetrics.textXs))
            .foregroundStyle(tokens.textSecondary)
            .manicatStyle(styles.readout)
        plot(shown, notes: notes)
        ManicatRangeSlider(
            "Window",
            value: Binding(get: { bounds }, set: { window = $0 }),
            in: first...max(first + 1, last),
            step: max(1, ((last - first) / 200).rounded()),
            format: { formatDate(Date(timeIntervalSince1970: $0)) },
            showValue: false
        )
        ForEach(Array(notes.enumerated()), id: \.offset) { _, note in
            Text("\(formatDate(note.date)) · \(note.label)\(note.description.map { " — \($0)" } ?? "")")
                .font(.system(size: ManicatMetrics.textXs))
                .foregroundStyle(tokens.textSecondary)
                .manicatStyle(styles.annotation)
        }
    }

    private func plot(_ shown: [ManicatBrushDatum], notes: [ManicatBrushAnnotation]) -> some View {
        let top = ManicatChart.niceMax(shown.map(\.value).max() ?? 0)
        let left: CGFloat = 36
        let times = shown.map { $0.date.timeIntervalSince1970 }

        return GeometryReader { proxy in
            let x = ManicatChart.linearScale(domain: (times.first ?? 0, times.last ?? 1), range: (Double(left), Double(proxy.size.width) - 8))
            let y = ManicatChart.linearScale(domain: (0, top), range: (Double(height) - 8, 8))
            let points = shown.map { CGPoint(x: x($0.date.timeIntervalSince1970), y: y($0.value)) }

            ZStack(alignment: .topLeading) {
                ForEach(ManicatChart.ticks(top, count: 3), id: \.self) { tick in
                    Path { path in
                        path.move(to: CGPoint(x: left, y: y(tick)))
                        path.addLine(to: CGPoint(x: proxy.size.width - 8, y: y(tick)))
                    }
                    .stroke(tokens.border, lineWidth: 1)
                    Text(ManicatChart.compact(tick)).font(.system(size: 10)).foregroundStyle(tokens.textMuted).position(x: left / 2 - 2, y: y(tick))
                }
                ManicatChart.areaPath(points, baseline: y(0)).fill(tokens.series[0].opacity(0.14))
                ManicatChart.linePath(points).stroke(tokens.series[0], style: StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round))
                ForEach(Array(notes.enumerated()), id: \.offset) { _, note in
                    Path { path in
                        path.move(to: CGPoint(x: x(note.date.timeIntervalSince1970), y: 8))
                        path.addLine(to: CGPoint(x: x(note.date.timeIntervalSince1970), y: height - 8))
                    }
                    .stroke(tokens.borderStrong, style: StrokeStyle(lineWidth: 1, dash: [3, 3]))
                }
                if let active, points.indices.contains(active) {
                    Circle().fill(tokens.series[0]).frame(width: 8, height: 8).position(points[active])
                }
            }
            .contentShape(Rectangle())
            .gesture(DragGesture(minimumDistance: 0).onChanged { drag in
                active = points.indices.min { abs(points[$0].x - drag.location.x) < abs(points[$1].x - drag.location.x) }
            })
        }
        .frame(height: height)
        .accessibilityLabel(label)
    }
}
