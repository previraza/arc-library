import SwiftUI

public struct ManicatBreadcrumbItem: Identifiable {
    public var id: String { label }
    public let label: String
    /// Called when the crumb is pressed; navigate here with your router. The last crumb is the current page and is not pressable.
    public let action: (() -> Void)?

    public init(_ label: String, action: (() -> Void)? = nil) {
        self.label = label
        self.action = action
    }
}

/// Mirrors breadcrumb.tsx / breadcrumb.rn.tsx / breadcrumb.vue.
public struct ManicatBreadcrumb: View {
    public struct Styles {
        public var list: ManicatStyle = { $0 }
        public var crumb: ManicatStyle = { $0 }
        public var current: ManicatStyle = { $0 }
        public var separator: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens

    private let items: [ManicatBreadcrumbItem]
    private let styles: Styles

    public init(_ items: [ManicatBreadcrumbItem], styles: Styles = Styles()) {
        self.items = items
        self.styles = styles
    }

    public var body: some View {
        ManicatFlowLayout(spacing: 0, lineSpacing: 2) {
            ForEach(Array(items.enumerated()), id: \.offset) { index, item in
                let last = index == items.count - 1
                HStack(spacing: 0) {
                    if last {
                        Text(item.label)
                            .font(.system(size: ManicatMetrics.textSm, weight: .medium))
                            .foregroundStyle(tokens.accentStrong)
                            .padding(.vertical, 4)
                            .manicatStyle(styles.current)
                            .accessibilityAddTraits(.isStaticText)
                    } else {
                        Button { item.action?() } label: {
                            Text(item.label)
                                .font(.system(size: ManicatMetrics.textSm))
                                .foregroundStyle(tokens.textSecondary)
                                .padding(.vertical, 4)
                                .manicatStyle(styles.crumb)
                        }
                        .buttonStyle(.plain)
                        .accessibilityAddTraits(.isLink)
                        Text("›")
                            .font(.system(size: 18))
                            .foregroundStyle(tokens.borderStrong)
                            .padding(.horizontal, 6)
                            .manicatStyle(styles.separator)
                            .accessibilityHidden(true)
                    }
                }
            }
        }
        .manicatStyle(styles.list)
        .accessibilityElement(children: .contain)
    }
}
