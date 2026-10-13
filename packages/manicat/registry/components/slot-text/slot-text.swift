import SwiftUI

/// Mirrors slot-text.tsx / slot-text.rn.tsx / slot-text.vue: a character that rolls up from below whenever it changes, a beat after
/// the character before it. Characters are keyed from the end, so a digit gained on the left does not make every column roll.
public struct ManicatSlotText: View {
    public struct Styles {
        public var text: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens

    private let value: String
    private let duration: Double
    private let styles: Styles

    public init(_ value: String, duration: Double = 0.6, styles: Styles = Styles()) {
        self.value = value
        self.duration = duration
        self.styles = styles
    }

    public init(_ number: Double, format: ((Double) -> String)? = nil, duration: Double = 0.6, styles: Styles = Styles()) {
        self.init(format?(number) ?? number.formatted(), duration: duration, styles: styles)
    }

    private struct Cell: Identifiable {
        let id: Int
        let index: Int
        let char: Character
    }

    public var body: some View {
        let chars = Array(value)
        let cells = chars.enumerated().map { Cell(id: chars.count - $0.offset, index: $0.offset, char: $0.element) }

        HStack(spacing: 0) {
            ForEach(cells) { cell in
                Text(String(cell.char))
                    .monospacedDigit()
                    .foregroundStyle(tokens.foreground)
                    .manicatStyle(styles.text)
                    .id(cell.char)
                    .transition(.opacity.combined(with: .offset(y: 18)))
                    .animation(.timingCurve(0.215, 0.61, 0.355, 1, duration: duration).delay(Double(cell.index) * 0.06), value: cell.char)
            }
        }
        .clipped()
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(value)
    }
}
