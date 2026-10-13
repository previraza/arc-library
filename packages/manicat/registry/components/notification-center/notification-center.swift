import SwiftUI

public struct ManicatNotification: Identifiable {
    public enum Tone { case info, success, warning }

    public let id: String
    public let title: String
    public let description: String?
    public let time: String
    public var read: Bool
    public let tone: Tone

    public init(id: String, title: String, description: String? = nil, time: String, read: Bool = false, tone: Tone = .info) {
        self.id = id
        self.title = title
        self.description = description
        self.time = time
        self.read = read
        self.tone = tone
    }
}

/// Mirrors notification-center.tsx / notification-center.rn.tsx / notification-center.vue: a bell with an unread count; the list opens
/// as a sheet. Press a row to toggle read, × to dismiss.
public struct ManicatNotificationCenter: View {
    public struct Styles {
        public var trigger: ManicatStyle = { $0 }
        public var badge: ManicatStyle = { $0 }
        public var panel: ManicatStyle = { $0 }
        public var item: ManicatStyle = { $0 }
        public var title: ManicatStyle = { $0 }
        public var description: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @State private var internalOpen = false

    @Binding private var notifications: [ManicatNotification]
    private let label: String
    private let open: Binding<Bool>?
    private let styles: Styles
    private let onReadChange: ((ManicatNotification, Bool) -> Void)?
    private let onDismiss: ((ManicatNotification) -> Void)?

    public init(notifications: Binding<[ManicatNotification]>, label: String = "Notifications", open: Binding<Bool>? = nil, styles: Styles = Styles(), onReadChange: ((ManicatNotification, Bool) -> Void)? = nil, onDismiss: ((ManicatNotification) -> Void)? = nil) {
        self._notifications = notifications
        self.label = label
        self.open = open
        self.styles = styles
        self.onReadChange = onReadChange
        self.onDismiss = onDismiss
    }

    private var visible: Binding<Bool> { open ?? $internalOpen }
    private var unread: Int { notifications.filter { !$0.read }.count }

    public var body: some View {
        Button { visible.wrappedValue = true } label: {
            Text("🔔").font(.system(size: 16))
                .frame(width: ManicatMetrics.controlHeight.sm + 4, height: ManicatMetrics.controlHeight.sm + 4)
                .background(tokens.surface, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
                .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(tokens.border, lineWidth: 1))
                .overlay(alignment: .topTrailing) {
                    if unread > 0 {
                        Text("\(unread)").font(.system(size: 10, weight: .bold)).foregroundStyle(.white)
                            .padding(.horizontal, 4).frame(minWidth: 16, minHeight: 16)
                            .background(tokens.danger, in: Capsule())
                            .manicatStyle(styles.badge)
                            .offset(x: 4, y: -4)
                    }
                }
                .manicatStyle(styles.trigger)
        }
        .buttonStyle(.plain)
        .accessibilityLabel("\(label)\(unread > 0 ? ", \(unread) unread" : "")")
        .sheet(isPresented: visible) { panel.presentationDetents([.medium, .large]) }
    }

    private var panel: some View {
        VStack(spacing: 0) {
            HStack {
                Text(label).font(.system(size: ManicatMetrics.textLg, weight: .medium)).foregroundStyle(tokens.foreground).accessibilityAddTraits(.isHeader)
                Spacer(minLength: 0)
                Button { for index in notifications.indices where !notifications[index].read { setRead(index, true) } } label: {
                    Text("Mark all read").font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textSecondary)
                }
                .buttonStyle(.plain)
            }
            .padding(ManicatMetrics.space.s4)
            .overlay(alignment: .bottom) { Rectangle().fill(tokens.border).frame(height: 1) }
            ScrollView {
                if notifications.isEmpty {
                    Text("You're all caught up.").font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.textMuted).frame(maxWidth: .infinity).padding(ManicatMetrics.space.s5)
                }
                ForEach(Array(notifications.enumerated()), id: \.element.id) { index, item in row(item, index) }
            }
        }
        .background(tokens.surface)
        .manicatStyle(styles.panel)
    }

    private func color(_ tone: ManicatNotification.Tone) -> Color {
        switch tone {
        case .success: return tokens.success
        case .warning: return tokens.warning
        case .info: return tokens.accent
        }
    }

    private func row(_ item: ManicatNotification, _ index: Int) -> some View {
        HStack(alignment: .top, spacing: ManicatMetrics.space.s3) {
            Circle().fill(item.read ? .clear : color(item.tone)).frame(width: 8, height: 8).padding(.top, 6)
            VStack(alignment: .leading, spacing: 2) {
                Text(item.title).font(.system(size: ManicatMetrics.textSm, weight: item.read ? .regular : .semibold)).foregroundStyle(tokens.foreground).manicatStyle(styles.title)
                if let description = item.description { Text(description).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textSecondary).manicatStyle(styles.description) }
                Text(item.time).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            Button {
                notifications.removeAll { $0.id == item.id }
                onDismiss?(item)
            } label: { Text("×").font(.system(size: 18)).foregroundStyle(tokens.textMuted) }
                .buttonStyle(.plain)
                .accessibilityLabel("Dismiss \(item.title)")
        }
        .padding(ManicatMetrics.space.s4)
        .contentShape(Rectangle())
        .onTapGesture { setRead(index, !item.read) }
        .accessibilityAddTraits(item.read ? [] : .isSelected)
        .manicatStyle(styles.item)
    }

    private func setRead(_ index: Int, _ read: Bool) {
        notifications[index].read = read
        onReadChange?(notifications[index], read)
    }
}
