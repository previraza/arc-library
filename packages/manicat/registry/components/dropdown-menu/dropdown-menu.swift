import SwiftUI

public struct ManicatMenuItem: Identifiable {
    public var id: String { label }
    public let label: String
    public let action: () -> Void
    public let disabled: Bool
    public let destructive: Bool
    public let separatorBefore: Bool

    public init(_ label: String, disabled: Bool = false, destructive: Bool = false, separatorBefore: Bool = false, action: @escaping () -> Void) {
        self.label = label
        self.action = action
        self.disabled = disabled
        self.destructive = destructive
        self.separatorBefore = separatorBefore
    }
}

/// Mirrors dropdown-menu.tsx / dropdown-menu.rn.tsx / dropdown-menu.vue. The list is the system menu, so keyboard, type-ahead and
/// VoiceOver work as they do everywhere else on the platform; Manicat draws the button that opens it.
public struct ManicatDropdownMenu: View {
    public struct Styles {
        public var trigger: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens

    private let label: String
    private let items: [ManicatMenuItem]
    private let icon: AnyView?
    private let styles: Styles

    public init(_ label: String, items: [ManicatMenuItem], styles: Styles = Styles()) {
        self.label = label
        self.items = items
        self.icon = nil
        self.styles = styles
    }

    private init(copying other: ManicatDropdownMenu, icon: AnyView?) {
        self.label = other.label
        self.items = other.items
        self.icon = icon
        self.styles = other.styles
    }

    /// Replaces the label inside the button with an icon; the label stays the accessible name.
    public func icon<V: View>(@ViewBuilder _ content: () -> V) -> ManicatDropdownMenu {
        ManicatDropdownMenu(copying: self, icon: AnyView(content()))
    }

    public var body: some View {
        Menu {
            ForEach(items) { item in
                if item.separatorBefore { Divider() }
                Button(role: item.destructive ? .destructive : nil, action: item.action) { Text(item.label) }
                    .disabled(item.disabled)
            }
        } label: {
            HStack(spacing: 6) {
                if let icon { icon } else { Text(label).font(.system(size: ManicatMetrics.textSm, weight: .medium)) }
            }
            .foregroundStyle(tokens.foreground)
            .padding(.horizontal, ManicatMetrics.space.s3)
            .frame(minWidth: ManicatMetrics.controlHeight.sm, minHeight: ManicatMetrics.controlHeight.sm)
            .background(tokens.surface, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
            .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(tokens.border, lineWidth: 1))
            .manicatStyle(styles.trigger)
        }
        .menuStyle(.button)
        .menuIndicator(.hidden)
        .buttonStyle(.plain)
        .accessibilityLabel(label)
    }
}
