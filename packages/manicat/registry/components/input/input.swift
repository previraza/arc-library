import SwiftUI

public enum ManicatInputKind { case text, email, number, phone, url }

/// Mirrors input.tsx / input.rn.tsx / input.vue: a label, a 44 point field whose border answers focus and error, and a
/// message below. The field never changes size when it is focused.
public struct ManicatInput: View {
    public struct Styles {
        public var label: ManicatStyle = { $0 }
        public var input: ManicatStyle = { $0 }
        public var description: ManicatStyle = { $0 }
        public var error: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @Environment(\.isEnabled) private var enabled
    @FocusState private var focused: Bool

    private let label: String
    @Binding private var text: String
    private let placeholder: String
    private let kind: ManicatInputKind
    private let description: String?
    private let error: String?
    private let styles: Styles

    public init(_ label: String, text: Binding<String>, placeholder: String = "", kind: ManicatInputKind = .text, description: String? = nil, error: String? = nil, styles: Styles = Styles()) {
        self.label = label
        self._text = text
        self.placeholder = placeholder
        self.kind = kind
        self.description = description
        self.error = error
        self.styles = styles
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(label)
                .font(.system(size: ManicatMetrics.textSm, weight: .medium))
                .foregroundStyle(tokens.foreground)
                .padding(.bottom, ManicatMetrics.space.s2)
                .manicatStyle(styles.label)
            field
            if let error {
                Text(error)
                    .font(.system(size: ManicatMetrics.textXs))
                    .foregroundStyle(tokens.danger)
                    .padding(.top, ManicatMetrics.space.s2)
                    .accessibilityAddTraits(.isStaticText)
                    .manicatStyle(styles.error)
            } else if let description {
                Text(description)
                    .font(.system(size: ManicatMetrics.textXs))
                    .foregroundStyle(tokens.textMuted)
                    .padding(.top, ManicatMetrics.space.s2)
                    .manicatStyle(styles.description)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var field: some View {
        let border = error != nil ? tokens.danger : focused ? tokens.foreground : tokens.borderStrong
        return TextField("", text: $text, prompt: Text(placeholder).foregroundColor(tokens.textMuted))
            .textFieldStyle(.plain)
            .focused($focused)
            .font(.system(size: ManicatMetrics.textSm))
            .foregroundStyle(tokens.foreground)
            .manicatKeyboard(kind)
            .padding(.horizontal, ManicatMetrics.space.s3)
            .frame(minHeight: ManicatMetrics.controlHeight.md)
            .background(enabled ? tokens.surface : tokens.surfaceMuted, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
            .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(border, lineWidth: 1))
            .opacity(enabled ? 1 : 0.5)
            .accessibilityLabel(label)
            .accessibilityHint(error ?? description ?? "")
            .manicatStyle(styles.input)
    }
}

extension View {
    /// The keyboard and capitalisation that fit the kind of text. iOS only: macOS has no software keyboard.
    @ViewBuilder func manicatKeyboard(_ kind: ManicatInputKind) -> some View {
        #if os(iOS)
        switch kind {
        case .text: self
        case .email: self.keyboardType(.emailAddress).textInputAutocapitalization(.never).autocorrectionDisabled()
        case .number: self.keyboardType(.decimalPad)
        case .phone: self.keyboardType(.phonePad)
        case .url: self.keyboardType(.URL).textInputAutocapitalization(.never).autocorrectionDisabled()
        }
        #else
        self
        #endif
    }
}
