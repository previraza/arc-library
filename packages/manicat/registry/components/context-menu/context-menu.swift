import SwiftUI

public extension View {
    /// Mirrors context-menu.tsx / context-menu.rn.tsx / context-menu.vue. It is the system context menu: a right click or secondary
    /// click on the Mac, a long press on iOS, and the keyboard menu key.
    func manicatContextMenu(_ items: [ManicatContextMenuItem]) -> some View {
        contextMenu {
            ForEach(items) { item in
                Button(role: item.destructive ? .destructive : nil, action: item.action) {
                    if item.checked == true { Text("✓ \(item.label)") } else { Text(item.label) }
                }
                .disabled(item.disabled)
            }
        }
    }
}

public struct ManicatContextMenuItem: Identifiable {
    public let id: String
    public let label: String
    public let action: () -> Void
    public let disabled: Bool
    public let destructive: Bool
    /// Shows a check mark when it is true.
    public let checked: Bool?

    public init(id: String, _ label: String, disabled: Bool = false, destructive: Bool = false, checked: Bool? = nil, action: @escaping () -> Void) {
        self.id = id
        self.label = label
        self.action = action
        self.disabled = disabled
        self.destructive = destructive
        self.checked = checked
    }
}
