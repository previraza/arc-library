import SwiftUI

/// Mirrors action-button.tsx / action-button.rn.tsx / action-button.vue: an async action drives the pending and success states, then
/// the button returns to idle. Throwing from the action shows nothing and reports the error through `onError`.
public struct ManicatActionButton: View {
    public struct Styles {
        public var label: ManicatStyle = { $0 }
        public init() {}
    }

    private enum Phase { case idle, pending, success }

    @Environment(\.manicat) private var tokens
    @Environment(\.isEnabled) private var enabled
    @State private var phase: Phase = .idle

    private let label: String
    private let successLabel: String
    private let pendingLabel: String?
    private let resetAfter: Double
    private let onError: ((Error) -> Void)?
    private let action: () async throws -> Void
    private let styles: Styles

    public init(_ label: String, successLabel: String = "Done", pendingLabel: String? = nil, resetAfter: Double = 1.6, onError: ((Error) -> Void)? = nil, styles: Styles = Styles(), action: @escaping () async throws -> Void) {
        self.label = label
        self.successLabel = successLabel
        self.pendingLabel = pendingLabel
        self.resetAfter = resetAfter
        self.onError = onError
        self.styles = styles
        self.action = action
    }

    public var body: some View {
        let color = phase == .success ? tokens.success : tokens.background

        Button { Task { await press() } } label: {
            HStack(spacing: 8) {
                if phase == .pending { ProgressView().controlSize(.small).tint(color) }
                Text(phase == .success ? "✓ \(successLabel)" : phase == .pending ? (pendingLabel ?? label) : label)
                    .font(.system(size: ManicatMetrics.textSm, weight: .medium))
                    .foregroundStyle(color)
                    .manicatStyle(styles.label)
            }
            .padding(.horizontal, ManicatMetrics.space.s4)
            .frame(minHeight: ManicatMetrics.controlHeight.md)
            .background(phase == .success ? tokens.surface : tokens.foreground, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
            .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(phase == .success ? tokens.success : tokens.foreground, lineWidth: 1))
            .opacity(enabled ? 1 : 0.52)
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(phase == .pending ? .updatesFrequently : [])
    }

    @MainActor private func press() async {
        guard phase == .idle else { return }
        phase = .pending
        do {
            try await action()
            phase = .success
            try? await Task.sleep(nanoseconds: UInt64(resetAfter * 1_000_000_000))
            phase = .idle
        } catch {
            phase = .idle
            onError?(error)
        }
    }
}
