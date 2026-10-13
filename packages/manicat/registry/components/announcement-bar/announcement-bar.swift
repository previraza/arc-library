import SwiftUI

public struct ManicatAnnouncement: Identifiable {
    public let id: String
    public let message: String
    public let actionLabel: String?
    public let action: (() -> Void)?

    public init(id: String, message: String, actionLabel: String? = nil, action: (() -> Void)? = nil) {
        self.id = id
        self.message = message
        self.actionLabel = actionLabel
        self.action = action
    }
}

/// Mirrors announcement-bar.tsx / announcement-bar.rn.tsx / announcement-bar.vue: a bar that cycles through messages and can be
/// dismissed.
public struct ManicatAnnouncementBar: View {
    public struct Styles {
        public var root: ManicatStyle = { $0 }
        public var message: ManicatStyle = { $0 }
        public var action: ManicatStyle = { $0 }
        public var dismiss: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @State private var index = 0

    private let messages: [ManicatAnnouncement]
    @Binding private var open: Bool
    private let interval: Double
    private let autoPlay: Bool
    private let styles: Styles

    public init(messages: [ManicatAnnouncement], open: Binding<Bool>, interval: Double = 6, autoPlay: Bool = true, styles: Styles = Styles()) {
        self.messages = messages
        self._open = open
        self.interval = interval
        self.autoPlay = autoPlay
        self.styles = styles
    }

    public var body: some View {
        if open, !messages.isEmpty {
            let current = messages[index % messages.count]

            HStack(spacing: ManicatMetrics.space.s3) {
                HStack(spacing: ManicatMetrics.space.s2) {
                    Text(current.message).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.background).manicatStyle(styles.message)
                    if let label = current.actionLabel {
                        Button { current.action?() } label: {
                            Text(label).font(.system(size: ManicatMetrics.textSm, weight: .semibold)).underline().foregroundStyle(tokens.background).manicatStyle(styles.action)
                        }
                        .buttonStyle(.plain)
                        .accessibilityAddTraits(.isLink)
                    }
                }
                .id(current.id)
                .transition(.asymmetric(insertion: .opacity.combined(with: .offset(y: 6)), removal: .opacity.combined(with: .offset(y: -6))))
                .frame(maxWidth: .infinity, alignment: .center)
                Button { open = false } label: {
                    Text("×").font(.system(size: 18)).foregroundStyle(tokens.background).manicatStyle(styles.dismiss)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Dismiss announcement")
            }
            .padding(.horizontal, ManicatMetrics.space.s4)
            .padding(.vertical, ManicatMetrics.space.s3)
            .background(tokens.foreground)
            .manicatStyle(styles.root)
            .animation(.easeOut(duration: 0.3), value: index)
            .task(id: messages.count) {
                guard autoPlay, messages.count > 1 else { return }
                while !Task.isCancelled {
                    try? await Task.sleep(nanoseconds: UInt64(interval * 1_000_000_000))
                    if !Task.isCancelled { index = (index + 1) % messages.count }
                }
            }
            .accessibilityElement(children: .contain)
        }
    }
}
