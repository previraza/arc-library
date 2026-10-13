import SwiftUI

public struct ManicatSlopeItem: Identifiable {
    public var id: String { key }
    public let key: String
    public let label: String
    public let start: Double
    public let end: Double

    public init(key: String, label: String, start: Double, end: Double) {
        self.key = key
        self.label = label
        self.start = start
        self.end = end
    }
}

/// Mirrors slope-chart.tsx / slope-chart.rn.tsx / slope-chart.vue: one line per item from its start value to its end value.
public struct ManicatSlopeChart: View {
    public struct Styles {
        public var heading: ManicatStyle = { $0 }
        public var readout: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @State private var active: String?

    private let data: [ManicatSlopeItem]
    private let label: String
    private let startLabel: String
    private let endLabel: String
    private let formatValue: (Double) -> String
    private let formatChange: (Double, ManicatSlopeItem) -> String
    private let height: CGFloat
    private let highlightKey: String?
    private let ranks: Bool
    private let emptyLabel: String
    private let styles: Styles

    public init(data: [ManicatSlopeItem], label: String, startLabel: String, endLabel: String, formatValue: @escaping (Double) -> String = { String(Int($0)) }, formatChange: @escaping (Double, ManicatSlopeItem) -> String = { change, _ in "\(change > 0 ? "+" : "")\(Int(change))" }, height: CGFloat = 220, highlightKey: String? = nil, ranks: Bool = false, emptyLabel: String = "No data yet", styles: Styles = Styles()) {
        self.data = data
        self.label = label
        self.startLabel = startLabel
        self.endLabel = endLabel
        self.formatValue = formatValue
        self.formatChange = formatChange
        self.height = height
        self.highlightKey = highlightKey
        self.ranks = ranks
        self.emptyLabel = emptyLabel
        self.styles = styles
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: ManicatMetrics.space.s2) {
            Text(label).font(.system(size: ManicatMetrics.textSm, weight: .medium)).foregroundStyle(tokens.foreground)
            if data.isEmpty {
                Text(emptyLabel).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.textMuted)
            } else {
                Text(active.flatMap { key in data.first { $0.key == key } }.map { "\($0.label): \(formatValue($0.start)) → \(formatValue($0.end)) (\(formatChange($0.end - $0.start, $0)))" } ?? " ")
                    .font(.system(size: ManicatMetrics.textXs))
                    .foregroundStyle(tokens.textSecondary)
                    .frame(minHeight: 16, alignment: .leading)
                    .manicatStyle(styles.readout)
                chart
                HStack {
                    Text(startLabel).manicatStyle(styles.heading)
                    Spacer(minLength: 0)
                    Text(endLabel).manicatStyle(styles.heading)
                }
                .font(.system(size: ManicatMetrics.textXs, weight: .medium))
                .foregroundStyle(tokens.textMuted)
                .padding(.horizontal, 86)
                if ranks {
                    Text("Ranked by \(endLabel): " + data.sorted { $0.end > $1.end }.map(\.label).joined(separator: " › "))
                        .font(.system(size: ManicatMetrics.textXs))
                        .foregroundStyle(tokens.textMuted)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var chart: some View {
        let side: CGFloat = 110
        let low = data.flatMap { [$0.start, $0.end] }.min() ?? 0
        let high = data.flatMap { [$0.start, $0.end] }.max() ?? 1
        let y = ManicatChart.linearScale(domain: (low, high), range: (Double(height) - 12, 12))
        let focus = active ?? highlightKey

        return GeometryReader { proxy in
            ForEach(data) { item in
                let up = item.end >= item.start
                let color = up ? tokens.success : tokens.danger
                let dim = focus != nil && focus != item.key
                let a = CGPoint(x: side, y: y(item.start))
                let b = CGPoint(x: proxy.size.width - side, y: y(item.end))
                ZStack(alignment: .topLeading) {
                    Path { path in
                        path.move(to: a)
                        path.addLine(to: b)
                    }
                    .stroke(color, lineWidth: 2)
                    Circle().fill(color).frame(width: 8, height: 8).position(a)
                    Circle().fill(color).frame(width: 8, height: 8).position(b)
                    Text("\(item.label) \(formatValue(item.start))")
                        .font(.system(size: 11)).monospacedDigit().foregroundStyle(tokens.foreground)
                        .frame(width: side - 10, alignment: .trailing)
                        .position(x: (side - 10) / 2, y: a.y)
                    Text(formatValue(item.end))
                        .font(.system(size: 11)).monospacedDigit().foregroundStyle(tokens.foreground)
                        .frame(width: side - 10, alignment: .leading)
                        .position(x: proxy.size.width - side + 10 + (side - 10) / 2, y: b.y)
                }
                .opacity(dim ? 0.3 : 1)
                .onTapGesture { active = active == item.key ? nil : item.key }
                .accessibilityLabel("\(item.label), \(formatValue(item.start)) to \(formatValue(item.end))")
            }
        }
        .frame(height: height)
    }
}
