import SwiftUI

/// Mirrors number-field.tsx / number-field.rn.tsx / number-field.vue: a number with minus and plus, clamped to a range, with an
/// optional prefix and suffix.
public struct ManicatNumberField: View {
    public struct Styles {
        public var label: ManicatStyle = { $0 }
        public var shell: ManicatStyle = { $0 }
        public var input: ManicatStyle = { $0 }
        public var button: ManicatStyle = { $0 }
        public var hint: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @Environment(\.isEnabled) private var enabled
    @State private var draft: String?

    private let label: String
    @Binding private var value: Double
    private let range: ClosedRange<Double>
    private let step: Double
    private let description: String?
    private let prefix: ((Double) -> String)?
    private let suffix: ((Double) -> String)?
    private let styles: Styles

    public init(_ label: String, value: Binding<Double>, range: ClosedRange<Double> = -Double.greatestFiniteMagnitude...Double.greatestFiniteMagnitude, step: Double = 1, description: String? = nil, prefix: ((Double) -> String)? = nil, suffix: ((Double) -> String)? = nil, styles: Styles = Styles()) {
        self.label = label
        self._value = value
        self.range = range
        self.step = step
        self.description = description
        self.prefix = prefix
        self.suffix = suffix
        self.styles = styles
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: ManicatMetrics.space.s2) {
            Text(label).font(.system(size: ManicatMetrics.textSm, weight: .medium)).foregroundStyle(tokens.foreground).manicatStyle(styles.label)
            HStack(spacing: 0) {
                stepButton("−", label: "Decrease \(label)", disabled: value <= range.lowerBound) { set(value - step) }
                HStack(spacing: 2) {
                    if let text = prefix?(value), !text.isEmpty { Text(text).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.textMuted) }
                    TextField("", text: Binding(get: { draft ?? value.formatted() }, set: { draft = $0 }))
                        .textFieldStyle(.plain)
                        .multilineTextAlignment(.center)
                        .font(.system(size: ManicatMetrics.textSm)).monospacedDigit()
                        .foregroundStyle(tokens.foreground)
                        .frame(minWidth: 40)
                        .fixedSize()
                        .onSubmit { commit() }
                        .accessibilityLabel(label)
                        .manicatStyle(styles.input)
                    if let text = suffix?(value), !text.isEmpty { Text(text).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.textMuted) }
                }
                .frame(maxWidth: .infinity)
                stepButton("+", label: "Increase \(label)", disabled: value >= range.upperBound) { set(value + step) }
            }
            .frame(minHeight: ManicatMetrics.controlHeight.md)
            .background(tokens.surface, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
            .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(tokens.borderStrong, lineWidth: 1))
            .clipShape(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
            .opacity(enabled ? 1 : 0.5)
            .manicatStyle(styles.shell)
            if let description {
                Text(description).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted).manicatStyle(styles.hint)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func stepButton(_ glyph: String, label: String, disabled: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(glyph).font(.system(size: 18)).foregroundStyle(tokens.textSecondary)
                .frame(width: ManicatMetrics.controlHeight.md, height: ManicatMetrics.controlHeight.md)
                .manicatStyle(styles.button)
        }
        .buttonStyle(.plain)
        .disabled(disabled)
        .opacity(disabled ? 0.4 : 1)
        .accessibilityLabel(label)
    }

    private func set(_ next: Double) {
        value = min(range.upperBound, max(range.lowerBound, next.isFinite ? next : value))
        draft = nil
    }

    private func commit() {
        if let draft, let parsed = Double(draft.filter { "0123456789.-".contains($0) }) { set(parsed) }
        draft = nil
    }
}
