import SwiftUI

/// Mirrors popover.tsx / popover.rn.tsx / popover.vue: a small floating panel that closes when you press outside it. It is the
/// system popover, so it adapts to the platform; `trigger` is the control that opens it.
public struct ManicatPopover<Trigger: View, Content: View>: View {
    public struct Styles {
        public var content: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens

    @Binding private var isPresented: Bool
    private let styles: Styles
    private let trigger: Trigger
    private let content: Content

    public init(isPresented: Binding<Bool>, styles: Styles = Styles(), @ViewBuilder trigger: () -> Trigger, @ViewBuilder content: () -> Content) {
        self._isPresented = isPresented
        self.styles = styles
        self.trigger = trigger()
        self.content = content()
    }

    public var body: some View {
        Button { isPresented = true } label: { trigger }
            .buttonStyle(.plain)
            .accessibilityAddTraits(.isButton)
            .popover(isPresented: $isPresented) {
                content
                    .padding(ManicatMetrics.space.s4)
                    .frame(maxWidth: 320)
                    .background(tokens.surface)
                    .manicatStyle(styles.content)
                    .presentationCompactAdaptation(.popover)
            }
    }
}
