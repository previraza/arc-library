import SwiftUI

/// Mirrors card.tsx / card.rn.tsx / card.vue. Add the optional parts with `media`, `avatar` and `action`, and extra content
/// between the description and the footer with the trailing closure. Pass `onTap` to make the whole card a button.
public struct ManicatCard<Content: View>: View {
    public struct Styles {
        public var media: ManicatStyle = { $0 }
        public var content: ManicatStyle = { $0 }
        public var title: ManicatStyle = { $0 }
        public var description: ManicatStyle = { $0 }
        public var footer: ManicatStyle = { $0 }
        public var meta: ManicatStyle = { $0 }
        public var status: ManicatStyle = { $0 }
        public var action: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens

    private let title: String
    private let description: String?
    private let meta: String?
    private let status: String?
    private let styles: Styles
    private let onTap: (() -> Void)?
    private let content: Content
    private var mediaView: AnyView?
    private var avatarView: AnyView?
    private var actionView: AnyView?

    public init(title: String, description: String? = nil, meta: String? = nil, status: String? = nil, styles: Styles = Styles(), onTap: (() -> Void)? = nil, @ViewBuilder content: () -> Content) {
        self.title = title
        self.description = description
        self.meta = meta
        self.status = status
        self.styles = styles
        self.onTap = onTap
        self.content = content()
    }

    /// A hero image or illustration across the top.
    public func media<V: View>(@ViewBuilder _ view: () -> V) -> Self {
        var copy = self
        copy.mediaView = AnyView(view())
        return copy
    }

    /// A small avatar at the start of the footer.
    public func avatar<V: View>(@ViewBuilder _ view: () -> V) -> Self {
        var copy = self
        copy.avatarView = AnyView(view())
        return copy
    }

    /// Buttons or links at the end of the footer.
    public func action<V: View>(@ViewBuilder _ view: () -> V) -> Self {
        var copy = self
        copy.actionView = AnyView(view())
        return copy
    }

    public var body: some View {
        if let onTap {
            Button(action: onTap) { card }
                .buttonStyle(CardPressStyle(tokens: tokens))
        } else {
            card.overlay(RoundedRectangle(cornerRadius: 26).stroke(tokens.border, lineWidth: 1))
        }
    }

    private struct CardPressStyle: ButtonStyle {
        let tokens: ManicatTokens
        func makeBody(configuration: Configuration) -> some View {
            configuration.label
                .overlay(RoundedRectangle(cornerRadius: 26).stroke(configuration.isPressed ? tokens.borderStrong : tokens.border, lineWidth: 1))
        }
    }

    private var card: some View {
        VStack(alignment: .leading, spacing: 0) {
            if let mediaView {
                mediaView
                    .frame(maxWidth: .infinity, minHeight: 112)
                    .background(tokens.surfaceMuted)
                    .clipped()
                    .manicatStyle(styles.media)
            }
            VStack(alignment: .leading, spacing: 0) {
                Text(title)
                    .font(.system(size: ManicatMetrics.textLg, weight: .medium))
                    .foregroundStyle(tokens.foreground)
                    .manicatStyle(styles.title)
                if let description {
                    Text(description)
                        .font(.system(size: ManicatMetrics.textSm))
                        .foregroundStyle(tokens.textSecondary)
                        .lineSpacing(3)
                        .padding(.top, ManicatMetrics.space.s2)
                        .manicatStyle(styles.description)
                }
                content
                if avatarView != nil || actionView != nil || meta != nil || status != nil { footer }
            }
            .padding(ManicatMetrics.space.s5)
            .frame(maxWidth: .infinity, alignment: .leading)
            .manicatStyle(styles.content)
        }
        .background(tokens.surface, in: RoundedRectangle(cornerRadius: 26))
        .clipShape(RoundedRectangle(cornerRadius: 26))
        .accessibilityElement(children: onTap == nil ? .contain : .combine)
    }

    private var footer: some View {
        HStack(spacing: ManicatMetrics.space.s3) {
            HStack(spacing: ManicatMetrics.space.s3) {
                if let avatarView { avatarView.frame(width: 32, height: 32).clipShape(Circle()) }
                VStack(alignment: .leading, spacing: 0) {
                    if let meta {
                        Text(meta).font(.system(size: ManicatMetrics.textXs, weight: .medium)).foregroundStyle(tokens.foreground).manicatStyle(styles.meta)
                    }
                    if let status {
                        Text(status).font(.system(size: ManicatMetrics.textXs)).monospacedDigit().foregroundStyle(tokens.textMuted).manicatStyle(styles.status)
                    }
                }
            }
            Spacer(minLength: 0)
            if let actionView { HStack(spacing: ManicatMetrics.space.s3) { actionView }.manicatStyle(styles.action) }
        }
        .padding(.top, ManicatMetrics.space.s5)
        .manicatStyle(styles.footer)
    }
}

public extension ManicatCard where Content == EmptyView {
    init(title: String, description: String? = nil, meta: String? = nil, status: String? = nil, styles: Styles = Styles(), onTap: (() -> Void)? = nil) {
        self.init(title: title, description: description, meta: meta, status: status, styles: styles, onTap: onTap) { EmptyView() }
    }
}
