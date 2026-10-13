import SwiftUI

public enum ManicatGaugeTone { case accent, success, warning, danger }

/// A band that starts at `from`: the highest band the value reaches sets the tone and names the state.
public struct ManicatGaugeThreshold {
    public let from: Double
    public let tone: ManicatGaugeTone
    public let label: String

    public init(from: Double, tone: ManicatGaugeTone, label: String) {
        self.from = from
        self.tone = tone
        self.label = label
    }
}

/// Mirrors gauge.tsx / gauge.rn.tsx / gauge.vue: a 270 degree dial that fills as the value rises.
public struct ManicatGauge: View {
    public struct Styles {
        public var track: ManicatStyle = { $0 }
        public var fill: ManicatStyle = { $0 }
        public var readout: ManicatStyle = { $0 }
        public var label: ManicatStyle = { $0 }
        public var detail: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens

    private let value: Double
    private let range: ClosedRange<Double>
    private let label: String
    private let detail: String?
    private let tone: ManicatGaugeTone
    private let thresholds: [ManicatGaugeThreshold]
    private let styles: Styles

    public init(value: Double, range: ClosedRange<Double> = 0...100, label: String, detail: String? = nil, tone: ManicatGaugeTone = .accent, thresholds: [ManicatGaugeThreshold] = [], styles: Styles = Styles()) {
        self.value = value
        self.range = range
        self.label = label
        self.detail = detail
        self.tone = tone
        self.thresholds = thresholds
        self.styles = styles
    }

    public var body: some View {
        let clamped = min(max(value, range.lowerBound), range.upperBound)
        let span = range.upperBound - range.lowerBound
        let percent = span == 0 ? 0 : (clamped - range.lowerBound) / span * 100
        let band = thresholds.sorted { $0.from < $1.from }.last { clamped >= $0.from }
        let color = toneColor(band?.tone ?? tone)

        VStack(spacing: 6) {
            ZStack {
                // A 270 degree dial that opens at the bottom: the arc runs from 135 to 405 degrees.
                Circle().trim(from: 0, to: 0.75)
                    .stroke(tokens.surfaceMuted, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                    .manicatStyle(styles.track)
                Circle().trim(from: 0, to: 0.75 * percent / 100)
                    .stroke(color, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                    .animation(.timingCurve(0.215, 0.61, 0.355, 1, duration: 0.5), value: percent)
                    .manicatStyle(styles.fill)
                Text("\(Int(percent.rounded()))%")
                    .font(.system(size: 24, weight: .semibold)).monospacedDigit()
                    .foregroundStyle(tokens.foreground)
                    .manicatStyle(styles.readout)
            }
            .rotationEffect(.degrees(135))
            .frame(width: 112, height: 112)
            Text(label).font(.system(size: ManicatMetrics.textSm, weight: .medium)).foregroundStyle(tokens.foreground).manicatStyle(styles.label)
            if let band {
                Text(band.label).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(color)
            } else if let detail {
                Text(detail).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted).manicatStyle(styles.detail)
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(label)\(band.map { ", \($0.label)" } ?? "")")
        .accessibilityValue("\(Int(percent.rounded())) percent")
    }

    private func toneColor(_ tone: ManicatGaugeTone) -> Color {
        switch tone { case .accent: return tokens.accent; case .success: return tokens.success; case .warning: return tokens.warning; case .danger: return tokens.danger }
    }
}
