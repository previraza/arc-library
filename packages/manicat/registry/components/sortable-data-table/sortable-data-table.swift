import SwiftUI

public struct ManicatDataColumn<Row>: Identifiable {
    public let id: String
    public let label: String
    public let sortable: Bool
    public let numeric: Bool
    /// Width in points. Columns without one share the free space.
    public let width: CGFloat?
    let text: (Row) -> String
    let sortValue: (Row) -> Double?
    let render: ((Row) -> AnyView)?

    /// A text column. Pass `sortValue` to sort numbers by value instead of by their text.
    public init(_ id: String, _ label: String, sortable: Bool = false, numeric: Bool = false, width: CGFloat? = nil, sortValue: @escaping (Row) -> Double? = { _ in nil }, text: @escaping (Row) -> String) {
        self.id = id
        self.label = label
        self.sortable = sortable
        self.numeric = numeric
        self.width = width
        self.text = text
        self.sortValue = sortValue
        self.render = nil
    }

    /// A column with your own cell content; `text` is still used for sorting.
    public init<Cell: View>(_ id: String, _ label: String, sortable: Bool = false, numeric: Bool = false, width: CGFloat? = nil, sortValue: @escaping (Row) -> Double? = { _ in nil }, text: @escaping (Row) -> String, @ViewBuilder cell: @escaping (Row) -> Cell) {
        self.id = id
        self.label = label
        self.sortable = sortable
        self.numeric = numeric
        self.width = width
        self.text = text
        self.sortValue = sortValue
        self.render = { AnyView(cell($0)) }
    }
}

public struct ManicatSortState: Equatable {
    public enum Direction { case ascending, descending }

    public var key: String
    public var direction: Direction

    public init(key: String, direction: Direction = .ascending) {
        self.key = key
        self.direction = direction
    }
}

/// Mirrors sortable-data-table.tsx / sortable-data-table.rn.tsx / sortable-data-table.vue: press a header to sort by it, select rows
/// with the checkboxes. Wide tables scroll sideways.
public struct ManicatSortableDataTable<Row: Identifiable>: View {
    public struct Styles {
        public var header: ManicatStyle = { $0 }
        public var headerText: ManicatStyle = { $0 }
        public var row: ManicatStyle = { $0 }
        public var cell: ManicatStyle = { $0 }
        public var cellText: ManicatStyle = { $0 }
        public var caption: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @State private var sort: ManicatSortState?

    private let rows: [Row]
    private let columns: [ManicatDataColumn<Row>]
    private let caption: String?
    private let emptyMessage: String
    private let selectable: Bool
    @Binding private var selection: Set<Row.ID>
    private let itemName: (one: String, other: String)
    private let styles: Styles
    private let onSortChange: ((ManicatSortState) -> Void)?

    public init(_ rows: [Row], columns: [ManicatDataColumn<Row>], caption: String? = nil, emptyMessage: String = "Nothing to show yet.", defaultSort: ManicatSortState? = nil, selection: Binding<Set<Row.ID>>? = nil, itemName: (one: String, other: String) = ("row", "rows"), styles: Styles = Styles(), onSortChange: ((ManicatSortState) -> Void)? = nil) {
        self.rows = rows
        self.columns = columns
        self.caption = caption
        self.emptyMessage = emptyMessage
        self.selectable = selection != nil
        self._selection = selection ?? .constant([])
        self.itemName = itemName
        self.styles = styles
        self.onSortChange = onSortChange
        self._sort = State(wrappedValue: defaultSort)
    }

    private var sorted: [Row] {
        guard let sort, let column = columns.first(where: { $0.id == sort.key }) else { return rows }
        let ordered = rows.sorted { a, b in
            if let x = column.sortValue(a), let y = column.sortValue(b) { return x < y }
            return column.text(a).localizedStandardCompare(column.text(b)) == .orderedAscending
        }
        return sort.direction == .ascending ? ordered : ordered.reversed()
    }

