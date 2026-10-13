import SwiftUI

public struct ManicatTimelineEvent: Identifiable {
    public enum Tone { case neutral, success, danger }

    public let id: String
    public let at: Date
    public let actor: String?
    public let title: String
    public let meta: String?
    public let tone: Tone

    public init(id: String, at: Date, actor: String? = nil, title: String, meta: String? = nil, tone: Tone = .neutral) {
        self.id = id
        self.at = at
        self.actor = actor
        self.title = title
        self.meta = meta
        self.tone = tone
    }
}

/// Mirrors timeline.tsx / timeline.rn.tsx / timeline.vue: events newest first, with a rail and relative times. Pass `now` in so
/// every device agrees on what "3 hours ago" means.
public struct ManicatTimeline: View {
    public struct Styles {
        public var event: ManicatStyle = { $0 }
        public var dot: ManicatStyle = { $0 }
        public var line: ManicatStyle = { $0 }
        public var title: ManicatStyle = { $0 }
        public var meta: ManicatStyle = { $0 }
        public var time: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens

    private let events: [ManicatTimelineEvent]
    private let now: Date
    private let label: String
    private let locale: Locale
    private let maxHeight: CGFloat?
    private let styles: Styles

    public init(events: [ManicatTimelineEvent], now: Date, label: String, locale: Locale = Locale(identifier: "en_US"), maxHeight: CGFloat? = nil, styles: Styles = Styles()) {
        self.events = events
        self.now = now
        self.label = label
        self.locale = locale
        self.maxHeight = maxHeight
        self.styles = styles
    }

    public var body: some View {
        let sorted = events.sorted { $0.at > $1.at }

        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                ForEach(Array(sorted.enumerated()), id: \.element.id) { index, event in
                    HStack(alignment: .top, spacing: ManicatMetrics.space.s3) {
                        VStack(spacing: 0) {
                            Circle().fill(color(event.tone)).frame(width: 10, height: 10).padding(.top, 5).manicatStyle(styles.dot)
                            if index < sorted.count - 1 {
                                RoundedRectangle(cornerRadius: 1).fill(tokens.border).frame(width: 2).padding(.vertical, 4).manicatStyle(styles.line)
                            }
                        }
                        .frame(width: 12)
                        VStack(alignment: .leading, spacing: 2) {
                            ((event.actor.map { Text($0 + " ").fontWeight(.semibold) } ?? Text("")) + Text(event.title))
                                .font(.system(size: ManicatMetrics.textSm))
                                .foregroundStyle(tokens.foreground)
                                .manicatStyle(styles.title)
                            Text(ago(event.at)).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted).manicatStyle(styles.time)
                            if let meta = event.meta {
                                Text(meta).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textSecondary).manicatStyle(styles.meta)
                            }
                        }
                        .padding(.bottom, ManicatMetrics.space.s4)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .manicatStyle(styles.event)
                }
            }
        }
        .frame(maxHeight: maxHeight)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
    }

    private func color(_ tone: ManicatTimelineEvent.Tone) -> Color {
        switch tone { case .success: return tokens.success; case .danger: return tokens.danger; case .neutral: return tokens.borderStrong }
    }

    private func ago(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.locale = locale
        formatter.dateTimeStyle = .named
        return formatter.localizedString(for: date, relativeTo: now)
    }
}
