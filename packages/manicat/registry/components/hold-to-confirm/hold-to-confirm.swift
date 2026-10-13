import SwiftUI

/// Mirrors hold-to-confirm.tsx / hold-to-confirm.rn.tsx / hold-to-confirm.vue: press and hold until the fill completes. Releasing
/// early cancels. VoiceOver users double-tap and hold, or use the Confirm action.
public struct ManicatHoldToConfirm: View {
    public enum Tone { case accent, danger, neutral }

    public struct Styles {
        public var root: ManicatStyle = { $0 }
        public var fill: ManicatStyle = { $0 }
        public var label: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @Environment(\.isEnabled) private var enabled
    @State private var progress: Double = 0
    @State private var done = false
    @State private var holding = false

    private let label: String
    private let confirmedLabel: String
    private let duration: Double
    private let tone: Tone
    private let confirmed: Bool?
    private let onHoldChange: ((Bool) -> Void)?
    private let styles: Styles
    private let onConfirm: () -> Void

    public init(_ label: String, confirmedLabel: String = "Done", duration: Double = 1.2, tone: Tone = .accent, confirmed: Bool? = nil, onHoldChange: ((Bool) -> Void)? = nil, styles: Styles = Styles(), onConfirm: @escaping () -> Void) {
        self.label = label
        self.confirmedLabel = confirmedLabel
        self.duration = duration
        self.tone = tone
        self.confirmed = confirmed
        self.onHoldChange = onHoldChange
        self.styles = styles
        self.onConfirm = onConfirm
    }

    public var body: some View {
        let finished = confirmed ?? done
        let color = toneColor

        ZStack(alignment: .leading) {
            GeometryReader { proxy in
                Rectangle().fill(color.opacity(0.18)).frame(width: proxy.size.width * (finished ? 1 : progress)).manicatStyle(styles.fill)
            }
            Text(finished ? confirmedLabel : label)
                .font(.system(size: ManicatMetrics.textSm, weight: .medium))
                .foregroundStyle(color)
                .frame(maxWidth: .infinity)
                .manicatStyle(styles.label)
        }
        .padding(.horizontal, ManicatMetrics.space.s4)
        .frame(minHeight: ManicatMetrics.controlHeight.md)
        .background(tokens.surface)
        .clipShape(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
        .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(finished ? color : tokens.border, lineWidth: 1))
        .opacity(enabled ? 1 : 0.52)
        .manicatStyle(styles.root)
        .gesture(DragGesture(minimumDistance: 0).onChanged { _ in begin(finished) }.onEnded { _ in cancel() })
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(finished ? confirmedLabel : "\(label), press and hold")
        .accessibilityAddTraits(.isButton)
        .accessibilityAdjustableAction { _ in if !finished && enabled { complete() } }
    }

    private var toneColor: Color {
        switch tone { case .accent: return tokens.accent; case .danger: return tokens.danger; case .neutral: return tokens.foreground }
    }

    private func begin(_ finished: Bool) {
        guard enabled, !finished, !holding else { return }
        holding = true
        onHoldChange?(true)
        withAnimation(.linear(duration: duration * (1 - progress))) { progress = 1 }
        Task {
            try? await Task.sleep(nanoseconds: UInt64(duration * 1_000_000_000))
            if holding { await MainActor.run { complete() } }
        }
    }

    private func complete() {
        holding = false
        done = true
        onHoldChange?(false)
        onConfirm()
    }

    private func cancel() {
        guard holding else { return }
        holding = false
        onHoldChange?(false)
        withAnimation(.easeOut(duration: 0.2)) { progress = 0 }
    }
}
