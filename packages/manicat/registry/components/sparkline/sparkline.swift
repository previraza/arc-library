import SwiftUI

public enum ManicatSparklineTone { case accent, success, warning, danger }

/// Mirrors sparkline.tsx / sparkline.rn.tsx / sparkline.vue: a tiny trend line with a label, a headline number and the change.
public struct ManicatSparkline: View {
    public struct Styles {
        public var head: ManicatStyle = { $0 }
        public var label: ManicatStyle = { $0 }
        public var value: ManicatStyle = { $0 }
        public var change: ManicatStyle = { $0 }
        public var chart: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens

    private let data: [Double]
    private let label: String
    private let value: String?
    private let change: String?
    private let tone: ManicatSparklineTone
    private let width: CGFloat
    private let height: CGFloat
    private let area: Bool
    private let styles: Styles

    public init(data: [Double], label: String, value: String? = nil, change: String? = nil, tone: ManicatSparklineTone = .accent, width: CGFloat = 140, height: CGFloat = 40, area: Bool = true, styles: Styles = Styles()) {
        self.data = data
        self.label = label
        self.value = value
        self.change = change
        self.tone = tone
        self.width = width
        self.height = height
        self.area = area
        self.styles = styles
    }

    public var body: some View {
        let color = toneColor
        let down = change.map { $0.trimmingCharacters(in: .whitespaces).hasPrefix("-") || $0.trimmingCharacters(in: .whitespaces).hasPrefix("−") } ?? false
        let points = self.points

        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: ManicatMetrics.space.s3) {
                Text(label).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textSecondary).manicatStyle(styles.label)
                Spacer(minLength: 0)
                if let change {
                    Text(change)
                        .font(.system(size: ManicatMetrics.textXs, weight: .medium))
                        .foregroundStyle(down ? tokens.danger : tokens.success)
                        .manicatStyle(styles.change)
                }
            }
            .manicatStyle(styles.head)
            if let value {
                Text(value).font(.system(size: 24, weight: .semibold)).monospacedDigit().foregroundStyle(tokens.foreground).manicatStyle(styles.value)
            }
            ZStack {
                if area { ManicatChart.areaPath(points, baseline: height).fill(color.opacity(0.12)) }
                ManicatChart.linePath(points).stroke(color, style: StrokeStyle(lineWidth: 1.75, lineCap: .round, lineJoin: .round))
            }
            .frame(width: width, height: height)
            .accessibilityHidden(true)
            .manicatStyle(styles.chart)
        }
        .padding(ManicatMetrics.space.s4)
        .background(tokens.surface, in: RoundedRectangle(cornerRadius: 26))
        .overlay(RoundedRectangle(cornerRadius: 26).stroke(tokens.border, lineWidth: 1))
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(label)\(value.map { ": \($0)" } ?? "")\(change.map { ", \($0)" } ?? "")")
    }

    private var toneColor: Color {
        switch tone { case .accent: return tokens.series[0]; case .success: return tokens.success; case .warning: return tokens.warning; case .danger: return tokens.danger }
    }

    private var points: [CGPoint] {
        let x = ManicatChart.linearScale(domain: (0, Double(max(1, data.count - 1))), range: (2, Double(width) - 2))
        let y = ManicatChart.linearScale(domain: (data.min() ?? 0, data.max() ?? 1), range: (Double(height) - 3, 3))
        return data.enumerated().map { CGPoint(x: x(Double($0.offset)), y: y($0.element)) }
    }
}
