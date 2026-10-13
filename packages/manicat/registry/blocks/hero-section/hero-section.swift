import SwiftUI

public enum ManicatHeroVariant { case centered, split, minimal }

public struct ManicatHeroAction {
    public let label: String
    public let url: URL?
    public let onPress: (() -> Void)?
    /// Shown in place of the label for a moment after a press, such as "Trial started".
    public let doneLabel: String?

    public init(_ label: String, url: URL? = nil, doneLabel: String? = nil, onPress: (() -> Void)? = nil) {
        self.label = label
        self.url = url
        self.doneLabel = doneLabel
        self.onPress = onPress
    }
}

public struct ManicatHeroInstall {
    /// Short label, such as npm or pnpm. The first command is shown.
    public let label: String
    public let command: String

    public init(_ label: String, command: String) {
        self.label = label
        self.command = command
    }
}

/// Mirrors hero-section.tsx / hero-section.rn.tsx / hero-section.vue: an announcement pill, a headline, two actions, an install command
/// and a visual. `centered` and `minimal` align the copy to the middle; `split` aligns it to the start.
public struct ManicatHeroSection<Media: View>: View {
    public struct Styles {
        public var title: ManicatStyle = { $0 }
        public var description: ManicatStyle = { $0 }
        public var actions: ManicatStyle = { $0 }
        public var install: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @Environment(\.openURL) private var openURL
    @State private var copied = false

    private let variant: ManicatHeroVariant
    private let title: String
    private let description: String?
    private let announcement: ManicatHeroAction?
    private let primaryAction: ManicatHeroAction?
    private let secondaryAction: ManicatHeroAction?
    private let install: [ManicatHeroInstall]
    private let meta: [String]
    private let styles: Styles
    private let onCopy: ((String) -> Void)?
    private let media: Media

    public init(variant: ManicatHeroVariant = .centered, title: String = "Interfaces that move with intent", description: String? = "Components and blocks with springs, states and details already done, so you can ship the product instead of the polish.", announcement: ManicatHeroAction? = ManicatHeroAction("What's new in 2.4"), primaryAction: ManicatHeroAction? = ManicatHeroAction("Get started", doneLabel: "Opened"), secondaryAction: ManicatHeroAction? = ManicatHeroAction("Browse components"), install: [ManicatHeroInstall] = [], meta: [String] = [], styles: Styles = Styles(), onCopy: ((String) -> Void)? = nil, @ViewBuilder media: () -> Media) {
        self.variant = variant
        self.title = title
        self.description = description
        self.announcement = announcement
        self.primaryAction = primaryAction
        self.secondaryAction = secondaryAction
        self.install = install
        self.meta = meta
        self.styles = styles
        self.onCopy = onCopy
        self.media = media()
    }

    public var body: some View {
        let split = variant == .split
        let alignment: HorizontalAlignment = split ? .leading : .center

        VStack(alignment: alignment, spacing: 16) {
            if let announcement {
                Button { run(announcement) } label: {
                    Text("\(announcement.label) →").font(.system(size: 13)).foregroundStyle(tokens.textSecondary)
                        .padding(.horizontal, 12).padding(.vertical, 6)
                        .background(tokens.surfaceMuted, in: Capsule())
                        .overlay(Capsule().stroke(tokens.border, lineWidth: 1))
                }
                .buttonStyle(.plain)
            }
            Text(title)
                .font(.system(size: variant == .minimal ? 44 : 36, weight: .bold))
                .tracking(-1.2)
                .foregroundStyle(tokens.foreground)
                .multilineTextAlignment(split ? .leading : .center)
                .accessibilityAddTraits(.isHeader)
                .manicatStyle(styles.title)
            if let description {
                Text(description).font(.system(size: 16)).lineSpacing(4).foregroundStyle(tokens.textSecondary)
                    .multilineTextAlignment(split ? .leading : .center)
                    .manicatStyle(styles.description)
            }
            if primaryAction != nil || secondaryAction != nil {
                ManicatFlowLayout(spacing: 10, lineSpacing: 10) {
                    if let primaryAction { HeroButton(action: primaryAction, variant: .primary, run: run) }
                    if let secondaryAction { HeroButton(action: secondaryAction, variant: .secondary, run: run) }
                }
                .manicatStyle(styles.actions)
            }
            if let command = install.first { installRow(command) }
            if !meta.isEmpty {
                ManicatFlowLayout(spacing: 12, lineSpacing: 4) {
                    ForEach(meta, id: \.self) { entry in Text(entry).font(.system(size: 12)).foregroundStyle(tokens.textMuted) }
                }
            }
            media
        }
        .padding(.vertical, 24)
        .frame(maxWidth: .infinity, alignment: split ? .leading : .center)
    }

    private func installRow(_ command: ManicatHeroInstall) -> some View {
        HStack(spacing: 8) {
            Text("$").font(.system(size: 13, design: .monospaced)).foregroundStyle(tokens.textMuted)
            Text(command.command).font(.system(size: 13, design: .monospaced)).foregroundStyle(tokens.foreground).textSelection(.enabled).frame(maxWidth: .infinity, alignment: .leading)
            ManicatButton(copied ? "Copied" : "Copy", variant: .ghost, size: .sm) {
                onCopy?(command.command)
                copied = true
                Task {
                    try? await Task.sleep(nanoseconds: 1_500_000_000)
                    copied = false
                }
            }
            .accessibilityLabel("Copy install command")
        }
        .padding(.leading, 14)
        .frame(maxWidth: .infinity)
        .background(tokens.surfaceMuted, in: RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(tokens.border, lineWidth: 1))
        .manicatStyle(styles.install)
    }

    private func run(_ action: ManicatHeroAction) {
        action.onPress?()
        if let url = action.url { openURL(url) }
    }
}

private struct HeroButton: View {
    let action: ManicatHeroAction
    let variant: ManicatButtonVariant
    let run: (ManicatHeroAction) -> Void
    @State private var done = false

    var body: some View {
        ManicatButton(done && action.doneLabel != nil ? "✓ \(action.doneLabel ?? "")" : action.label, variant: variant, size: .lg) {
            run(action)
            guard action.doneLabel != nil else { return }
            done = true
            Task {
                try? await Task.sleep(nanoseconds: 2_400_000_000)
                done = false
            }
        }
    }
}

public extension ManicatHeroSection where Media == EmptyView {
    init(variant: ManicatHeroVariant = .centered, title: String = "Interfaces that move with intent", description: String? = "Components and blocks with springs, states and details already done, so you can ship the product instead of the polish.", announcement: ManicatHeroAction? = ManicatHeroAction("What's new in 2.4"), primaryAction: ManicatHeroAction? = ManicatHeroAction("Get started", doneLabel: "Opened"), secondaryAction: ManicatHeroAction? = ManicatHeroAction("Browse components"), install: [ManicatHeroInstall] = [], meta: [String] = [], styles: Styles = Styles(), onCopy: ((String) -> Void)? = nil) {
        self.init(variant: variant, title: title, description: description, announcement: announcement, primaryAction: primaryAction, secondaryAction: secondaryAction, install: install, meta: meta, styles: styles, onCopy: onCopy) { EmptyView() }
    }
}
