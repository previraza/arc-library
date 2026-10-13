import SwiftUI

/// Mirrors money-input.tsx / money-input.rn.tsx / money-input.vue: an amount in major units (12.5 is twelve dollars fifty) with a
/// currency you cycle through.
public struct ManicatMoneyInput: View {
    public struct Styles {
        public var label: ManicatStyle = { $0 }
        public var shell: ManicatStyle = { $0 }
        public var input: ManicatStyle = { $0 }
        public var currency: ManicatStyle = { $0 }
        public var hint: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @Environment(\.isEnabled) private var enabled
    @FocusState private var focused: Bool
    @State private var draft: String?

    private let label: String
    @Binding private var amount: Double?
    @Binding private var currency: String
    private let currencies: [String]
    private let range: ClosedRange<Double>
    private let locale: Locale
    private let description: String?
    private let error: String?
    private let styles: Styles

    public init(_ label: String, amount: Binding<Double?>, currency: Binding<String>, currencies: [String] = ["USD", "EUR", "GBP"], range: ClosedRange<Double> = 0...Double.greatestFiniteMagnitude, locale: Locale = Locale(identifier: "en_US"), description: String? = nil, error: String? = nil, styles: Styles = Styles()) {
        self.label = label
        self._amount = amount
        self._currency = currency
        self.currencies = currencies
        self.range = range
        self.locale = locale
        self.description = description
        self.error = error
        self.styles = styles
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: ManicatMetrics.space.s2) {
            Text(label).font(.system(size: ManicatMetrics.textSm, weight: .medium)).foregroundStyle(tokens.foreground).manicatStyle(styles.label)
            HStack(spacing: ManicatMetrics.space.s2) {
                Text(symbol).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.textMuted)
                TextField("", text: Binding(get: { draft ?? (amount.map { String($0) } ?? "") }, set: change), prompt: Text("0.00").foregroundColor(tokens.textMuted))
                    .textFieldStyle(.plain)
                    .focused($focused)
                    .font(.system(size: ManicatMetrics.textSm))
                    .monospacedDigit()
                    .foregroundStyle(tokens.foreground)
                    .manicatDecimalKeyboard()
                    .accessibilityLabel(label)
                    .manicatStyle(styles.input)
                Button { cycle() } label: {
                    Text(currency).font(.system(size: ManicatMetrics.textXs, weight: .medium)).foregroundStyle(tokens.textSecondary)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(tokens.surfaceMuted, in: Capsule())
                        .manicatStyle(styles.currency)
                }
                .buttonStyle(.plain)
                .disabled(currencies.count < 2)
                .accessibilityLabel("Currency, \(currency)")
            }
            .padding(.leading, ManicatMetrics.space.s3)
            .padding(.trailing, 6)
            .frame(minHeight: ManicatMetrics.controlHeight.md)
            .background(tokens.surface, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
            .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(error != nil ? tokens.danger : focused ? tokens.foreground : tokens.borderStrong, lineWidth: 1))
            .manicatStyle(styles.shell)
            if let error {
                Text(error).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.danger).manicatStyle(styles.hint)
            } else if let description {
                Text(description).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted).manicatStyle(styles.hint)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .opacity(enabled ? 1 : 0.5)
        .onChange(of: focused) { _, isFocused in if !isFocused { draft = nil } }
    }

    private var symbol: String {
        let formatter = NumberFormatter()
        formatter.locale = locale
        formatter.numberStyle = .currency
        formatter.currencyCode = currency
        return formatter.currencySymbol ?? currency
    }

    private func change(_ text: String) {
        draft = text
        let digits = text.filter { "0123456789.".contains($0) }
        if text.trimmingCharacters(in: .whitespaces).isEmpty {
            amount = nil
        } else if let parsed = Double(digits) {
            amount = min(range.upperBound, max(range.lowerBound, parsed))
        }
    }

    private func cycle() {
        guard let at = currencies.firstIndex(of: currency) else { return }
        currency = currencies[(at + 1) % currencies.count]
    }
}

extension View {
    @ViewBuilder func manicatDecimalKeyboard() -> some View {
        #if os(iOS)
        self.keyboardType(.decimalPad)
        #else
        self
        #endif
    }
}
