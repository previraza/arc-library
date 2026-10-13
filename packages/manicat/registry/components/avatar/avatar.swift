import SwiftUI

public enum ManicatAvatarSize { case sm, md, lg, xl }
public enum ManicatAvatarStatus { case online, offline }

/// Mirrors avatar.tsx / avatar.rn.tsx / avatar.vue. Falls back to initials when there is no image or it fails to load.
public struct ManicatAvatar: View {
    public struct Styles {
        public var image: ManicatStyle = { $0 }
        public var fallback: ManicatStyle = { $0 }
        public var status: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens

    private let name: String
    private let url: URL?
    private let size: ManicatAvatarSize
    private let status: ManicatAvatarStatus?
    private let styles: Styles

    public init(name: String, url: URL? = nil, size: ManicatAvatarSize = .md, status: ManicatAvatarStatus? = nil, styles: Styles = Styles()) {
        self.name = name
        self.url = url
        self.size = size
        self.status = status
        self.styles = styles
    }

    public var body: some View {
        let box = Self.dimension(size)
        ZStack(alignment: .bottomTrailing) {
            Circle().fill(tokens.surfaceMuted)
                .overlay(Circle().stroke(tokens.border, lineWidth: 1))
                .overlay { content }
                .frame(width: box, height: box)
            if let status {
                Circle().fill(status == .online ? tokens.success : tokens.textMuted)
                    .frame(width: 10, height: 10)
                    .overlay(Circle().stroke(tokens.background, lineWidth: 2))
                    .manicatStyle(styles.status)
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(name)\(status.map { $0 == .online ? ", online" : ", offline" } ?? "")")
        .accessibilityAddTraits(.isImage)
    }

    @ViewBuilder private var content: some View {
        if let url {
            AsyncImage(url: url) { phase in
                if let image = phase.image { image.resizable().scaledToFill().manicatStyle(styles.image) } else { initialsView }
            }
            .clipShape(Circle())
        } else {
            initialsView
        }
    }

    private var initialsView: some View {
        Text(initials)
            .font(.system(size: Self.fontSize(size), weight: .medium))
            .foregroundStyle(tokens.foreground)
            .manicatStyle(styles.fallback)
    }

    private var initials: String {
        name.split(separator: " ").prefix(2).compactMap { $0.first.map { String($0).uppercased() } }.joined()
    }

    static func dimension(_ size: ManicatAvatarSize) -> CGFloat {
        switch size { case .sm: return 28; case .md: return 36; case .lg: return 48; case .xl: return 88 }
    }

    private static func fontSize(_ size: ManicatAvatarSize) -> CGFloat {
        switch size { case .sm: return 10; case .md: return ManicatMetrics.textXs; case .lg: return ManicatMetrics.textSm; case .xl: return 22 }
    }
}
