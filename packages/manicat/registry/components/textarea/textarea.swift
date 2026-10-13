import SwiftUI

/// Mirrors textarea.tsx / textarea.rn.tsx / textarea.vue: a multi-line field of `rows` visible lines.
public struct ManicatTextarea: View {
    public struct Styles {
        public var label: ManicatStyle = { $0 }
        public var control: ManicatStyle = { $0 }
        public var hint: ManicatStyle = { $0 }
        public var error: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @Environment(\.isEnabled) private var enabled
    @FocusState private var focused: Bool

    private let label: String
    @Binding private var text: String
    private let placeholder: String
    private let description: String?
    private let error: String?
    private let rows: Int
    private let styles: Styles

    public init(_ label: String, text: Binding<String>, placeholder: String = "", description: String? = nil, error: String? = nil, rows: Int = 4, styles: Styles = Styles()) {
        self.label = label
        self._text = text
        self.placeholder = placeholder
        self.description = description
        self.error = error
        self.rows = rows
        self.styles = styles
    }

    public var body: some View {
        let border = error != nil ? tokens.danger : focused ? tokens.foreground : tokens.borderStrong

        VStack(alignment: .leading, spacing: 0) {
            Text(label)
                .font(.system(size: ManicatMetrics.textSm, weight: .medium))
                .foregroundStyle(tokens.foreground)
                .padding(.bottom, ManicatMetrics.space.s2)
                .manicatStyle(styles.label)
            TextField("", text: $text, prompt: Text(placeholder).foregroundColor(tokens.textMuted), axis: .vertical)
                .textFieldStyle(.plain)
                .focused($focused)
                .lineLimit(rows...)
                .font(.system(size: ManicatMetrics.textSm))
                .foregroundStyle(tokens.foreground)
                .padding(ManicatMetrics.space.s3)
                .frame(maxWidth: .infinity, minHeight: CGFloat(rows) * 22 + ManicatMetrics.space.s3 * 2, alignment: .topLeading)
                .background(enabled ? tokens.surface : tokens.surfaceMuted, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
                .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(border, lineWidth: 1))
                .opacity(enabled ? 1 : 0.6)
                .accessibilityLabel(label)
                .accessibilityHint(error ?? description ?? "")
                .manicatStyle(styles.control)
            if let error {
                Text(error).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.danger).padding(.top, ManicatMetrics.space.s2).manicatStyle(styles.error)
            } else if let description {
                Text(description).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted).padding(.top, ManicatMetrics.space.s2).manicatStyle(styles.hint)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
