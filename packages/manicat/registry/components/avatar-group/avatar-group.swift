import SwiftUI

public struct ManicatAvatarGroupMember: Identifiable {
    public var id: String { name }
    public let name: String
    public let url: URL?
    public let status: ManicatAvatarStatus?

    public init(name: String, url: URL? = nil, status: ManicatAvatarStatus? = nil) {
        self.name = name
        self.url = url
        self.status = status
    }
}

/// Mirrors avatar-group.tsx / avatar-group.rn.tsx / avatar-group.vue: overlapping avatars that collapse into a +N.
public struct ManicatAvatarGroup: View {
    public struct Styles {
        public var slot: ManicatStyle = { $0 }
        public var overflow: ManicatStyle = { $0 }
        public var overflowText: ManicatStyle = { $0 }
        public init() {}
    }

    public enum Size { case sm, md, lg }

    @Environment(\.manicat) private var tokens

    private let members: [ManicatAvatarGroupMember]
    private let max: Int
    private let size: Size
    private let label: String
    private let styles: Styles

    public init(members: [ManicatAvatarGroupMember], max: Int = 4, size: Size = .md, label: String = "Team members", styles: Styles = Styles()) {
        self.members = members
        self.max = max
        self.size = size
        self.label = label
        self.styles = styles
    }

    public var body: some View {
        let visible = Array(members.prefix(Swift.max(0, max)))
        let overflow = Swift.max(0, members.count - visible.count)
        let box = dimension
        // Neighbours overlap by a third of their width.
        let step = -(box / 3).rounded()

        HStack(spacing: step) {
            ForEach(visible) { member in
                ManicatAvatar(name: member.name, url: member.url, size: avatarSize, status: member.status)
                    .padding(2)
                    .background(tokens.background, in: Circle())
                    .manicatStyle(styles.slot)
            }
            if overflow > 0 {
                Text("+\(overflow)")
                    .font(.system(size: ManicatMetrics.textXs, weight: .medium))
                    .foregroundStyle(tokens.textSecondary)
                    .manicatStyle(styles.overflowText)
                    .frame(width: box + 4, height: box + 4)
                    .background(tokens.surfaceMuted, in: Circle())
                    .overlay(Circle().stroke(tokens.background, lineWidth: 2))
                    .manicatStyle(styles.overflow)
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(label), \(members.count)")
    }

    private var dimension: CGFloat { ManicatAvatar.dimension(avatarSize) }
    private var avatarSize: ManicatAvatarSize { switch size { case .sm: return .sm; case .md: return .md; case .lg: return .lg } }
}
