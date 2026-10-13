import SwiftUI

/// Mirrors slider.tsx / slider.rn.tsx / slider.vue. `ManicatSlider` has one thumb; `ManicatRangeSlider` has two. Arrow keys,
/// Page Up / Page Down, Home and End move a thumb on the Mac, and VoiceOver can adjust the value.
public struct ManicatSliderStyles {
    public var label: ManicatStyle = { $0 }
    public var value: ManicatStyle = { $0 }
    public var track: ManicatStyle = { $0 }
    public var range: ManicatStyle = { $0 }
    public var thumb: ManicatStyle = { $0 }
    public init() {}
}

public struct ManicatSlider: View {
    @Binding private var value: Double
    private let label: String
    private let bounds: ClosedRange<Double>
    private let step: Double
    private let format: (Double) -> String
    private let showValue: Bool
    private let styles: ManicatSliderStyles
    private let onCommit: ((Double) -> Void)?

    public init(_ label: String, value: Binding<Double>, in bounds: ClosedRange<Double> = 0...100, step: Double = 1, format: @escaping (Double) -> String = { String(Int($0)) }, showValue: Bool = true, styles: ManicatSliderStyles = ManicatSliderStyles(), onCommit: ((Double) -> Void)? = nil) {
        self.label = label
        self._value = value
        self.bounds = bounds
        self.step = step
        self.format = format
        self.showValue = showValue
        self.styles = styles
        self.onCommit = onCommit
    }

    public var body: some View {
        ManicatSliderCore(label: label, values: Binding(get: { [bounds.lowerBound, value] }, set: { value = $0[1] }), ranged: false, bounds: bounds, step: step, format: format, showValue: showValue, styles: styles, onCommit: { onCommit?($0[1]) })
    }
}

public struct ManicatRangeSlider: View {
    @Binding private var value: ClosedRange<Double>
    private let label: String
    private let bounds: ClosedRange<Double>
    private let step: Double
    private let format: (Double) -> String
    private let showValue: Bool
    private let styles: ManicatSliderStyles
    private let onCommit: ((ClosedRange<Double>) -> Void)?

    public init(_ label: String, value: Binding<ClosedRange<Double>>, in bounds: ClosedRange<Double> = 0...100, step: Double = 1, format: @escaping (Double) -> String = { String(Int($0)) }, showValue: Bool = true, styles: ManicatSliderStyles = ManicatSliderStyles(), onCommit: ((ClosedRange<Double>) -> Void)? = nil) {
        self.label = label
        self._value = value
        self.bounds = bounds
        self.step = step
        self.format = format
        self.showValue = showValue
        self.styles = styles
        self.onCommit = onCommit
    }

    public var body: some View {
        ManicatSliderCore(label: label, values: Binding(get: { [value.lowerBound, value.upperBound] }, set: { value = $0[0]...max($0[0], $0[1]) }), ranged: true, bounds: bounds, step: step, format: format, showValue: showValue, styles: styles, onCommit: { onCommit?($0[0]...max($0[0], $0[1])) })
    }
}

struct ManicatSliderCore: View {
    @Environment(\.manicat) private var tokens
    @Environment(\.isEnabled) private var enabled
    @State private var active = 1

    let label: String
    @Binding var values: [Double]
    let ranged: Bool
    let bounds: ClosedRange<Double>
    let step: Double
    let format: (Double) -> String
    let showValue: Bool
    let styles: ManicatSliderStyles
    let onCommit: ([Double]) -> Void

    private let thumb: CGFloat = 22

    var body: some View {
        let low = ranged ? values[0] : bounds.lowerBound
        let high = values[1]

        VStack(alignment: .leading, spacing: ManicatMetrics.space.s2) {
            HStack {
                Text(label).font(.system(size: ManicatMetrics.textSm, weight: .medium)).foregroundStyle(tokens.foreground).manicatStyle(styles.label)
                Spacer(minLength: 0)
                if showValue {
                    Text(ranged ? "\(format(low)) – \(format(high))" : format(high))
                        .font(.system(size: ManicatMetrics.textSm)).monospacedDigit()
                        .foregroundStyle(tokens.textSecondary)
                        .manicatStyle(styles.value)
                }
            }
            GeometryReader { proxy in
                let width = proxy.size.width
                let travel = max(1, width - thumb)
                let place = { (n: Double) -> CGFloat in CGFloat((n - bounds.lowerBound) / max(1, bounds.upperBound - bounds.lowerBound)) * travel }

                ZStack(alignment: .leading) {
                    Capsule().fill(tokens.controlTrack).frame(height: 6).manicatStyle(styles.track)
                    Capsule().fill(tokens.controlOn)
                        .frame(width: max(0, place(high) - (ranged ? place(low) : 0) + (ranged ? 0 : thumb / 2)), height: 6)
                        .offset(x: ranged ? place(low) + thumb / 2 : 0)
                        .manicatStyle(styles.range)
                    ForEach(ranged ? [0, 1] : [1], id: \.self) { index in
                        Circle().fill(tokens.controlThumb)
                            .overlay(Circle().stroke(tokens.borderStrong, lineWidth: 1))
                            .shadow(color: .black.opacity(0.18), radius: 3, y: 1)
                            .frame(width: thumb, height: thumb)
                            .manicatStyle(styles.thumb)
                            .offset(x: place(values[index]))
                    }
                }
                .frame(height: 36)
                .contentShape(Rectangle())
                .gesture(
                    DragGesture(minimumDistance: 0)
                        .onChanged { drag in move(drag.location.x, travel: travel, start: true, commit: false) }
                        .onEnded { drag in move(drag.location.x, travel: travel, start: false, commit: true) }
                )
            }
            .frame(height: 36)
            .opacity(enabled ? 1 : 0.5)
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(label)
            .accessibilityValue(ranged ? "\(format(low)) to \(format(high))" : format(high))
            .accessibilityAdjustableAction { direction in
                let delta = direction == .increment ? step : -step
                nudge(delta)
                onCommit(values)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func snap(_ n: Double) -> Double {
        max(bounds.lowerBound, min(bounds.upperBound, ((n - bounds.lowerBound) / step).rounded() * step + bounds.lowerBound))
    }

    private func nudge(_ delta: Double) {
        var next = values
        next[1] = snap(next[1] + delta)
        values = next
    }

    private func move(_ x: CGFloat, travel: CGFloat, start: Bool, commit: Bool) {
        guard enabled else { return }
        let span = bounds.upperBound - bounds.lowerBound
        let next = snap(bounds.lowerBound + Double(max(0, min(travel, x - thumb / 2)) / travel) * span)
        var updated = values
        if ranged, start {
            active = abs(next - values[0]) < abs(next - values[1]) ? 0 : 1
        }
        if !ranged { updated[1] = next }
        else if active == 0 { updated[0] = min(next, updated[1]) }
        else { updated[1] = max(next, updated[0]) }
        values = updated
        if commit { onCommit(updated) }
    }
}
