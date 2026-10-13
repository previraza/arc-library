import SwiftUI

/// Mirrors hover-card.tsx / hover-card.rn.tsx / hover-card.vue. On the Mac the card opens when the pointer rests on the trigger;
/// there is no hover on a phone, so a press opens it as a small floating panel.
public struct ManicatHoverCard<Trigger: View, Content: View>: View {
    public struct Styles {
        public var card: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @State private var open = false
    @State private var hoverTask: Task<Void, Never>?

    private let styles: Styles
    private let trigger: Trigger
    private let content: Content

    public init(styles: Styles = Styles(), @ViewBuilder trigger: () -> Trigger, @ViewBuilder content: () -> Content) {
        self.styles = styles
        self.trigger = trigger()
        self.content = content()
    }

    public var body: some View {
        Button { open = true } label: { trigger }
            .buttonStyle(.plain)
            .accessibilityAddTraits(.isButton)
            #if os(macOS)
            .onHover { inside in
                hoverTask?.cancel()
                hoverTask = Task {
                    try? await Task.sleep(nanoseconds: inside ? 300_000_000 : 150_000_000)
                    if !Task.isCancelled { open = inside }
                }
            }
            #endif
            .popover(isPresented: $open) {
                content
                    .padding(ManicatMetrics.space.s4)
                    .frame(maxWidth: 320, alignment: .leading)
                    .background(tokens.surface)
                    .manicatStyle(styles.card)
                    .presentationCompactAdaptation(.popover)
            }
    }
}

/// A ready-made profile body for the card.
public struct ManicatHoverCardProfile: View {
    public struct Stat: Identifiable {
        public var id: String { label }
        public let label: String
        public let value: String
        public init(label: String, value: String) {
            self.label = label
            self.value = value
        }
    }

    @Environment(\.manicat) private var tokens

    private let name: String
    private let role: String?
    private let bio: String?
    private let stats: [Stat]
    private let meta: String?

    public init(name: String, role: String? = nil, bio: String? = nil, stats: [Stat] = [], meta: String? = nil) {
        self.name = name
        self.role = role
        self.bio = bio
        self.stats = stats
        self.meta = meta
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: ManicatMetrics.space.s2) {
            Text(name).font(.system(size: ManicatMetrics.textSm, weight: .semibold)).foregroundStyle(tokens.foreground)
            if let role { Text(role).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textSecondary) }
            if let bio { Text(bio).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.textSecondary) }
            if !stats.isEmpty {
                HStack(spacing: ManicatMetrics.space.s4) {
                    ForEach(stats) { stat in
                        (Text(stat.value).fontWeight(.semibold).foregroundColor(tokens.foreground) + Text(" \(stat.label)").foregroundColor(tokens.textMuted))
                            .font(.system(size: ManicatMetrics.textXs))
                    }
                }
            }
            if let meta { Text(meta).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted) }
        }
    }
}
