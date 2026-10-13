import SwiftUI

/// Mirrors otp-input.tsx / otp-input.rn.tsx / otp-input.vue. One hidden field holds the code, so paste and SMS autofill work; the
/// cells only draw it.
public struct ManicatOtpInput: View {
    public struct Styles {
        public var label: ManicatStyle = { $0 }
        public var cell: ManicatStyle = { $0 }
        public var cellText: ManicatStyle = { $0 }
        public var hint: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @Environment(\.isEnabled) private var enabled
    @FocusState private var focused: Bool

    private let length: Int
    @Binding private var code: String
    private let label: String
    private let description: String?
    private let error: String?
    private let numeric: Bool
    private let styles: Styles

    public init(_ label: String, code: Binding<String>, length: Int = 6, description: String? = nil, error: String? = nil, numeric: Bool = true, styles: Styles = Styles()) {
        self.label = label
        self._code = code
        self.length = length
        self.description = description
        self.error = error
        self.numeric = numeric
        self.styles = styles
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: ManicatMetrics.space.s2) {
            Text(label).font(.system(size: ManicatMetrics.textSm, weight: .medium)).foregroundStyle(tokens.foreground).manicatStyle(styles.label)
            ZStack {
                HStack(spacing: 8) {
                    ForEach(0..<length, id: \.self) { index in
                        let characters = Array(code)
                        let activeCell = focused && index == min(characters.count, length - 1)
                        Text(index < characters.count ? String(characters[index]) : "")
                            .font(.system(size: 20, weight: .medium))
                            .foregroundStyle(tokens.foreground)
                            .manicatStyle(styles.cellText)
                            .frame(width: 44, height: 52)
                            .background(tokens.surface, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
                            .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(error != nil ? tokens.danger : activeCell ? tokens.foreground : tokens.borderStrong, lineWidth: 1))
                            .manicatStyle(styles.cell)
                    }
                }
                .accessibilityHidden(true)
                TextField("", text: Binding(get: { code }, set: { code = Self.clean($0, length: length, numeric: numeric) }))
                    .focused($focused)
                    .opacity(0.015)
                    .manicatOneTimeCode(numeric: numeric)
                    .accessibilityLabel(label)
            }
            .onTapGesture { focused = true }
            if let error {
                Text(error).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.danger).manicatStyle(styles.hint)
            } else if let description {
                Text(description).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted).manicatStyle(styles.hint)
            }
        }
        .opacity(enabled ? 1 : 0.5)
        .fixedSize(horizontal: true, vertical: false)
    }

    private static func clean(_ text: String, length: Int, numeric: Bool) -> String {
        String((numeric ? text.filter(\.isNumber) : text).prefix(length))
    }
}

extension View {
    @ViewBuilder func manicatOneTimeCode(numeric: Bool) -> some View {
        #if os(iOS)
        self.textContentType(.oneTimeCode).keyboardType(numeric ? .numberPad : .default)
        #else
        self
        #endif
    }
}