    public var body: some View {
        let allSelected = !rows.isEmpty && rows.allSatisfy { selection.contains($0.id) }

        VStack(alignment: .leading, spacing: ManicatMetrics.space.s2) {
            if let caption { Text(caption).font(.system(size: ManicatMetrics.textSm, weight: .medium)).foregroundStyle(tokens.foreground).manicatStyle(styles.caption) }
            ScrollView(.horizontal, showsIndicators: false) {
                VStack(spacing: 0) {
                    HStack(spacing: 0) {
                        if selectable { checkbox(allSelected, "Select all rows") { selection = allSelected ? [] : Set(rows.map { $0.id }) }.frame(width: 44) }
                        ForEach(columns) { column in headerCell(column) }
                    }
                    .background(tokens.surfaceMuted)
                    .manicatStyle(styles.header)
                    if rows.isEmpty { Text(emptyMessage).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.textMuted).padding(ManicatMetrics.space.s4) }
                    ForEach(sorted) { row in
                        let on = selection.contains(row.id)
                        HStack(spacing: 0) {
                            if selectable { checkbox(on, "Select row") { if on { selection.remove(row.id) } else { selection.insert(row.id) } }.frame(width: 44) }
                            ForEach(columns) { column in cell(column, row) }
                        }
                        .background(on ? tokens.surfaceMuted : tokens.surface)
                        .overlay(alignment: .top) { Rectangle().fill(tokens.border).frame(height: 0.5) }
                        .accessibilityAddTraits(on ? .isSelected : [])
                        .manicatStyle(styles.row)
                    }
                }
                .frame(minWidth: 0)
                .clipShape(RoundedRectangle(cornerRadius: 22))
                .overlay(RoundedRectangle(cornerRadius: 22).stroke(tokens.border, lineWidth: 1))
            }
            Text(selectable && !selection.isEmpty ? "\(selection.count) of \(rows.count) \(rows.count == 1 ? itemName.one : itemName.other) selected" : "\(rows.count) \(rows.count == 1 ? itemName.one : itemName.other)")
                .font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func headerCell(_ column: ManicatDataColumn<Row>) -> some View {
        let active = sort?.key == column.id
        return Button { toggle(column) } label: {
            Text(column.label + (active ? (sort?.direction == .ascending ? " ↑" : " ↓") : ""))
                .font(.system(size: ManicatMetrics.textXs, weight: .semibold))
                .foregroundStyle(tokens.textSecondary)
                .manicatStyle(styles.headerText)
                .frame(maxWidth: .infinity, alignment: column.numeric ? .trailing : .leading)
                .padding(ManicatMetrics.space.s3)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(!column.sortable)
        .frame(width: column.width, alignment: .leading)
        .frame(minWidth: column.width ?? 110, maxWidth: column.width ?? .infinity)
        .accessibilityLabel(column.label + (active ? ", sorted \(sort?.direction == .ascending ? "ascending" : "descending")" : ""))
    }

    private func cell(_ column: ManicatDataColumn<Row>, _ row: Row) -> some View {
        Group {
            if let render = column.render {
                render(row)
            } else {
                Text(column.text(row)).font(.system(size: ManicatMetrics.textSm).monospacedDigit()).foregroundStyle(tokens.foreground).manicatStyle(styles.cellText)
            }
        }
        .frame(maxWidth: .infinity, alignment: column.numeric ? .trailing : .leading)
        .padding(ManicatMetrics.space.s3)
        .frame(width: column.width, alignment: .leading)
        .frame(minWidth: column.width ?? 110, maxWidth: column.width ?? .infinity)
        .manicatStyle(styles.cell)
    }

    private func checkbox(_ on: Bool, _ label: String, toggle: @escaping () -> Void) -> some View {
        Button(action: toggle) {
            RoundedRectangle(cornerRadius: 5).fill(on ? tokens.controlOn : tokens.surface).frame(width: 18, height: 18)
                .overlay(RoundedRectangle(cornerRadius: 5).stroke(on ? tokens.controlOn : tokens.borderStrong, lineWidth: 1))
                .overlay { if on { Text("✓").font(.system(size: 10, weight: .bold)).foregroundStyle(tokens.controlThumbOn) } }
                .padding(8)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label)
        .accessibilityAddTraits(on ? .isSelected : [])
    }

    private func toggle(_ column: ManicatDataColumn<Row>) {
        guard column.sortable else { return }
        let next = ManicatSortState(key: column.id, direction: sort?.key == column.id && sort?.direction == .ascending ? .descending : .ascending)
        sort = next
        onSortChange?(next)
    }
}
