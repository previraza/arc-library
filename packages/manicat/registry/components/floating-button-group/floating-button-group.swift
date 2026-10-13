import SwiftUI

public enum ManicatFloatingButtonGroupItem: Identifiable {
    case action(id: String, label: String, icon: AnyView? = nil, iconOnly: Bool = false, disabled: Bool = false, pressed: Bool = false, shortcut: String? = nil)
    case separator(id: String)

    public var id: String {
        switch self { case .action(let id, _, _, _, _, _, _): return id; case .separator(let id): return id }
    }
}

/// Mirrors floating-button-group.tsx / floating-button-group.rn.tsx / floating-button-group.vue: a pill (or column) of actions.
public struct ManicatFloatingButtonGroup: View {
    public enum Variant { case muted, floating }
    public enum Size { case sm, md }

    public struct Styles {
        public var button: ManicatStyle = { $0 }
        public var buttonText: ManicatStyle = { $0 }
        public var separator: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens

    private let items: [ManicatFloatingButtonGroupItem]
    private let label: String
    private let variant: Variant
    private let size: Size
    private let vertical: Bool
    private let iconOnly: Bool
    private let onAction: (String) -> Void
    private let styles: Styles

    public init(items: [ManicatFloatingButtonGroupItem], label: String, variant: Variant = .muted, size: Size = .md, vertical: Bool = false, iconOnly: Bool = false, styles: Styles = Styles(), onAction: @escaping (String) -> Void = { _ in }) {
        self.items = items
        self.label = label
        self.variant = variant
        self.size = size
        self.vertical = vertical
        self.iconOnly = iconOnly
        self.styles = styles
        self.onAction = onAction
    }

    public var body: some View {
        let height: CGFloat = size == .sm ? 32 : 40

        AnyLayout(vertical: vertical) {
            ForEach(items) { item in
                switch item {
                case .separator:
                    Rectangle().fill(tokens.border)
                        .frame(width: vertical ? 18 : 1, height: vertical ? 1 : 18)
                        .padding(4)
                        .manicatStyle(styles.separator)
                case let .action(id, label, icon, itemIconOnly, disabled, pressed, shortcut):
                    let compact = iconOnly || itemIconOnly
                    Button { onAction(id) } label: {
                        HStack(spacing: 6) {
                            icon
                            if !compact {
                                Text(label).font(.system(size: ManicatMetrics.textSm, weight: .medium)).foregroundStyle(tokens.foreground).manicatStyle(styles.buttonText)
                            }
                            if let shortcut, !compact {
                                Text(shortcut).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted)
                            }
                        }
                        .padding(.horizontal, 12)
                        .frame(minWidth: compact ? height : nil, minHeight: height)
                        .background(pressed ? tokens.surface : .clear, in: Capsule())
                        .manicatStyle(styles.button)
                    }
                    .buttonStyle(.plain)
                    .disabled(disabled)
                    .opacity(disabled ? 0.45 : 1)
                    .accessibilityLabel(label)
                    .accessibilityAddTraits(pressed ? .isSelected : [])
                }
            }
        }
        .padding(3)
        .background(variant == .floating ? tokens.surface : tokens.surfaceMuted, in: Capsule())
        .overlay(Capsule().stroke(tokens.border, lineWidth: 1))
        .shadow(color: .black.opacity(variant == .floating ? 0.14 : 0), radius: 14, y: 6)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
    }
}

/// Lays children out in a row or a column, chosen at run time.
private struct AnyLayout<Content: View>: View {
    let vertical: Bool
    let content: Content

    init(vertical: Bool, @ViewBuilder content: () -> Content) {
        self.vertical = vertical
        self.content = content()
    }

    var body: some View {
        if vertical { VStack(spacing: 2) { content } } else { HStack(spacing: 2) { content } }
    }
}
