import SwiftUI

public struct ManicatTreemapNode: Identifiable {
    public let id: String
    public let label: String
    public let value: Double?
    /// A second measure drawn as colour, such as growth. Negative reads red, positive green.
    public let color: Double?
    public let children: [ManicatTreemapNode]

    public init(id: String, label: String, value: Double? = nil, color: Double? = nil, children: [ManicatTreemapNode] = []) {
        self.id = id
        self.label = label
        self.value = value
        self.color = color
        self.children = children
    }

    var total: Double { value ?? children.reduce(0) { $0 + $1.total } }
}

/// Mirrors treemap.tsx / treemap.rn.tsx / treemap.vue: nested rectangles sized by value. Press a group to drill in, and use the
/// crumbs to go back.
public struct ManicatTreemap: View {
    public struct Styles {
        public var cell: ManicatStyle = { $0 }
        public var cellText: ManicatStyle = { $0 }
        public var crumb: ManicatStyle = { $0 }
        public var readout: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @State private var trail: [ManicatTreemapNode]
    @State private var active: String?

    private let root: ManicatTreemapNode
    private let label: String
    private let formatValue: (Double) -> String
    private let colorLabel: String
    private let formatColor: (Double) -> String
    private let colorDomain: (Double, Double)
    private let height: CGFloat
    private let emptyLabel: String
    private let styles: Styles

    public init(_ root: ManicatTreemapNode, label: String, formatValue: @escaping (Double) -> String = { $0.formatted() }, colorLabel: String = "Change", formatColor: @escaping (Double) -> String = { "\($0 > 0 ? "+" : "")\(Int($0))%" }, colorDomain: (Double, Double) = (-50, 100), height: CGFloat = 240, emptyLabel: String = "No data yet", styles: Styles = Styles()) {
        self.root = root
        self.label = label
        self.formatValue = formatValue
        self.colorLabel = colorLabel
        self.formatColor = formatColor
        self.colorDomain = colorDomain
        self.height = height
        self.emptyLabel = emptyLabel
        self.styles = styles
        self._trail = State(wrappedValue: [root])
    }

    public var body: some View {
        let current = trail[trail.count - 1]
        let children = current.children.filter { $0.total > 0 }
        let picked = children.first { $0.id == active }

        VStack(alignment: .leading, spacing: ManicatMetrics.space.s2) {
            HStack(spacing: 4) {
                ForEach(Array(trail.enumerated()), id: \.element.id) { index, node in
                    Button { trail = Array(trail.prefix(index + 1)) } label: {
                        Text((index == 0 ? label : node.label) + (index < trail.count - 1 ? " ›" : ""))
                            .font(.system(size: ManicatMetrics.textSm, weight: index == trail.count - 1 ? .medium : .regular))
                            .foregroundStyle(index == trail.count - 1 ? tokens.foreground : tokens.textSecondary)
                            .manicatStyle(styles.crumb)
                    }
                    .buttonStyle(.plain)
                    .disabled(index == trail.count - 1)
                }
            }
            Text(picked.map { "\($0.label): \(formatValue($0.total))" + ($0.color.map { " · \(colorLabel) \(formatColor($0))" } ?? "") } ?? "\(formatValue(current.total)) total")
                .font(.system(size: ManicatMetrics.textXs))
                .foregroundStyle(tokens.textSecondary)
                .manicatStyle(styles.readout)
            if children.isEmpty {
                Text(emptyLabel).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.textMuted)
            } else {
                GeometryReader { proxy in
                    let rects = ManicatChart.squarify(children.map(\.total), in: CGRect(x: 0, y: 0, width: proxy.size.width, height: height))
                    ZStack(alignment: .topLeading) {
                        ForEach(Array(children.enumerated()), id: \.element.id) { index, child in
                            let rect = rects[index]
                            Button { open(child) } label: {
                                ZStack(alignment: .topLeading) {
                                    RoundedRectangle(cornerRadius: 8).fill(fill(child, index: index))
                                    if rect.width > 54, rect.height > 32 {
                                        Text(child.label).font(.system(size: ManicatMetrics.textXs, weight: .medium)).foregroundStyle(tokens.foreground).padding(8).manicatStyle(styles.cellText)
                                    }
                                }
                                .overlay(RoundedRectangle(cornerRadius: 8).stroke(active == child.id ? tokens.foreground : .clear, lineWidth: 1))
                                .manicatStyle(styles.cell)
                            }
                            .buttonStyle(.plain)
                            .frame(width: max(0, rect.width - 2), height: max(0, rect.height - 2))
                            .offset(x: rect.minX, y: rect.minY)
                            .onHover { inside in active = inside ? child.id : nil }
                            .accessibilityLabel("\(child.label), \(formatValue(child.total))" + (child.color.map { ", \(colorLabel) \(formatColor($0))" } ?? ""))
                        }
                    }
                }
                .frame(height: height)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func open(_ child: ManicatTreemapNode) {
        if child.children.isEmpty { active = active == child.id ? nil : child.id } else { trail.append(child) }
    }

    private func fill(_ node: ManicatTreemapNode, index: Int) -> Color {
        guard let value = node.color else { return tokens.series[index % 4].opacity(0.2) }
        let limit = value >= 0 ? colorDomain.1 : colorDomain.0
        let amount = min(1, abs(value) / max(1, abs(limit))) * 0.7 + 0.1
        return (value >= 0 ? tokens.success : tokens.danger).opacity(amount)
    }
}
