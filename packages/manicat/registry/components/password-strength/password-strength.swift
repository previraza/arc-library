import SwiftUI

public struct ManicatPasswordRule: Identifiable {
    public let id: String
    public let label: String
    public let test: (String) -> Bool

    public init(id: String, label: String, test: @escaping (String) -> Bool) {
        self.id = id
        self.label = label
        self.test = test
    }
}

public struct ManicatPasswordStrengthResult {
    public let level: Int
    public let label: String
    public let met: [String]
}

public let manicatDefaultPasswordRules: [ManicatPasswordRule] = [
    ManicatPasswordRule(id: "length", label: "At least 12 characters") { $0.count >= 12 },
    ManicatPasswordRule(id: "case", label: "Upper and lowercase letters") { $0.contains { $0.isLowercase } && $0.contains { $0.isUppercase } },
    ManicatPasswordRule(id: "number", label: "At least one number") { $0.contains { $0.isNumber } },
    ManicatPasswordRule(id: "symbol", label: "At least one symbol") { $0.contains { !$0.isLetter && !$0.isNumber && !$0.isWhitespace } },
]

/// Four steps from the share of rules met; a password under eight characters never leaves the first.
public func manicatEstimateStrength(_ password: String, rules: [ManicatPasswordRule] = manicatDefaultPasswordRules) -> ManicatPasswordStrengthResult {
    if password.isEmpty { return ManicatPasswordStrengthResult(level: 0, label: "", met: []) }
    let met = rules.filter { $0.test(password) }.map(\.id)
    if password.count < 8 { return ManicatPasswordStrengthResult(level: 1, label: "Too short", met: met) }
    let level = max(1, min(4, Int((Double(met.count) / Double(rules.count) * 4).rounded(.up))))
    return ManicatPasswordStrengthResult(level: level, label: ["", "Weak", "Fair", "Good", "Strong"][level], met: met)
}

/// Mirrors password-strength.tsx / password-strength.rn.tsx / password-strength.vue: a password field with a four step meter and the
/// rules it checks.
public struct ManicatPasswordStrength: View {
    public struct Styles {
        public var label: ManicatStyle = { $0 }
        public var shell: ManicatStyle = { $0 }
        public var input: ManicatStyle = { $0 }
        public var toggle: ManicatStyle = { $0 }
        public var meter: ManicatStyle = { $0 }
        public var segment: ManicatStyle = { $0 }
        public var rule: ManicatStyle = { $0 }
        public var error: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @FocusState private var focused: Bool
    @State private var shown = false

    private let label: String
    @Binding private var password: String
    private let rules: [ManicatPasswordRule]
    private let error: String?
    private let styles: Styles
    private let onStrength: ((ManicatPasswordStrengthResult) -> Void)?

    public init(_ label: String, password: Binding<String>, rules: [ManicatPasswordRule] = manicatDefaultPasswordRules, error: String? = nil, styles: Styles = Styles(), onStrength: ((ManicatPasswordStrengthResult) -> Void)? = nil) {
        self.label = label
        self._password = password
        self.rules = rules
        self.error = error
        self.styles = styles
        self.onStrength = onStrength
    }

    public var body: some View {
        let strength = manicatEstimateStrength(password, rules: rules)
        let tone = [tokens.border, tokens.danger, tokens.warning, tokens.series[0], tokens.success][strength.level]

        VStack(alignment: .leading, spacing: ManicatMetrics.space.s2) {
            Text(label).font(.system(size: ManicatMetrics.textSm, weight: .medium)).foregroundStyle(tokens.foreground).manicatStyle(styles.label)
            HStack(spacing: ManicatMetrics.space.s2) {
                Group {
                    if shown { TextField("", text: $password) } else { SecureField("", text: $password) }
                }
                .textFieldStyle(.plain)
                .focused($focused)
                .font(.system(size: ManicatMetrics.textSm))
                .foregroundStyle(tokens.foreground)
                .manicatPasswordTraits()
                .accessibilityLabel(label)
                .manicatStyle(styles.input)
                Button { shown.toggle() } label: {
                    Text(shown ? "Hide" : "Show").font(.system(size: ManicatMetrics.textXs, weight: .medium)).foregroundStyle(tokens.textMuted).padding(4).manicatStyle(styles.toggle)
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, ManicatMetrics.space.s3)
            .frame(minHeight: ManicatMetrics.controlHeight.md)
            .background(tokens.surface, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
            .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(error != nil ? tokens.danger : focused ? tokens.foreground : tokens.borderStrong, lineWidth: 1))
            .manicatStyle(styles.shell)
            HStack(spacing: 4) {
                ForEach(1...4, id: \.self) { step in
                    Capsule().fill(step <= strength.level ? tone : tokens.surfaceMuted).frame(height: 4).manicatStyle(styles.segment)
                }
            }
            .manicatStyle(styles.meter)
            .accessibilityElement(children: .ignore)
            .accessibilityLabel("Password strength")
            .accessibilityValue(strength.label)
            Text(strength.label).font(.system(size: ManicatMetrics.textXs, weight: .medium)).foregroundStyle(tone)
            VStack(alignment: .leading, spacing: 2) {
                ForEach(rules) { rule in
                    let met = strength.met.contains(rule.id)
                    Text("\(met ? "✓" : "○") \(rule.label)")
                        .font(.system(size: ManicatMetrics.textXs))
                        .foregroundStyle(met ? tokens.success : tokens.textMuted)
                        .manicatStyle(styles.rule)
                }
            }
            if let error {
                Text(error).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.danger).manicatStyle(styles.error)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .onChange(of: password) { _, next in onStrength?(manicatEstimateStrength(next, rules: rules)) }
    }
}
