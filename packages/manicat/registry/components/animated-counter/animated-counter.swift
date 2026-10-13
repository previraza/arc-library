import SwiftUI

/// Mirrors animated-counter.tsx / animated-counter.rn.tsx / animated-counter.vue: a number that counts to its new value.
public struct ManicatAnimatedCounter: View {
    public struct Styles {
        public var label: ManicatStyle = { $0 }
        public var value: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var shown: Double = 0

    private let value: Double
    private let label: String?
    private let prefix: String
    private let suffix: String
    private let decimals: Int
    private let locale: Locale
    private let styles: Styles

    public init(value: Double, label: String? = nil, prefix: String = "", suffix: String = "", decimals: Int = 0, locale: Locale = Locale(identifier: "en_US"), styles: Styles = Styles()) {
        self.value = value
        self.label = label
        self.prefix = prefix
        self.suffix = suffix
        self.decimals = decimals
        self.locale = locale
        self.styles = styles
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            if let label {
                Text(label).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.textSecondary).manicatStyle(styles.label)
            }
            CountingText(value: shown, format: format)
                .font(.system(size: 32, weight: .semibold))
                .monospacedDigit()
                .tracking(-1)
                .foregroundStyle(tokens.foreground)
                .manicatStyle(styles.value)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(label.map { "\($0): " } ?? "")\(format(value))")
        .onAppear { count(to: value) }
        .onChange(of: value) { _, next in count(to: next) }
    }

    private func count(to target: Double) {
        if reduceMotion { shown = target } else { withAnimation(.timingCurve(0.215, 0.61, 0.355, 1, duration: 0.9)) { shown = target } }
    }

    private func format(_ number: Double) -> String {
        let formatter = NumberFormatter()
        formatter.locale = locale
        formatter.numberStyle = .decimal
        formatter.minimumFractionDigits = decimals
        formatter.maximumFractionDigits = decimals
        return prefix + (formatter.string(from: NSNumber(value: number)) ?? "\(number)") + suffix
    }

    /// Interpolates the number itself while an animation runs, instead of cross-fading two texts.
    private struct CountingText: View, Animatable {
        var value: Double
        let format: (Double) -> String

        var animatableData: Double {
            get { value }
            set { value = newValue }
        }

        var body: some View { Text(format(value)) }
    }
}
