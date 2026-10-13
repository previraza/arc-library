import SwiftUI

/// Mirrors text-shimmer.tsx / text-shimmer.rn.tsx / text-shimmer.vue. SwiftUI cannot clip a gradient to text either, so the shimmer
/// is a soft pulse of the text's own opacity. It rests under Reduce Motion and when `active` is false.
public struct ManicatTextShimmer: View {
    public struct Styles {
        public var text: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var dimmed = false

    private let text: String
    private let active: Bool
    private let duration: Double
    private let styles: Styles

    public init(_ text: String, active: Bool = true, duration: Double = 1.8, styles: Styles = Styles()) {
        self.text = text
        self.active = active
        self.duration = duration
        self.styles = styles
    }

    public var body: some View {
        Text(text)
            .foregroundStyle(active ? tokens.textSecondary : tokens.textMuted)
            .opacity(dimmed ? 0.4 : 1)
            .manicatStyle(styles.text)
            .accessibilityAddTraits(active ? .updatesFrequently : [])
            .onAppear { update() }
            .onChange(of: active) { _, _ in update() }
    }

    private func update() {
        if active && !reduceMotion {
            withAnimation(.easeInOut(duration: duration / 2).repeatForever(autoreverses: true)) { dimmed = true }
        } else {
            withAnimation(.easeOut(duration: 0.2)) { dimmed = false }
        }
    }
}
