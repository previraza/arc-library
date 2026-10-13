import SwiftUI

public enum ManicatInViewTitleVariant { case word, line, blur, tracking, wipe }

/// Mirrors in-view-title.tsx / in-view-title.rn.tsx / in-view-title.vue. `word` reveals word by word; every other variant reveals
/// line by line (SwiftUI text has no blur or wipe here, so they share the rise).
public struct ManicatInViewTitle: View {
    public struct Styles {
        public var line: ManicatStyle = { $0 }
        public var text: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var shown = false

    private let text: String
    private let variant: ManicatInViewTitleVariant
    private let lines: [String]?
    private let styles: Styles

    public init(_ text: String, variant: ManicatInViewTitleVariant = .blur, lines: [String]? = nil, styles: Styles = Styles()) {
        self.text = text
        self.variant = variant
        self.lines = lines
        self.styles = styles
    }

    public var body: some View {
        let byWord = variant == .word
        let pieces = byWord ? text.split(whereSeparator: \.isWhitespace).map(String.init) : (lines ?? [text])

        Group {
            if byWord {
                ManicatFlowLayout(spacing: 8, lineSpacing: 0) { ForEach(Array(pieces.enumerated()), id: \.offset) { index, piece in pieceView(piece, index: index, step: 0.06) } }
            } else {
                VStack(alignment: .leading, spacing: 0) { ForEach(Array(pieces.enumerated()), id: \.offset) { index, piece in pieceView(piece, index: index, step: 0.14) } }
            }
        }
        .manicatStyle(styles.line)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(text)
        .accessibilityAddTraits(.isHeader)
        .onAppear { shown = true }
    }

    private func pieceView(_ piece: String, index: Int, step: Double) -> some View {
        Text(piece)
            .font(.system(size: 30, weight: .semibold))
            .tracking(-0.9)
            .foregroundStyle(tokens.foreground)
            .manicatStyle(styles.text)
            .opacity(shown ? 1 : 0)
            .offset(y: shown ? 0 : 14)
            .animation(reduceMotion ? nil : .timingCurve(0.215, 0.61, 0.355, 1, duration: 0.72).delay(Double(index) * step), value: shown)
    }
}
