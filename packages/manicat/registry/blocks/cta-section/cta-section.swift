import SwiftUI

public enum ManicatCtaVariant { case centered, split, banner }

public struct ManicatCtaAction {
    public let label: String
    public let url: URL?
    public let onPress: (() -> Void)?
    /// With no url or onPress, the button confirms in place with this label, which suits previews.
    public let confirmedLabel: String?

    public init(_ label: String, url: URL? = nil, confirmedLabel: String? = nil, onPress: (() -> Void)? = nil) {
        self.label = label
        self.url = url
        self.confirmedLabel = confirmedLabel
        self.onPress = onPress
    }
}

/// Mirrors cta-section.tsx / cta-section.rn.tsx / cta-section.vue: a closing call to action as a centered block, a split block with
/// points, or a dismissible banner.
public struct ManicatCtaSection<Visual: View>: View {
    public struct Styles {
        public var title: ManicatStyle = { $0 }
        public var description: ManicatStyle = { $0 }
        public var actions: ManicatStyle = { $0 }
        public var note: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @State private var open = true

    private let variant: ManicatCtaVariant
    private let title: String?
    private let description: String?
    private let primaryAction: ManicatCtaAction?
    private let secondaryAction: ManicatCtaAction??
    private let note: String?
    private let faces: [URL]
    private let points: [String]?
    private let styles: Styles
    private let onDismiss: (() -> Void)?
    private let visual: Visual

    public init(variant: ManicatCtaVariant = .centered, title: String? = nil, description: String? = nil, primaryAction: ManicatCtaAction? = nil, secondaryAction: ManicatCtaAction?? = nil, note: String? = nil, faces: [URL] = [], points: [String]? = nil, styles: Styles = Styles(), onDismiss: (() -> Void)? = nil, @ViewBuilder visual: () -> Visual) {
        self.variant = variant
        self.title = title
        self.description = description
        self.primaryAction = primaryAction
        self.secondaryAction = secondaryAction
        self.note = note
        self.faces = faces
        self.points = points
        self.styles = styles
        self.onDismiss = onDismiss
        self.visual = visual()
    }

    private var defaults: (title: String, description: String, primary: ManicatCtaAction, secondary: ManicatCtaAction?, note: String?, points: [String]) {
        switch variant {
        case .centered: return ("Start building in minutes", "Set up a workspace, invite your team, and ship the first project this week. Free for 14 days.", ManicatCtaAction("Start free trial", confirmedLabel: "Trial started"), ManicatCtaAction("Talk to sales", confirmedLabel: "We'll email you"), "No credit card required", [])
        case .split: return ("Your team, set up before lunch", "Import your projects, bring everyone in, and keep working the way you already do.", ManicatCtaAction("Create a workspace", confirmedLabel: "Workspace created"), ManicatCtaAction("Book a demo", confirmedLabel: "Demo requested"), nil, ["Import from any tracker in one step", "Single sign-on and audit logs included", "Cancel anytime from settings"])
        case .banner: return ("Workflows are here", "Automate handoffs between teams with no code.", ManicatCtaAction("See how it works", confirmedLabel: "Opened"), nil, nil, [])
        }
    }

    public var body: some View {
        let text = defaults
        let primary = primaryAction ?? text.primary
        let secondary: ManicatCtaAction? = secondaryAction.map { $0 } ?? text.secondary

        if variant == .banner {
            if open {
                HStack(spacing: 10) {
                    (Text("\(title ?? text.title) ").font(.system(size: 14, weight: .semibold)).foregroundColor(tokens.foreground) + Text(description ?? text.description).font(.system(size: 14)).foregroundColor(tokens.textSecondary))
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .manicatStyle(styles.description)
                    CtaButton(action: primary, variant: .primary, size: .sm)
                    if let onDismiss {
                        ManicatButton("✕", variant: .ghost, size: .sm) { open = false; onDismiss() }.accessibilityLabel("Dismiss")
                    }
                }
                .padding(12)
                .background(tokens.surfaceMuted, in: RoundedRectangle(cornerRadius: 20))
                .overlay(RoundedRectangle(cornerRadius: 20).stroke(tokens.border, lineWidth: 1))
            }
        } else {
            let list = points ?? text.points
            let centered = variant == .centered

            VStack(alignment: centered ? .center : .leading, spacing: 14) {
                Text(title ?? text.title).font(.system(size: 28, weight: .semibold)).tracking(-0.6).foregroundStyle(tokens.foreground)
                    .multilineTextAlignment(centered ? .center : .leading)
                    .accessibilityAddTraits(.isHeader)
                    .manicatStyle(styles.title)
                Text(description ?? text.description).font(.system(size: 15)).lineSpacing(3).foregroundStyle(tokens.textSecondary)
                    .multilineTextAlignment(centered ? .center : .leading)
                    .manicatStyle(styles.description)
                if variant == .split, !list.isEmpty {
                    VStack(alignment: .leading, spacing: 6) {
                        ForEach(list, id: \.self) { point in Text("✓ \(point)").font(.system(size: 14)).foregroundStyle(tokens.foreground) }
                    }
                }
                ManicatFlowLayout(spacing: 10, lineSpacing: 10) {
                    CtaButton(action: primary, variant: .primary, size: .lg)
                    if let secondary { CtaButton(action: secondary, variant: .secondary, size: .lg) }
                }
                .manicatStyle(styles.actions)
                if centered {
                    HStack(spacing: 6) {
                        ForEach(Array(faces.prefix(4)), id: \.self) { url in ManicatAvatar(name: "", url: url, size: .sm) }
                        Text(note ?? text.note ?? "").font(.system(size: 13)).foregroundStyle(tokens.textMuted).manicatStyle(styles.note)
                    }
                } else {
                    visual
                }
            }
            .frame(maxWidth: .infinity, alignment: centered ? .center : .leading)
        }
    }
}

public extension ManicatCtaSection where Visual == EmptyView {
    init(variant: ManicatCtaVariant = .centered, title: String? = nil, description: String? = nil, primaryAction: ManicatCtaAction? = nil, secondaryAction: ManicatCtaAction?? = nil, note: String? = nil, faces: [URL] = [], points: [String]? = nil, styles: Styles = Styles(), onDismiss: (() -> Void)? = nil) {
        self.init(variant: variant, title: title, description: description, primaryAction: primaryAction, secondaryAction: secondaryAction, note: note, faces: faces, points: points, styles: styles, onDismiss: onDismiss) { EmptyView() }
    }
}

private struct CtaButton: View {
    let action: ManicatCtaAction
    let variant: ManicatButtonVariant
    let size: ManicatButtonSize
    @Environment(\.openURL) private var openURL
    @State private var confirmed = false

    var body: some View {
        ManicatButton(confirmed ? "✓ \(action.confirmedLabel ?? action.label)" : action.label, variant: variant, size: size) {
            if let url = action.url { openURL(url) } else if let onPress = action.onPress { onPress() } else { confirmed.toggle() }
        }
    }
}
