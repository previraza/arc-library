import SwiftUI

/// Mirrors skeleton.tsx / skeleton.rn.tsx / skeleton.vue: a calm, finite pulse (about 20 seconds) that rests under Reduce Motion.
public struct ManicatSkeleton: View {
    public struct Styles {
        public var avatar: ManicatStyle = { $0 }
        public var lines: ManicatStyle = { $0 }
        public var line: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var dimmed = false

    private let label: String
    private let lines: Int
    private let avatar: Bool
    private let styles: Styles

    public init(label: String = "Loading", lines: Int = 3, avatar: Bool = false, styles: Styles = Styles()) {
        self.label = label
        self.lines = lines
        self.avatar = avatar
        self.styles = styles
    }

    public var body: some View {
        HStack(alignment: .top, spacing: ManicatMetrics.space.s4) {
            if avatar {
                Circle().fill(fill)
                    .frame(width: ManicatMetrics.controlHeight.md, height: ManicatMetrics.controlHeight.md)
                    .manicatStyle(styles.avatar)
            }
            VStack(alignment: .leading, spacing: ManicatMetrics.space.s3) {
                ForEach(0..<max(1, lines), id: \.self) { index in
                    // First line is a heading, last is short, like text that ends mid-line.
                    RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).fill(fill)
                        .frame(height: index == 0 ? ManicatMetrics.space.s4 : ManicatMetrics.space.s3)
                        .containerRelativeFrame(.horizontal) { width, _ in width * (index == 0 ? 0.48 : index == lines - 1 ? 0.72 : 1) }
                        .manicatStyle(styles.line)
                }
            }
            .padding(.top, ManicatMetrics.space.s1)
            .manicatStyle(styles.lines)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .opacity(dimmed ? 0.52 : 1)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(label)
        .onAppear {
            guard !reduceMotion else { return }
            withAnimation(.easeInOut(duration: 0.9).repeatCount(22, autoreverses: true)) { dimmed = true }
        }
    }

    private var fill: Color { tokens.borderStrong.opacity(0.38) }
}
