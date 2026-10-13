import SwiftUI

/// Mirrors text-morph.tsx / text-morph.rn.tsx / text-morph.vue: when the text changes, the old copy leaves upward and the new
/// one rises in, so a word swaps in place.
public struct ManicatTextMorph: View {
    public struct Styles {
        public var glyph: ManicatStyle = { $0 }
        public init() {}
    }

    private let text: String
    private let styles: Styles

    public init(_ text: String, styles: Styles = Styles()) {
        self.text = text
        self.styles = styles
    }

    public var body: some View {
        ZStack {
            Text(text)
                .id(text)
                .manicatStyle(styles.glyph)
                .transition(.asymmetric(
                    insertion: .opacity.combined(with: .offset(y: 6)).animation(.timingCurve(0.215, 0.61, 0.355, 1, duration: 0.28)),
                    removal: .opacity.combined(with: .offset(y: -6)).animation(.easeIn(duration: 0.14))
                ))
        }
        .animation(.default, value: text)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(text)
    }
}
