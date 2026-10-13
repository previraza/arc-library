import SwiftUI

public struct ManicatTreeNode: Identifiable {
    public let id: String
    public let label: String
    public let children: [ManicatTreeNode]

    public init(id: String, label: String, children: [ManicatTreeNode] = []) {
        self.id = id
        self.label = label
        self.children = children
    }
}

/// Mirrors tree-view.tsx / tree-view.rn.tsx / tree-view.vue: a file-tree style list. Press a branch to open or close it; arrow keys
/// move on the Mac. Add an icon for each node with `icon`.
public struct ManicatTreeView: View {
    public struct Styles {
        public var row: ManicatStyle = { $0 }
        public var rowText: ManicatStyle = { $0 }
        public var chevron: ManicatStyle = { $0 }
        public init() {}
    }

    private struct Row: Identifiable {
        var id: String { node.id }
        let node: ManicatTreeNode
        let depth: Int
    }

    @Environment(\.manicat) private var tokens
    @State private var selected: String?

    private let nodes: [ManicatTreeNode]
    @Binding private var expanded: Set<String>
    private let onSelect: ((ManicatTreeNode) -> Void)?
    private let styles: Styles
    private var iconView: ((ManicatTreeNode) -> AnyView)?

    public init(_ nodes: [ManicatTreeNode], expanded: Binding<Set<String>>, styles: Styles = Styles(), onSelect: ((ManicatTreeNode) -> Void)? = nil) {
        self.nodes = nodes
        self._expanded = expanded
        self.styles = styles
        self.onSelect = onSelect
    }

    /// An icon before each node's label. It receives the node.
    public func icon<V: View>(@ViewBuilder _ content: @escaping (ManicatTreeNode) -> V) -> Self {
        var copy = self
        copy.iconView = { AnyView(content($0)) }
        return copy
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(rows()) { row in
                Button { activate(row.node) } label: {
                    HStack(spacing: 6) {
                        Text(row.node.children.isEmpty ? "" : "›")
                            .font(.system(size: 14))
                            .foregroundStyle(tokens.textMuted)
                            .rotationEffect(.degrees(expanded.contains(row.node.id) ? 90 : 0))
                            .frame(width: 14)
                            .manicatStyle(styles.chevron)
                        iconView?(row.node)
                        Text(row.node.label).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.foreground).manicatStyle(styles.rowText)
                        Spacer(minLength: 0)
                    }
                    .padding(.leading, 8 + CGFloat(row.depth) * 16)
                    .padding(.trailing, 8)
                    .frame(minHeight: 32)
                    .background(selected == row.node.id ? tokens.surfaceMuted : .clear, in: RoundedRectangle(cornerRadius: 10))
                    .contentShape(Rectangle())
                    .manicatStyle(styles.row)
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(selected == row.node.id ? .isSelected : [])
                .accessibilityValue(row.node.children.isEmpty ? "" : (expanded.contains(row.node.id) ? "Expanded" : "Collapsed"))
            }
        }
        .accessibilityElement(children: .contain)
    }

    private func rows() -> [Row] {
        var out: [Row] = []
        func walk(_ list: [ManicatTreeNode], _ depth: Int) {
            for node in list {
                out.append(Row(node: node, depth: depth))
                if !node.children.isEmpty, expanded.contains(node.id) { walk(node.children, depth + 1) }
            }
        }
        walk(nodes, 0)
        return out
    }

    private func activate(_ node: ManicatTreeNode) {
        selected = node.id
        if !node.children.isEmpty {
            withAnimation(.easeInOut(duration: 0.15)) {
                if expanded.contains(node.id) { expanded.remove(node.id) } else { expanded.insert(node.id) }
            }
        }
        onSelect?(node)
    }
}
