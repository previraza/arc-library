import SwiftUI

public struct ManicatDonutDatum: Identifiable {
    public var id: String { key }
    public let key: String
    public let label: String
    public let value: Double
    public let color: Color?

    public init(key: String, label: String, value: Double, color: Color? = nil) {
        self.key = key
        self.label = label
        self.value = value
        self.color = color
    }
}

/// Mirrors donut-chart.tsx / donut-chart.rn.tsx / donut-chart.vue: a ring split by share, with the total (or the focused slice) in
/// the middle and a legend that hides slices. Small slices can fold into one "Other".
public struct ManicatDonutChart: View {
    public struct Styles {
        public var center: ManicatStyle = { $0 }
        public var total: ManicatStyle = { $0 }
        public var legend: ManicatStyle = { $0 }
        public var legendItem: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @State private var hidden: Set<String> = []
    @State private var active: String?

    private let data: [ManicatDonutDatum]
    private let label: String
    private let unit: String
    private let formatValue: (Double) -> String
    private let totalLabel: String
    private let size: CGFloat
    private let thickness: CGFloat
    private let groupBelow: Double
    private let otherLabel: String
    private let legend: Bool
    private let emptyLabel: String
    private let styles: Styles

    public init(data: [ManicatDonutDatum], label: String, unit: String = "", formatValue: @escaping (Double) -> String = { $0.formatted() }, totalLabel: String = "Total", size: CGFloat = 180, thickness: CGFloat = 22, groupBelow: Double = 0, otherLabel: String = "Other", legend: Bool = true, emptyLabel: String = "No data yet", styles: Styles = Styles()) {
        self.data = data
        self.label = label
        self.unit = unit
        self.formatValue = formatValue
        self.totalLabel = totalLabel
        self.size = size
        self.thickness = thickness
        self.groupBelow = groupBelow
        self.otherLabel = otherLabel
        self.legend = legend
        self.emptyLabel = emptyLabel
        self.styles = styles
    }

    public var body: some View {
        let grand = data.reduce(0) { $0 + $1.value }

        if grand <= 0 {
            Text(emptyLabel).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.textMuted)
        } else {
            let entries = items(grand: grand)
            let visible = entries.filter { !hidden.contains($0.key) }
            let total = visible.reduce(0) { $0 + $1.value }
            let picked = entries.first { $0.key == active }

            VStack(spacing: ManicatMetrics.space.s3) {
                ZStack {
                    ForEach(Array(arcs(visible, total: total).enumerated()), id: \.element.datum.key) { _, arc in
                        arc.path.fill(color(arc.datum, in: entries))
                            .opacity(active == nil || active == arc.datum.key ? 1 : 0.35)
                            .onTapGesture { active = active == arc.datum.key ? nil : arc.datum.key }
                            .accessibilityLabel("\(arc.datum.label), \(formatValue(arc.datum.value))")
                    }
                    VStack(spacing: 0) {
                        Text(formatValue(picked?.value ?? total)).font(.system(size: 22, weight: .semibold)).monospacedDigit().foregroundStyle(tokens.foreground).manicatStyle(styles.total)
                        Text(picked?.label ?? "\(totalLabel)\(unit.isEmpty ? "" : " · \(unit)")").font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted)
                    }
                    .manicatStyle(styles.center)
                }
                .frame(width: size, height: size)
                .accessibilityElement(children: .contain)
                .accessibilityLabel("\(label). " + entries.map { "\($0.label) \(formatValue($0.value))" }.joined(separator: ", "))
                if legend {
                    ManicatFlowLayout(spacing: ManicatMetrics.space.s3, lineSpacing: 6) {
                        ForEach(entries) { entry in
                            let off = hidden.contains(entry.key)
                            Button { if off { hidden.remove(entry.key) } else { hidden.insert(entry.key) } } label: {
                                HStack(spacing: 6) {
                                    Circle().fill(off ? tokens.border : color(entry, in: entries)).frame(width: 10, height: 10)
                                    Text(entry.label).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(off ? tokens.textMuted : tokens.textSecondary)
                                    Text("\(Int((entry.value / grand * 100).rounded()))%").font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted)
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
        }
    }

    private func items(grand: Double) -> [ManicatDonutDatum] {
        let small = groupBelow > 0 ? data.filter { $0.value / max(1, grand) < groupBelow } : []
        guard small.count > 1 else { return data }
        let rest = data.filter { entry in !small.contains { $0.key == entry.key } }
        return rest + [ManicatDonutDatum(key: "other", label: otherLabel, value: small.reduce(0) { $0 + $1.value })]
    }

    private func color(_ entry: ManicatDonutDatum, in entries: [ManicatDonutDatum]) -> Color {
        entry.color ?? tokens.series[(entries.firstIndex { $0.key == entry.key } ?? 0) % 4]
    }

    private func arcs(_ visible: [ManicatDonutDatum], total: Double) -> [(datum: ManicatDonutDatum, path: Path)] {
        let radius = size / 2
        var angle = 0.0
        return visible.map { datum in
            let span = datum.value / max(1, total) * Double.pi * 2
            let path = ManicatChart.arcPath(center: CGPoint(x: radius, y: radius), outer: radius - 2, inner: radius - thickness, from: angle, to: angle + max(0.001, span - 0.02))
            angle += span
            return (datum, path)
        }
    }
}
