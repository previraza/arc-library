import SwiftUI

public enum ManicatConfirmState { case idle, confirming, pending, done, error }

/// Mirrors confirm-morph.tsx / confirm-morph.rn.tsx / confirm-morph.vue: a button that turns into "Are you sure?", then works, then
/// shows the result, with an optional undo.
public struct ManicatConfirmMorph: View {
    public enum Tone { case danger, neutral }

    public struct Styles {
        public var root: ManicatStyle = { $0 }
        public var label: ManicatStyle = { $0 }
        public var action: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @Environment(\.isEnabled) private var enabled
    @Binding private var state: ManicatConfirmState

    private let label: String
    private let prompt: String
    private let confirmLabel: String
    private let cancelLabel: String
    private let pendingLabel: String
    private let doneLabel: String
    private let errorLabel: String
    private let retryLabel: String
    private let undoLabel: String
    private let tone: Tone
    private let confirmTimeout: Double
    private let resultTimeout: Double
    private let onCancel: (() -> Void)?
    private let onUndo: (() async throws -> Void)?
    private let styles: Styles
    private let onConfirm: () async throws -> Void
    private var iconView: AnyView?

    public init(_ label: String, state: Binding<ManicatConfirmState>, prompt: String = "Are you sure?", confirmLabel: String = "Confirm", cancelLabel: String = "Cancel", pendingLabel: String = "Working…", doneLabel: String = "Done", errorLabel: String = "Something went wrong", retryLabel: String = "Retry", undoLabel: String = "Undo", tone: Tone = .neutral, confirmTimeout: Double = 5, resultTimeout: Double = 4, styles: Styles = Styles(), onCancel: (() -> Void)? = nil, onUndo: (() async throws -> Void)? = nil, onConfirm: @escaping () async throws -> Void) {
        self.label = label
        self._state = state
        self.prompt = prompt
        self.confirmLabel = confirmLabel
        self.cancelLabel = cancelLabel
        self.pendingLabel = pendingLabel
        self.doneLabel = doneLabel
        self.errorLabel = errorLabel
        self.retryLabel = retryLabel
        self.undoLabel = undoLabel
        self.tone = tone
        self.confirmTimeout = confirmTimeout
        self.resultTimeout = resultTimeout
        self.styles = styles
        self.onCancel = onCancel
        self.onUndo = onUndo
        self.onConfirm = onConfirm
    }

    /// An icon before the label while idle.
    public func icon<V: View>(@ViewBuilder _ content: () -> V) -> Self {
        var copy = self
        copy.iconView = AnyView(content())
        return copy
    }

    public var body: some View {
        let accent = tone == .danger ? tokens.danger : tokens.foreground

        HStack(spacing: ManicatMetrics.space.s2) {
            switch state {
            case .idle:
                Button { state = .confirming } label: {
                    HStack(spacing: 6) {
                        iconView
                        Text(label).font(.system(size: ManicatMetrics.textSm, weight: .medium)).manicatStyle(styles.label)
                    }
                    .foregroundStyle(accent)
                }
                .buttonStyle(.plain)
            case .confirming:
                Text(prompt).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.textSecondary)
                action(cancelLabel, strong: false) { state = .idle; onCancel?() }
                action(confirmLabel, strong: true) { Task { await confirm() } }
            case .pending:
                ProgressView().controlSize(.small)
                Text(pendingLabel).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.textSecondary)
            case .done:
                Text("✓ \(doneLabel)").font(.system(size: ManicatMetrics.textSm, weight: .medium)).foregroundStyle(tokens.success)
                if onUndo != nil { action(undoLabel, strong: false) { Task { await undo() } } }
            case .error:
                Text(errorLabel).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.danger)
                action(retryLabel, strong: false) { Task { await confirm() } }
            }
        }
        .padding(.horizontal, ManicatMetrics.space.s4)
        .frame(minHeight: ManicatMetrics.controlHeight.md)
        .background(tokens.surface, in: Capsule())
        .overlay(Capsule().stroke(state == .confirming && tone == .danger ? tokens.danger.opacity(0.5) : tokens.border, lineWidth: 1))
        .opacity(enabled ? 1 : 0.52)
        .manicatStyle(styles.root)
        .animation(.timingCurve(0.215, 0.61, 0.355, 1, duration: 0.25), value: state)
        .accessibilityElement(children: .contain)
        .task(id: state) { await timeout() }
    }

    private func action(_ title: String, strong: Bool, perform: @escaping () -> Void) -> some View {
        Button(action: perform) {
            Text(title)
                .font(.system(size: ManicatMetrics.textSm, weight: .medium))
                .foregroundStyle(strong ? tokens.background : tokens.foreground)
                .padding(.horizontal, ManicatMetrics.space.s3)
                .frame(minHeight: ManicatMetrics.controlHeight.sm - 6)
                .background(strong ? (tone == .danger ? tokens.danger : tokens.foreground) : .clear, in: Capsule())
                .manicatStyle(styles.action)
        }
        .buttonStyle(.plain)
    }

    @MainActor private func confirm() async {
        state = .pending
        do {
            try await onConfirm()
            state = .done
        } catch {
            state = .error
        }
    }

    @MainActor private func undo() async {
        state = .pending
        do {
            try await onUndo?()
            state = .idle
        } catch {
            state = .error
        }
    }

    private func timeout() async {
        let wait = state == .confirming ? confirmTimeout : (state == .done || state == .error) ? resultTimeout : 0
        guard wait > 0 else { return }
        try? await Task.sleep(nanoseconds: UInt64(wait * 1_000_000_000))
        if !Task.isCancelled { state = .idle }
    }
}
