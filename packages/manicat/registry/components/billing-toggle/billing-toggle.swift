import SwiftUI

public struct ManicatBillingOption: Identifiable {
    public var id: String { value }
    public let value: String
    public let label: String
    public let badge: String?

    public init(value: String, label: String, badge: String? = nil) {
        self.value = value
        self.label = label
        self.badge = badge
    }
}

/// Mirrors billing-toggle.tsx / billing-toggle.rn.tsx / billing-toggle.vue. Pair it with a price you compute from the value.
public struct ManicatBillingToggle: View {
    public struct Styles {
        public var track: ManicatStyle = { $0 }
        public var button: ManicatStyle = { $0 }
        public var selection: ManicatStyle = { $0 }
        public var text: ManicatStyle = { $0 }
        public var badge: ManicatStyle = { $0 }
        public init() {}
    }

    public static let defaultOptions = [ManicatBillingOption(value: "monthly", label: "Monthly"), ManicatBillingOption(value: "yearly", label: "Yearly", badge: "Save 20%")]

    @Environment(\.manicat) private var tokens
    @Namespace private var selectionNamespace

    @Binding private var value: String
    private let options: [ManicatBillingOption]
    private let label: String
    private let styles: Styles

    public init(value: Binding<String>, options: [ManicatBillingOption] = ManicatBillingToggle.defaultOptions, label: String = "Billing period", styles: Styles = Styles()) {
        self._value = value
        self.options = options
        self.label = label
        self.styles = styles
    }

    public var body: some View {
        HStack(spacing: ManicatMetrics.space.s1) {
            ForEach(options) { option in
                let selected = option.value == value
                Button { withAnimation(.timingCurve(0.215, 0.61, 0.355, 1, duration: 0.2)) { value = option.value } } label: {
                    HStack(spacing: 6) {
                        Text(option.label).font(.system(size: ManicatMetrics.textSm, weight: .medium)).foregroundStyle(selected ? tokens.accentStrong : tokens.textSecondary).manicatStyle(styles.text)
                        if let badge = option.badge {
                            Text(badge).font(.system(size: 11, weight: .semibold)).foregroundStyle(tokens.success).manicatStyle(styles.badge)
                        }
                    }
                    .padding(.horizontal, ManicatMetrics.space.s3)
                    .frame(minHeight: ManicatMetrics.controlHeight.sm)
                    .background {
                        if selected {
                            RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl - 3)
                                .fill(tokens.surface)
                                .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl - 3).stroke(tokens.border, lineWidth: 1))
                                .matchedGeometryEffect(id: "selection", in: selectionNamespace)
                                .manicatStyle(styles.selection)
                        }
                    }
                    .manicatStyle(styles.button)
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(selected ? .isSelected : [])
            }
        }
        .padding(ManicatMetrics.space.s1)
        .background(tokens.surfaceMuted, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
        .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(tokens.border, lineWidth: 1))
        .manicatStyle(styles.track)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
    }
}

/// A price with its period and, optionally, the struck-through previous price.
public struct ManicatBillingPrice: View {
    @Environment(\.manicat) private var tokens

    private let amount: Double
    private let currency: String
    private let period: String?
    private let was: Double?
    private let decimals: Int

    public init(amount: Double, currency: String = "$", period: String? = nil, was: Double? = nil, decimals: Int = 0) {
        self.amount = amount
        self.currency = currency
        self.period = period
        self.was = was
        self.decimals = decimals
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            if let was, was > amount {
                Text(money(was)).font(.system(size: ManicatMetrics.textSm)).strikethrough().foregroundStyle(tokens.textMuted)
            }
            Text(money(amount)).font(.system(size: 32, weight: .semibold)).monospacedDigit().foregroundStyle(tokens.foreground)
            if let period { Text(period).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.textSecondary) }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(money(amount))\(period.map { " \($0)" } ?? "")")
    }

    private func money(_ value: Double) -> String {
        currency + value.formatted(.number.precision(.fractionLength(decimals)))
    }
}
