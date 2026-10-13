import SwiftUI

/// Mirrors scroll-area.tsx / scroll-area.rn.tsx / scroll-area.vue: a scrollable region capped at `maxHeight`.
public struct ManicatScrollArea<Content: View>: View {
    public struct Styles {
        public var content: ManicatStyle = { $0 }
        public init() {}
    }

    private let axis: Axis.Set
    private let maxHeight: CGFloat?
    private let label: String?
    private let styles: Styles
    private let content: Content

    public init(axis: Axis.Set = .vertical, maxHeight: CGFloat? = nil, label: String? = nil, styles: Styles = Styles(), @ViewBuilder content: () -> Content) {
        self.axis = axis
        self.maxHeight = maxHeight
        self.label = label
        self.styles = styles
        self.content = content()
    }

    public var body: some View {
        ScrollView(axis) {
            content.manicatStyle(styles.content)
        }
        .frame(maxHeight: maxHeight)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label ?? "")
    }
}
