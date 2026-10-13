import SwiftUI

/// Mirrors json-viewer.tsx / json-viewer.rn.tsx / json-viewer.vue: an expandable tree of any JSON-like value. Press a branch to open
/// or close it; every press calls `onSelect` with its path.
public struct ManicatJsonViewer: View {
    public struct Styles {
        public var key: ManicatStyle = { $0 }
        public var value: ManicatStyle = { $0 }
        public init() {}
    }

    public struct Selection {
        public let path: String
        public let value: Any
    }

    private struct Row: Identifiable {
        var id: String { path }
        let name: String
        let value: Any
        let path: String
        let depth: Int
        let kind: Kind
        let size: Int
    }

    private enum Kind { case object, array, string, number, boolean, null, other
        var branch: Bool { self == .object || self == .array }
    }

    @Environment(\.manicat) private var tokens
    @State private var openPaths: Set<String>

    private let data: Any
    private let rootName: String
    private let maxHeight: CGFloat?
    private let label: String
    private let onSelect: ((Selection) -> Void)?
    private let styles: Styles

    public init(_ data: Any, rootName: String = "root", defaultExpandDepth: Int = 1, maxHeight: CGFloat? = nil, label: String = "JSON", styles: Styles = Styles(), onSelect: ((Selection) -> Void)? = nil) {
        self.data = data
        self.rootName = rootName
        self.maxHeight = maxHeight
        self.label = label
        self.styles = styles
        self.onSelect = onSelect
        self._openPaths = State(wrappedValue: Self.initiallyOpen(data, depth: defaultExpandDepth))
    }

    public var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 0) {
                ForEach(rows()) { row in
                    Button { activate(row) } label: {
                        HStack(spacing: 4) {
                            Text(row.kind.branch ? (openPaths.contains(row.path) ? "▾" : "▸") : "").frame(width: 14).foregroundStyle(tokens.textMuted)
                            Text(row.name).foregroundStyle(tokens.foreground).manicatStyle(styles.key)
                            Text(": ").foregroundStyle(tokens.textMuted)
                            Text(preview(row)).foregroundStyle(color(row.kind)).manicatStyle(styles.value)
                            Spacer(minLength: 0)
                        }
                        .font(.system(size: 12, design: .monospaced))
                        .padding(.leading, CGFloat(row.depth) * 14)
                        .frame(minHeight: 24)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityAddTraits(openPaths.contains(row.path) ? .isSelected : [])
                }
            }
            .padding(ManicatMetrics.space.s3)
        }
        .frame(maxHeight: maxHeight)
        .background(tokens.surface, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
        .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(tokens.border, lineWidth: 1))
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
    }

    private static func kind(of value: Any) -> Kind {
        if value is NSNull { return .null }
        if value is [Any] { return .array }
        if value is [String: Any] { return .object }
        if value is String { return .string }
        if value is Bool { return .boolean }
        if value is NSNumber || value is Int || value is Double { return .number }
        return .other
    }

    private static func children(of value: Any) -> [(String, Any)] {
        if let array = value as? [Any] { return array.enumerated().map { (String($0.offset), $0.element) } }
        if let object = value as? [String: Any] { return object.sorted { $0.key < $1.key }.map { ($0.key, $0.value) } }
        return []
    }

    private static func initiallyOpen(_ data: Any, depth: Int) -> Set<String> {
        var open = Set<String>()
        func walk(_ value: Any, _ path: String, _ level: Int) {
            guard kind(of: value).branch else { return }
            if level < depth { open.insert(path) }
            for (key, child) in children(of: value) { walk(child, "\(path).\(key)", level + 1) }
        }
        walk(data, "$", 0)
        return open
    }

    private func rows() -> [Row] {
        var out: [Row] = []
        func walk(_ name: String, _ value: Any, _ path: String, _ depth: Int) {
            let kind = Self.kind(of: value)
            let kids = Self.children(of: value)
            out.append(Row(name: name, value: value, path: path, depth: depth, kind: kind, size: kids.count))
            if kind.branch, openPaths.contains(path) { for (key, child) in kids { walk(key, child, "\(path).\(key)", depth + 1) } }
        }
        walk(rootName, data, "$", 0)
        return out
    }

    private func activate(_ row: Row) {
        if row.kind.branch {
            if openPaths.contains(row.path) { openPaths.remove(row.path) } else { openPaths.insert(row.path) }
        }
        onSelect?(Selection(path: row.path, value: row.value))
    }

    private func preview(_ row: Row) -> String {
        if row.kind.branch {
            if openPaths.contains(row.path) { return row.kind == .array ? "[" : "{" }
            return "\(row.kind == .array ? "[…]" : "{…}") \(row.size) \(row.size == 1 ? "item" : "items")"
        }
        if row.kind == .string { return "\"\(row.value)\"" }
        return row.kind == .null ? "null" : "\(row.value)"
    }

    private func color(_ kind: Kind) -> Color {
        switch kind {
        case .string: return tokens.success
        case .number: return tokens.series[0]
        case .boolean: return tokens.warning
        case .null, .other, .object, .array: return tokens.textMuted
        }
    }
}
