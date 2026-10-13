import SwiftUI

public struct ManicatRichTextValue {
    public let markdown: String
    public let text: String
    public let empty: Bool
}

/// Mirrors rich-text-editor.tsx / rich-text-editor.rn.tsx / rich-text-editor.vue. A plain text view cannot show styled spans, so this
/// port edits Markdown: the toolbar adds the syntax (at the end for inline marks, at the start of the last line for blocks) and
/// `onChange` reports the Markdown. Render it for readers with `Text(AttributedString(markdown:))`.
public struct ManicatRichTextEditor: View {
    public struct Styles {
        public var toolbar: ManicatStyle = { $0 }
        public var tool: ManicatStyle = { $0 }
        public var toolText: ManicatStyle = { $0 }
        public var editor: ManicatStyle = { $0 }
        public init() {}
    }

    private struct Tool: Identifiable {
        var id: String { name }
        let label: String
        let name: String
        let run: () -> Void
        var bold = false
        var italic = false
    }

    @Environment(\.manicat) private var tokens

    @Binding private var markdown: String
    private let placeholder: String
    private let readOnly: Bool
    private let label: String
    private let minHeight: CGFloat
    private let styles: Styles
    private let onChange: ((ManicatRichTextValue) -> Void)?

    public init(markdown: Binding<String>, placeholder: String = "Start typing…", readOnly: Bool = false, label: String = "Editor", minHeight: CGFloat = 160, styles: Styles = Styles(), onChange: ((ManicatRichTextValue) -> Void)? = nil) {
        self._markdown = markdown
        self.placeholder = placeholder
        self.readOnly = readOnly
        self.label = label
        self.minHeight = minHeight
        self.styles = styles
        self.onChange = onChange
    }

    private static func strip(_ markdown: String) -> String {
        markdown
            .replacingOccurrences(of: "(?m)^#{1,3}\\s+", with: "", options: .regularExpression)
            .replacingOccurrences(of: "(?m)^([-*]\\s+|\\d+\\.\\s+|>\\s?)", with: "", options: .regularExpression)
            .replacingOccurrences(of: "(\\*\\*|__|\\*|_|`)", with: "", options: .regularExpression)
    }

    public var body: some View {
        VStack(spacing: 0) {
            if !readOnly {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 2) {
                        ForEach(tools) { tool in
                            Button(action: tool.run) {
                                Text(tool.label)
                                    .font(.system(size: ManicatMetrics.textSm, weight: tool.bold ? .bold : .regular))
                                    .foregroundStyle(tokens.foreground)
                                    .manicatStyle(styles.toolText)
                                    .frame(minWidth: 36, minHeight: 36)
                                    .contentShape(Rectangle())
                                    .manicatStyle(styles.tool)
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel(tool.name)
                        }
                    }
                    .padding(4)
                }
                .background(tokens.surfaceMuted)
                .overlay(alignment: .bottom) { Rectangle().fill(tokens.border).frame(height: 1) }
                .manicatStyle(styles.toolbar)
            }
            ZStack(alignment: .topLeading) {
                if markdown.isEmpty { Text(placeholder).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.textMuted).padding(.horizontal, 5).padding(.vertical, 8).allowsHitTesting(false) }
                TextEditor(text: Binding(get: { markdown }, set: set))
                    .scrollContentBackground(.hidden)
                    .font(.system(size: ManicatMetrics.textSm))
                    .foregroundStyle(tokens.foreground)
                    .disabled(readOnly)
                    .accessibilityLabel(label)
                    .manicatStyle(styles.editor)
            }
            .padding(ManicatMetrics.space.s3)
            .frame(minHeight: minHeight)
        }
        .background(tokens.surface, in: RoundedRectangle(cornerRadius: 26))
        .overlay(RoundedRectangle(cornerRadius: 26).stroke(tokens.border, lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: 26))
    }

    private var tools: [Tool] {
        [
            Tool(label: "B", name: "Bold", run: { wrap("**") }, bold: true),
            Tool(label: "I", name: "Italic", run: { wrap("*") }, italic: true),
            Tool(label: "H", name: "Heading", run: { prefix("## ") }),
            Tool(label: "•", name: "Bulleted list", run: { prefix("- ") }),
            Tool(label: "1.", name: "Numbered list", run: { prefix("1. ") }),
            Tool(label: "❝", name: "Quote", run: { prefix("> ") }),
            Tool(label: "</>", name: "Code", run: { wrap("`") }),
        ]
    }

    private func set(_ next: String) {
        markdown = next
        let text = Self.strip(next)
        onChange?(ManicatRichTextValue(markdown: next, text: text, empty: text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty))
    }

    /// Adds a pair of markers at the end of the text. Type between them.
    private func wrap(_ marker: String) { set(markdown + marker + marker) }

    /// Puts the prefix at the start of the last line, replacing a block prefix that is already there.
    private func prefix(_ mark: String) {
        let lineStart = markdown.lastIndex(of: "\n").map { markdown.index(after: $0) } ?? markdown.startIndex
        let line = String(markdown[lineStart...]).replacingOccurrences(of: "^(#{1,3}\\s+|[-*]\\s+|\\d+\\.\\s+|>\\s?)", with: "", options: .regularExpression)
        set(String(markdown[..<lineStart]) + mark + line)
    }
}
