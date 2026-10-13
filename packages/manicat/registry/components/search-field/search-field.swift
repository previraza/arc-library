import SwiftUI

/// Mirrors search-field.tsx / search-field.rn.tsx / search-field.vue. The clear button keeps its slot, so the field never changes
/// width when it appears.
public struct ManicatSearchField: View {
    public struct Styles {
        public var label: ManicatStyle = { $0 }
        public var shell: ManicatStyle = { $0 }
        public var input: ManicatStyle = { $0 }
        public var clear: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @FocusState private var focused: Bool

    private let label: String
    @Binding private var text: String
    private let placeholder: String
    private let styles: Styles

    public init(_ label: String, text: Binding<String>, placeholder: String = "", styles: Styles = Styles()) {
        self.label = label
        self._text = text
        self.placeholder = placeholder
        self.styles = styles
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: ManicatMetrics.space.s2) {
            Text(label)
                .font(.system(size: ManicatMetrics.textSm, weight: .medium))
                .foregroundStyle(tokens.foreground)
                .manicatStyle(styles.label)
            HStack(spacing: ManicatMetrics.space.s2) {
                Text("⌕").font(.system(size: 16)).foregroundStyle(tokens.textMuted).accessibilityHidden(true)
                TextField("", text: $text, prompt: Text(placeholder).foregroundColor(tokens.textMuted))
                    .textFieldStyle(.plain)
                    .focused($focused)
                    .font(.system(size: ManicatMetrics.textSm))
                    .foregroundStyle(tokens.foreground)
                    .accessibilityLabel(label)
                    .manicatStyle(styles.input)
                ZStack {
                    if !text.isEmpty {
                        Button { text = "" } label: {
                            Text("×")
                                .font(.system(size: 12))
                                .foregroundStyle(tokens.textMuted)
                                .frame(width: 20, height: 20)
                                .background(tokens.surfaceMuted, in: Circle())
                                .manicatStyle(styles.clear)
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Clear search")
                    }
                }
                .frame(width: 20)
            }
            .padding(.horizontal, ManicatMetrics.space.s3)
            .frame(minHeight: ManicatMetrics.controlHeight.md)
            .background(tokens.surface, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
            .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(focused ? tokens.foreground : tokens.borderStrong, lineWidth: 1))
            .manicatStyle(styles.shell)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
