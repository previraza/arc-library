import SwiftUI

/// Mirrors pagination.tsx / pagination.rn.tsx / pagination.vue: previous, a window of five pages that follows the current one, next.
public struct ManicatPagination: View {
    public struct Styles {
        public var button: ManicatStyle = { $0 }
        public var current: ManicatStyle = { $0 }
        public var step: ManicatStyle = { $0 }
        public var text: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens

    @Binding private var page: Int
    private let pageCount: Int
    private let label: String
    private let styles: Styles

    public init(page: Binding<Int>, pageCount: Int, label: String = "Pagination", styles: Styles = Styles()) {
        self._page = page
        self.pageCount = pageCount
        self.label = label
        self.styles = styles
    }

    public var body: some View {
        let total = max(0, pageCount)
        let current = total > 0 ? min(max(1, page), total) : 0
        // A window of five pages that follows the current one.
        let start = total > 0 ? max(1, min(total - 4, current - 2)) : 1
        let visible = Array((0..<min(total, 5)).map { start + $0 })

        HStack(spacing: ManicatMetrics.space.s1) {
            stepButton("‹", label: "Previous page", disabled: current <= 1) { page = current - 1 }
            ForEach(visible, id: \.self) { number in
                let active = number == current
                Button { page = number } label: {
                    Text("\(number)")
                        .font(.system(size: ManicatMetrics.textXs, weight: .medium))
                        .foregroundStyle(active ? tokens.foreground : tokens.textSecondary)
                        .manicatStyle(styles.text)
                        .frame(width: ManicatMetrics.controlHeight.sm, height: ManicatMetrics.controlHeight.sm)
                        .background(active ? tokens.surface : .clear, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
                        .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(active ? tokens.border : .clear, lineWidth: 1))
                        .manicatStyle(styles.button)
                        .manicatStyle(active ? styles.current : { $0 })
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Page \(number)")
                .accessibilityAddTraits(active ? .isSelected : [])
            }
            stepButton("›", label: "Next page", disabled: current >= total) { page = current + 1 }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
    }

    private func stepButton(_ glyph: String, label: String, disabled: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(glyph)
                .font(.system(size: 18))
                .foregroundStyle(tokens.textSecondary)
                .manicatStyle(styles.text)
                .frame(width: ManicatMetrics.controlHeight.sm, height: ManicatMetrics.controlHeight.sm)
                .manicatStyle(styles.step)
        }
        .buttonStyle(.plain)
        .disabled(disabled)
        .opacity(disabled ? 0.4 : 1)
        .accessibilityLabel(label)
    }
}
