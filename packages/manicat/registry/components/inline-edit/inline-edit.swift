import SwiftUI

/// Mirrors inline-edit.tsx / inline-edit.rn.tsx / inline-edit.vue: text that turns into a field when pressed. Return or leaving the
/// field saves, Escape cancels, and `validate` can block a save with a message.
public struct ManicatInlineEdit: View {
    public enum Variant { case title, body }

    public struct Styles {
        public var root: ManicatStyle = { $0 }
        public var text: ManicatStyle = { $0 }
        public var input: ManicatStyle = { $0 }
        public var error: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @FocusState private var focused: Bool
    @State private var editing = false
    @State private var draft = ""
    @State private var problem: String?

    @Binding private var value: String
    private let label: String
    private let validate: ((String) -> String?)?
    private let placeholder: String
    private let variant: Variant
    private let onSave: ((String) -> Void)?
    private let styles: Styles

    public init(_ label: String, value: Binding<String>, placeholder: String = "", variant: Variant = .title, validate: ((String) -> String?)? = nil, styles: Styles = Styles(), onSave: ((String) -> Void)? = nil) {
        self.label = label
        self._value = value
        self.placeholder = placeholder
        self.variant = variant
        self.validate = validate
        self.styles = styles
        self.onSave = onSave
    }

    public var body: some View {
        let size = variant == .title ? 22.0 : ManicatMetrics.textSm
        let weight: Font.Weight = variant == .title ? .semibold : .regular

        VStack(alignment: .leading, spacing: 4) {
            if editing {
                TextField("", text: $draft, prompt: Text(placeholder).foregroundColor(tokens.textMuted))
                    .textFieldStyle(.plain)
                    .focused($focused)
                    .font(.system(size: size, weight: weight))
                    .foregroundStyle(tokens.foreground)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(problem != nil ? tokens.danger : tokens.foreground, lineWidth: 1))
                    .onSubmit { commit() }
                    .onChange(of: focused) { _, isFocused in if !isFocused && editing { commit() } }
                    .accessibilityLabel(label)
                    .manicatStyle(styles.input)
                if let problem {
                    Text(problem).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.danger).manicatStyle(styles.error)
                }
            } else {
                Button {
                    draft = value
                    editing = true
                    focused = true
                } label: {
                    Text(value.isEmpty ? placeholder : value)
                        .font(.system(size: size, weight: weight))
                        .foregroundStyle(value.isEmpty ? tokens.textMuted : tokens.foreground)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(.clear, lineWidth: 1))
                        .manicatStyle(styles.text)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("\(label): \(value.isEmpty ? placeholder : value). Edit")
            }
        }
        .manicatStyle(styles.root)
    }

    private func commit() {
        let next = draft.trimmingCharacters(in: .whitespaces)
        if let message = validate?(next) {
            problem = message
            return
        }
        problem = nil
        editing = false
        if !next.isEmpty, next != value {
            value = next
            onSave?(next)
        }
    }
}
