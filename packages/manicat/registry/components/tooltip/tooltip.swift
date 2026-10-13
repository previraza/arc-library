import SwiftUI

public enum ManicatTooltipSide { case top, bottom }

/// Mirrors tooltip.tsx / tooltip.rn.tsx / tooltip.vue. There is no hover on a phone, so the tip shows on a long press and hides
/// itself after a moment; on the Mac the system help tag shows on hover as well.
public struct ManicatTooltip<Content: View>: View {
    public struct Styles {
        public var bubble: ManicatStyle = { $0 }
        public var text: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @State private var visible = false
    @State private var hideTask: Task<Void, Never>?

    private let tip: String
    private let side: ManicatTooltipSide
    private let styles: Styles
    private let content: Content

    public init(_ tip: String, side: ManicatTooltipSide = .top, styles: Styles = Styles(), @ViewBuilder content: () -> Content) {
        self.tip = tip
        self.side = side
        self.styles = styles
        self.content = content()
    }

    public var body: some View {
        content
            .help(tip)
            .accessibilityHint(tip)
            .onLongPressGesture(minimumDuration: 0.35) { show() }
            .overlay(alignment: side == .top ? .top : .bottom) {
                if visible {
                    Text(tip)
                        .font(.system(size: ManicatMetrics.textXs))
                        .foregroundStyle(tokens.background)
                        .manicatStyle(styles.text)
                        .padding(.vertical, ManicatMetrics.space.s2)
                        .padding(.horizontal, ManicatMetrics.space.s3)
                        .frame(minWidth: 60, maxWidth: 240)
                        .background(tokens.foreground, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl - 4))
                        .manicatStyle(styles.bubble)
                        .fixedSize()
                        .offset(y: side == .top ? -34 : 34)
                        .allowsHitTesting(false)
                        .transition(.opacity)
                }
            }
            .animation(.easeOut(duration: 0.15), value: visible)
    }

    private func show() {
        visible = true
        hideTask?.cancel()
        hideTask = Task {
            try? await Task.sleep(nanoseconds: 2_600_000_000)
            if !Task.isCancelled { visible = false }
        }
    }
}
