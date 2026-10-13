import SwiftUI

public struct ManicatWaffleCategory: Identifiable {
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

/// Mirrors waffle-chart.tsx / waffle-chart.rn.tsx / waffle-chart.vue: a grid of squares split among categories by share. The
/// squares always add up to the grid (largest-remainder allocation).
public struct ManicatWaffleChart: View {
    public struct Styles {
        public var grid: ManicatStyle = { $0 }
        public var cell: ManicatStyle = { $0 }
        public var readout: ManicatStyle = { $0 }
        public var legend: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @State private var active: String?

    private let data: [ManicatWaffleCategory]
    private let label: String
    private let unit: String
    private let formatValue: (Double, ManicatWaffleCategory) -> String
    private let rows: Int
    private let columns: Int
    private let accentKey: String?
    private let legend: Bool
    private let decimals: Int
    private let emptyLabel: String
    private let styles: Styles

    public init(data: [ManicatWaffleCategory], label: String, unit: String = "", formatValue: @escaping (Double, ManicatWaffleCategory) -> String = { value, _ in value.formatted() }, rows: Int = 10, columns: Int = 10, accentKey: String? = nil, legend: Bool = true, decimals: Int = 0, emptyLabel: String = "No data yet", styles: Styles = Styles()) {
        self.data = data
        self.label = label
        self.unit = unit
        self.formatValue = formatValue
        self.rows = rows
        self.columns = columns
        self.accentKey = accentKey
        self.legend = legend
        self.decimals = decimals
        self.emptyLabel = emptyLabel
        self.styles = styles
    }

    public var body: some View {
        let total = data.reduce(0) { $0 + $1.value }

        if total <= 0 {
            Text(emptyLabel).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.textMuted)
        } else {
            let owners = allocate(total: total)
            let picked = data.first { $0.key == active }

            VStack(alignment: .leading, spacing: ManicatMetrics.space.s3) {
                Text(readout(for: picked, total: total))
                    .font(.system(size: ManicatMetrics.textXs))
                    .foregroundStyle(tokens.textSecondary)
                    .frame(minHeight: 16, alignment: .leading)
                    .manicatStyle(styles.readout)
                VStack(spacing: 4) {
                    ForEach(0..<rows, id: \.self) { row in
                        HStack(spacing: 4) {
                            ForEach(0..<columns, id: \.self) { column in
                                let owner = owners[min(row * columns + column, owners.count - 1)]
                                let key = data[owner].key
                                let dimmed = (accentKey != nil && key != accentKey) || (active != nil && key != active)
                                RoundedRectangle(cornerRadius: 4)
                                    .fill(color(owner))
                                    .opacity(dimmed ? 0.3 : 1)
                                    .frame(width: 18, height: 18)
                                    .manicatStyle(styles.cell)
                                    .onTapGesture { active = active == key ? nil : key }
                            }
                        }
                    }
                }
                .manicatStyle(styles.grid)
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(summary(total: total))
                if legend {
                    ManicatFlowLayout(spacing: ManicatMetrics.space.s3, lineSpacing: 6) {
                        ForEach(Array(data.enumerated()), id: \.element.id) { index, category in
                            Button { active = active == category.key ? nil : category.key } label: {
                                HStack(spacing: 6) {
                                    Circle().fill(color(index)).frame(width: 10, height: 10)
                                    Text(category.label).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textSecondary)
                                }
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .manicatStyle(styles.legend)
                }
            }
        }
    }

    private func readout(for category: ManicatWaffleCategory?, total: Double) -> String {
        guard let category else { return " " }
        let suffix = unit.isEmpty ? "" : " \(unit)"
        return "\(category.label): \(formatValue(category.value, category))\(suffix) · \(percent(category.value, total))%"
    }

    private func summary(total: Double) -> String {
        let parts = data.map { "\($0.label) \(formatValue($0.value, $0)), \(percent($0.value, total))%" }
        return "\(label). " + parts.joined(separator: ", ")
    }

    private func color(_ index: Int) -> Color { data[index].color ?? tokens.series[index % 4] }
    private func percent(_ value: Double, _ total: Double) -> String { String(format: "%.\(decimals)f", value / total * 100) }

    /// Largest-remainder allocation, so the squares always add up to the grid.
    private func allocate(total: Double) -> [Int] {
        let cells = rows * columns
        let exact = data.map { $0.value / max(1, total) * Double(cells) }
        var counts = exact.map { Int($0.rounded(.down)) }
        let order = exact.enumerated().map { (index: $0.offset, rest: $0.element - $0.element.rounded(.down)) }.sorted { $0.rest > $1.rest }
        var left = cells - counts.reduce(0, +)
        var at = 0
        while left > 0, !order.isEmpty {
            counts[order[at % order.count].index] += 1
            left -= 1
            at += 1
        }
        return counts.enumerated().flatMap { Array(repeating: $0.offset, count: $0.element) }
    }
}
