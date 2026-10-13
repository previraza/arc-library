import SwiftUI

public struct ManicatButtonGroupItem: Identifiable {
    public let id: String
    public let label: String
    public let icon: AnyView?
    public let iconOnly: Bool
    public let disabled: Bool
    public let action: () -> Void

    public init(id: String, _ label: String, iconOnly: Bool = false, disabled: Bool = false, icon: AnyView? = nil, action: @escaping () -> Void) {
        self.id = id
        self.label = label
        self.iconOnly = iconOnly
        self.disabled = disabled
        self.icon = icon
        self.action = action
    }
}

/// Mirrors button-group.tsx / button-group.rn.tsx / button-group.vue: joined segments, optionally with an overflow menu behind a
/// chevron segment.
public struct ManicatButtonGroup: View {
    public enum Variant { case outline, solid }
    public enum Size { case sm, md }

    public struct Styles {
        public var segment: ManicatStyle = { $0 }
        public var segmentText: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @Environment(\.isEnabled) private var enabled

    private let items: [ManicatButtonGroupItem]
    private let menuLabel: String?
    private let menuItems: [ManicatMenuItem]
    private let label: String
    private let variant: Variant
    private let size: Size
    private let vertical: Bool
    private let styles: Styles

    public init(items: [ManicatButtonGroupItem], label: String, menuLabel: String? = nil, menuItems: [ManicatMenuItem] = [], variant: Variant = .outline, size: Size = .md, vertical: Bool = false, styles: Styles = Styles()) {
        self.items = items
        self.label = label
        self.menuLabel = menuLabel
        self.menuItems = menuItems
        self.variant = variant
        self.size = size
        self.vertical = vertical
        self.styles = styles
    }

    public var body: some View {
        let height: CGFloat = size == .sm ? ManicatMetrics.controlHeight.sm : ManicatMetrics.controlHeight.md

        Group {
            if vertical { VStack(spacing: -1) { segments(height) } } else { HStack(spacing: -1) { segments(height) } }
        }
        .clipShape(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
        .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(tokens.border, lineWidth: 1))
        .opacity(enabled ? 1 : 0.5)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
    }

    @ViewBuilder private func segments(_ height: CGFloat) -> some View {
        ForEach(items) { item in
            Button(action: item.action) {
                HStack(spacing: 6) {
                    item.icon
                    if !item.iconOnly { Text(item.label).font(.system(size: ManicatMetrics.textSm, weight: .medium)).manicatStyle(styles.segmentText) }
                }
                .foregroundStyle(variant == .solid ? tokens.background : tokens.foreground)
                .padding(.horizontal, ManicatMetrics.space.s3)
                .frame(minWidth: item.iconOnly ? height : nil, minHeight: height)
                .background(variant == .solid ? tokens.foreground : tokens.surface)
                .overlay(Rectangle().stroke(variant == .solid ? tokens.background.opacity(0.2) : tokens.border, lineWidth: 1))
                .manicatStyle(styles.segment)
            }
            .buttonStyle(.plain)
            .disabled(item.disabled)
            .accessibilityLabel(item.label)
        }
        if let menuLabel {
            Menu {
                ForEach(menuItems) { item in
                    Button(role: item.destructive ? .destructive : nil, action: item.action) { Text(item.label) }.disabled(item.disabled)
                }
            } label: {
                Text("⌄")
                    .font(.system(size: 14))
                    .foregroundStyle(variant == .solid ? tokens.background : tokens.foreground)
                    .frame(width: height, height: height)
                    .background(variant == .solid ? tokens.foreground : tokens.surface)
                    .overlay(Rectangle().stroke(variant == .solid ? tokens.background.opacity(0.2) : tokens.border, lineWidth: 1))
                    .manicatStyle(styles.segment)
            }
            .menuStyle(.button)
            .menuIndicator(.hidden)
            .buttonStyle(.plain)
            .accessibilityLabel(menuLabel)
        }
    }
}
