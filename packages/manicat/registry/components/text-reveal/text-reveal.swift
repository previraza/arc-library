import SwiftUI

/// Mirrors text-reveal.tsx / text-reveal.rn.tsx / text-reveal.vue: each word rises out of a short offset and fades in, a beat after
/// the one before it.
public struct ManicatTextReveal: View {
    public struct Styles {
        public var line: ManicatStyle = { $0 }
        public var word: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var shown = false

    private let text: String
    private let delay: Double
    private let styles: Styles

    public init(_ text: String, delay: Double = 0, styles: Styles = Styles()) {
        self.text = text
        self.delay = delay
        self.styles = styles
    }

    public var body: some View {
        let words = text.split(whereSeparator: \.isWhitespace).map(String.init)

        ManicatFlowLayout(spacing: 7, lineSpacing: 0) {
            ForEach(Array(words.enumerated()), id: \.offset) { index, word in
                Text(word)
                    .font(.system(size: 28, weight: .semibold))
                    .tracking(-0.8)
                    .foregroundStyle(tokens.foreground)
                    .manicatStyle(styles.word)
                    .opacity(shown ? 1 : 0)
                    .offset(y: shown ? 0 : 10)
                    .animation(reduceMotion ? nil : .timingCurve(0.215, 0.61, 0.355, 1, duration: 0.62).delay(delay + Double(index) * 0.055), value: shown)
            }
        }
        .manicatStyle(styles.line)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(text)
        .accessibilityAddTraits(.isHeader)
        .onAppear { shown = true }
    }
}
