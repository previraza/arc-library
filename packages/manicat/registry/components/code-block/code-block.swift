import SwiftUI
#if os(iOS)
import UIKit
#elseif os(macOS)
import AppKit
#endif

/// Mirrors code-block.tsx / code-block.rn.tsx / code-block.vue: monospaced, horizontally scrollable, with line numbers. Colouring
/// tokens needs a highlighter, which this port does not bundle.
public struct ManicatCodeBlock: View {
    public struct Styles {
        public var header: ManicatStyle = { $0 }
        public var filename: ManicatStyle = { $0 }
        public var language: ManicatStyle = { $0 }
        public var code: ManicatStyle = { $0 }
        public var copy: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @State private var expanded = false
    @State private var copied = false
    @State private var resetTask: Task<Void, Never>?

    private let code: String
    private let filename: String?
    private let language: String
    private let maxLines: Int?
    private let copyAction: ((String) -> Void)?
    private let styles: Styles

    public init(code: String, filename: String? = nil, language: String = "swift", maxLines: Int? = nil, copy: ((String) -> Void)? = nil, styles: Styles = Styles()) {
        self.code = code
        self.filename = filename
        self.language = language
        self.maxLines = maxLines
        self.copyAction = copy
        self.styles = styles
    }

    public var body: some View {
        let lines = code.hasSuffix("\n") ? String(code.dropLast()).components(separatedBy: "\n") : code.components(separatedBy: "\n")
        let shown = maxLines != nil && !expanded ? Array(lines.prefix(maxLines ?? lines.count)) : lines
        let digits = String(lines.count).count

        VStack(spacing: 0) {
            HStack(spacing: ManicatMetrics.space.s3) {
                Text(filename ?? "")
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundStyle(tokens.foreground)
                    .lineLimit(1)
                    .manicatStyle(styles.filename)
                    .frame(maxWidth: .infinity, alignment: .leading)
                Text(language.uppercased()).font(.system(size: 10)).foregroundStyle(tokens.textMuted).manicatStyle(styles.language)
                Button(action: copy) {
                    Text(copied ? "✓ Copied" : "Copy")
                        .font(.system(size: 11))
                        .foregroundStyle(copied ? tokens.success : tokens.textSecondary)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(tokens.border, lineWidth: 1))
                        .manicatStyle(styles.copy)
                }
                .buttonStyle(.plain)
                .accessibilityLabel(copied ? "Copied" : "Copy code")
            }
            .padding(.horizontal, ManicatMetrics.space.s3)
            .padding(.vertical, ManicatMetrics.space.s2)
            .background(tokens.surface)
            .overlay(alignment: .bottom) { Rectangle().fill(tokens.border).frame(height: 1) }
            .manicatStyle(styles.header)
            ScrollView(.horizontal, showsIndicators: false) {
                VStack(alignment: .leading, spacing: 0) {
                    ForEach(Array(shown.enumerated()), id: \.offset) { index, line in
                        (Text(String(index + 1).leftPad(to: digits) + "  ").foregroundColor(tokens.textMuted) + Text(line.isEmpty ? " " : line).foregroundColor(tokens.foreground))
                            .font(.system(size: 12, design: .monospaced))
                            .lineSpacing(5)
                            .manicatStyle(styles.code)
                    }
                }
                .padding(ManicatMetrics.space.s4)
            }
            if let maxLines, lines.count > maxLines {
                Button { withAnimation { expanded.toggle() } } label: {
                    Text(expanded ? "Show less" : "Show \(lines.count - maxLines) more lines")
                        .font(.system(size: ManicatMetrics.textXs))
                        .foregroundStyle(tokens.textSecondary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, ManicatMetrics.space.s2)
                        .overlay(alignment: .top) { Rectangle().fill(tokens.border).frame(height: 1) }
                }
                .buttonStyle(.plain)
            }
        }
        .background(tokens.background)
        .clipShape(RoundedRectangle(cornerRadius: 18))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(tokens.border, lineWidth: 1))
    }

    private func copy() {
        if let copyAction {
            copyAction(code)
        } else {
            #if os(iOS)
            UIPasteboard.general.string = code
            #elseif os(macOS)
            NSPasteboard.general.clearContents()
            NSPasteboard.general.setString(code, forType: .string)
            #endif
        }
        copied = true
        resetTask?.cancel()
        resetTask = Task {
            try? await Task.sleep(nanoseconds: 1_600_000_000)
            if !Task.isCancelled { copied = false }
        }
    }
}

private extension String {
    func leftPad(to width: Int) -> String { String(repeating: " ", count: max(0, width - count)) + self }
}
