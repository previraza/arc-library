import SwiftUI

/// Mirrors tag-input.tsx / tag-input.rn.tsx / tag-input.vue. Return or a comma adds a tag, and Delete on an empty field removes
/// the last one.
public struct ManicatTagInput: View {
    public struct Styles {
        public var label: ManicatStyle = { $0 }
        public var shell: ManicatStyle = { $0 }
        public var tag: ManicatStyle = { $0 }
        public var tagText: ManicatStyle = { $0 }
        public var input: ManicatStyle = { $0 }
        public var hint: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @FocusState private var focused: Bool
    @State private var draft = ""

    private let label: String
    @Binding private var tags: [String]
    private let placeholder: String
    private let description: String?
    private let styles: Styles

    public init(_ label: String, tags: Binding<[String]>, placeholder: String = "Add a tag", description: String? = nil, styles: Styles = Styles()) {
        self.label = label
        self._tags = tags
        self.placeholder = placeholder
        self.description = description
        self.styles = styles
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: ManicatMetrics.space.s2) {
            Text(label).font(.system(size: ManicatMetrics.textSm, weight: .medium)).foregroundStyle(tokens.foreground).manicatStyle(styles.label)
            ManicatFlowLayout(spacing: 6, lineSpacing: 6) {
                ForEach(tags, id: \.self) { tag in
                    HStack(spacing: 6) {
                        Text(tag).font(.system(size: ManicatMetrics.textXs, weight: .medium)).foregroundStyle(tokens.foreground).manicatStyle(styles.tagText)
                        Button { tags.removeAll { $0 == tag } } label: {
                            Text("×").font(.system(size: 14)).foregroundStyle(tokens.textMuted)
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Remove \(tag)")
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(tokens.surfaceMuted, in: Capsule())
                    .overlay(Capsule().stroke(tokens.border, lineWidth: 1))
                    .manicatStyle(styles.tag)
                }
                TextField("", text: $draft, prompt: Text(tags.isEmpty ? placeholder : "").foregroundColor(tokens.textMuted))
                    .textFieldStyle(.plain)
                    .focused($focused)
                    .font(.system(size: ManicatMetrics.textSm))
                    .foregroundStyle(tokens.foreground)
                    .frame(minWidth: 96)
                    .onSubmit { add() }
                    .onChange(of: draft) { _, text in if text.hasSuffix(",") { add() } }
                    .onKeyPress(.delete) {
                        guard draft.isEmpty, !tags.isEmpty else { return .ignored }
                        tags.removeLast()
                        return .handled
                    }
                    .accessibilityLabel(label)
                    .manicatStyle(styles.input)
            }
            .padding(.horizontal, ManicatMetrics.space.s3)
            .padding(.vertical, 6)
            .frame(maxWidth: .infinity, minHeight: ManicatMetrics.controlHeight.md, alignment: .leading)
            .background(tokens.surface, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
            .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(focused ? tokens.foreground : tokens.borderStrong, lineWidth: 1))
            .manicatStyle(styles.shell)
            if let description {
                Text(description).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted).manicatStyle(styles.hint)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func add() {
        let tag = draft.trimmingCharacters(in: .whitespaces).trimmingCharacters(in: CharacterSet(charactersIn: ","))
        draft = ""
        if !tag.isEmpty, !tags.contains(tag) { tags.append(tag) }
    }
}
