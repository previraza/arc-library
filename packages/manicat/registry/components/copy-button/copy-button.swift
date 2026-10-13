import SwiftUI
#if os(iOS)
import UIKit
#elseif os(macOS)
import AppKit
#endif

/// Mirrors copy-button.tsx / copy-button.rn.tsx / copy-button.vue. By default it writes to the system pasteboard; pass `copy` to
/// use your own.
public struct ManicatCopyButton: View {
    public enum Variant { case outline, plain }

    public struct Styles {
        public var icon: ManicatStyle = { $0 }
        public var label: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @Environment(\.isEnabled) private var enabled
    @State private var copied = false
    @State private var resetTask: Task<Void, Never>?

    private let value: String
    private let label: String
    private let iconOnly: Bool
    private let variant: Variant
    private let copy: ((String) -> Void)?
    private let onCopied: (() -> Void)?
    private let styles: Styles

    public init(value: String, label: String = "Copy", iconOnly: Bool = false, variant: Variant = .outline, copy: ((String) -> Void)? = nil, onCopied: (() -> Void)? = nil, styles: Styles = Styles()) {
        self.value = value
        self.label = label
        self.iconOnly = iconOnly
        self.variant = variant
        self.copy = copy
        self.onCopied = onCopied
        self.styles = styles
    }

    public var body: some View {
        Button(action: perform) {
            HStack(spacing: 6) {
                Text(copied ? "✓" : "⧉")
                    .font(.system(size: 14))
                    .foregroundStyle(copied ? tokens.success : tokens.textSecondary)
                    .manicatStyle(styles.icon)
                if !iconOnly {
                    Text(copied ? "Copied" : label)
                        .font(.system(size: ManicatMetrics.textSm, weight: .medium))
                        .foregroundStyle(tokens.foreground)
                        .manicatStyle(styles.label)
                }
            }
            .padding(.horizontal, ManicatMetrics.space.s3)
            .frame(minHeight: ManicatMetrics.controlHeight.sm)
            .background(variant == .outline ? tokens.surface : .clear, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
            .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(variant == .outline ? tokens.border : .clear, lineWidth: 1))
            .opacity(enabled ? 1 : 0.5)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(copied ? "Copied" : label)
    }

    private func perform() {
        if let copy {
            copy(value)
        } else {
            #if os(iOS)
            UIPasteboard.general.string = value
            #elseif os(macOS)
            NSPasteboard.general.clearContents()
            NSPasteboard.general.setString(value, forType: .string)
            #endif
        }
        copied = true
        onCopied?()
        resetTask?.cancel()
        resetTask = Task {
            try? await Task.sleep(nanoseconds: 1_600_000_000)
            if !Task.isCancelled { copied = false }
        }
    }
}
