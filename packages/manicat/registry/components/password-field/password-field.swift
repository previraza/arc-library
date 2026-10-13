import SwiftUI

/// Mirrors password-field.tsx / password-field.rn.tsx / password-field.vue: a secure field with a Show / Hide toggle.
public struct ManicatPasswordField: View {
    public struct Styles {
        public var label: ManicatStyle = { $0 }
        public var shell: ManicatStyle = { $0 }
        public var input: ManicatStyle = { $0 }
        public var toggle: ManicatStyle = { $0 }
        public var hint: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @FocusState private var focused: Bool
    @State private var shown = false

    private let label: String
    @Binding private var text: String
    private let placeholder: String
    private let description: String?
    private let styles: Styles

    public init(_ label: String, text: Binding<String>, placeholder: String = "", description: String? = nil, styles: Styles = Styles()) {
        self.label = label
        self._text = text
        self.placeholder = placeholder
        self.description = description
        self.styles = styles
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: ManicatMetrics.space.s2) {
            Text(label)
                .font(.system(size: ManicatMetrics.textSm, weight: .medium))
                .foregroundStyle(tokens.foreground)
                .manicatStyle(styles.label)
            HStack(spacing: ManicatMetrics.space.s2) {
                Group {
                    if shown {
                        TextField("", text: $text, prompt: Text(placeholder).foregroundColor(tokens.textMuted))
                    } else {
                        SecureField("", text: $text, prompt: Text(placeholder).foregroundColor(tokens.textMuted))
                    }
                }
                .textFieldStyle(.plain)
                .focused($focused)
                .font(.system(size: ManicatMetrics.textSm))
                .foregroundStyle(tokens.foreground)
                .manicatPasswordTraits()
                .accessibilityLabel(label)
                .manicatStyle(styles.input)
                Button { shown.toggle() } label: {
                    Text(shown ? "Hide" : "Show")
                        .font(.system(size: ManicatMetrics.textXs, weight: .medium))
                        .foregroundStyle(tokens.textMuted)
                        .padding(4)
                }
                .buttonStyle(.plain)
                .accessibilityLabel(shown ? "Hide password" : "Show password")
                .manicatStyle(styles.toggle)
            }
            .padding(.horizontal, ManicatMetrics.space.s3)
            .frame(minHeight: ManicatMetrics.controlHeight.md)
            .background(tokens.surface, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
            .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(focused ? tokens.foreground : tokens.borderStrong, lineWidth: 1))
            .manicatStyle(styles.shell)
            if let description {
                Text(description).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted).manicatStyle(styles.hint)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

extension View {
    @ViewBuilder func manicatPasswordTraits() -> some View {
        #if os(iOS)
        self.textInputAutocapitalization(.never).autocorrectionDisabled().textContentType(.password)
        #else
        self.autocorrectionDisabled()
        #endif
    }
}
