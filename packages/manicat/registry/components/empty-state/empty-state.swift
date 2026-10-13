import SwiftUI

/// Mirrors empty-state.tsx / empty-state.rn.tsx / empty-state.vue. Add the icon and the action with `icon` and `action`.
public struct ManicatEmptyState: View {
    public struct Styles {
        public var icon: ManicatStyle = { $0 }
        public var title: ManicatStyle = { $0 }
        public var description: ManicatStyle = { $0 }
        public var action: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens

    private let title: String
    private let description: String
    private let styles: Styles
    private var iconView: AnyView?
    private var actionView: AnyView?

    public init(title: String, description: String, styles: Styles = Styles()) {
        self.title = title
        self.description = description
        self.styles = styles
    }

    /// An icon or glyph above the title.
    public func icon<V: View>(@ViewBuilder _ content: () -> V) -> Self {
        var copy = self
        copy.iconView = AnyView(content())
        return copy
    }

    /// A button or link that fixes the emptiness.
    public func action<V: View>(@ViewBuilder _ content: () -> V) -> Self {
        var copy = self
        copy.actionView = AnyView(content())
        return copy
    }

    public var body: some View {
        VStack(spacing: ManicatMetrics.space.s2) {
            if let iconView {
                iconView
                    .frame(minWidth: 48, minHeight: 48)
                    .padding(.horizontal, 12)
                    .background(tokens.surfaceMuted, in: RoundedRectangle(cornerRadius: 16))
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(tokens.border, lineWidth: 1))
                    .padding(.bottom, ManicatMetrics.space.s2)
                    .manicatStyle(styles.icon)
            }
            Text(title)
                .font(.system(size: ManicatMetrics.textLg, weight: .medium))
                .foregroundStyle(tokens.foreground)
                .multilineTextAlignment(.center)
                .accessibilityAddTraits(.isHeader)
                .manicatStyle(styles.title)
            Text(description)
                .font(.system(size: ManicatMetrics.textSm))
                .foregroundStyle(tokens.textSecondary)
                .multilineTextAlignment(.center)
                .lineSpacing(3)
                .frame(maxWidth: 320)
                .manicatStyle(styles.description)
            if let actionView {
                actionView
                    .padding(.top, ManicatMetrics.space.s3)
                    .manicatStyle(styles.action)
            }
        }
        .padding(ManicatMetrics.space.s5)
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .contain)
    }
}
