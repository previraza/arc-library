import SwiftUI

public struct ManicatChatParticipant: Identifiable {
    public let id: String
    public let name: String
    public let avatar: URL?

    public init(id: String, name: String, avatar: URL? = nil) {
        self.id = id
        self.name = name
        self.avatar = avatar
    }
}

public struct ManicatChatReaction: Identifiable {
    public var id: String { emoji }
    public let emoji: String
    public var count: Int
    public var mine: Bool

    public init(emoji: String, count: Int, mine: Bool = false) {
        self.emoji = emoji
        self.count = count
        self.mine = mine
    }
}

public struct ManicatChatMessage: Identifiable {
    public enum Status { case sending, sent, delivered, read, failed }

    public let id: String
    public let authorId: String
    public let text: String?
    public let createdAt: Date
    public var reactions: [ManicatChatReaction]
    public var status: Status?

    public init(id: String, authorId: String, text: String? = nil, createdAt: Date, reactions: [ManicatChatReaction] = [], status: Status? = nil) {
        self.id = id
        self.authorId = authorId
        self.text = text
        self.createdAt = createdAt
        self.reactions = reactions
        self.status = status
    }
}

/// Mirrors chat-thread.tsx / chat-thread.rn.tsx / chat-thread.vue: bubbles grouped by author, reactions, read receipts, a typing
/// line and a composer. Sending and reacting update `messages`.
public struct ManicatChatThread: View {
    public struct Styles {
        public var list: ManicatStyle = { $0 }
        public var bubble: ManicatStyle = { $0 }
        public var bubbleMine: ManicatStyle = { $0 }
        public var text: ManicatStyle = { $0 }
        public var composer: ManicatStyle = { $0 }
        public var input: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @State private var draft = ""
    @State private var picking: String?

    private let participants: [ManicatChatParticipant]
    private let currentUserId: String
    @Binding private var messages: [ManicatChatMessage]
    private let typing: [String]
    private let readBy: [String: String]
    private let reactions: [String]
    private let placeholder: String
    private let composer: Bool
    private let groupWindow: TimeInterval
    private let locale: Locale
    private let label: String
    private let height: CGFloat
    private let styles: Styles
    private let onSend: ((String) -> Void)?
    private let onReact: ((String, String) -> Void)?
    private let onRetry: ((String) -> Void)?

    public init(participants: [ManicatChatParticipant], currentUserId: String, messages: Binding<[ManicatChatMessage]>, typing: [String] = [], readBy: [String: String] = [:], reactions: [String] = ["👍", "❤️", "🚀"], placeholder: String = "Write a message…", composer: Bool = true, groupWindow: TimeInterval = 300, locale: Locale = Locale(identifier: "en_US"), label: String = "Conversation", height: CGFloat = 360, styles: Styles = Styles(), onSend: ((String) -> Void)? = nil, onReact: ((String, String) -> Void)? = nil, onRetry: ((String) -> Void)? = nil) {
        self.participants = participants
        self.currentUserId = currentUserId
        self._messages = messages
        self.typing = typing
        self.readBy = readBy
        self.reactions = reactions
        self.placeholder = placeholder
        self.composer = composer
        self.groupWindow = groupWindow
        self.locale = locale
        self.label = label
        self.height = height
        self.styles = styles
        self.onSend = onSend
        self.onReact = onReact
        self.onRetry = onRetry
    }

    public var body: some View {
        VStack(spacing: 0) {
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(alignment: .leading, spacing: 4) {
                        ForEach(Array(messages.enumerated()), id: \.element.id) { index, message in
                            row(message, grouped: grouped(index)).id(message.id)
                        }
                        if !typing.isEmpty {
                            Text("\(typing.map(name).joined(separator: ", ")) \(typing.count == 1 ? "is" : "are") typing…")
                                .font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted)
                        }
                    }
                    .padding(ManicatMetrics.space.s4)
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                .onChange(of: messages.count) { _, _ in if let last = messages.last { withAnimation { proxy.scrollTo(last.id, anchor: .bottom) } } }
            }
            .frame(height: height)
            .manicatStyle(styles.list)
            if composer { composerBar }
        }
        .background(tokens.surface, in: RoundedRectangle(cornerRadius: 26))
        .overlay(RoundedRectangle(cornerRadius: 26).stroke(tokens.border, lineWidth: 1))
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
    }

    private func name(_ id: String) -> String { participants.first { $0.id == id }?.name ?? id }

    private func grouped(_ index: Int) -> Bool {
        guard index > 0 else { return false }
        let previous = messages[index - 1], current = messages[index]
        return previous.authorId == current.authorId && current.createdAt.timeIntervalSince(previous.createdAt) < groupWindow
    }

    private func row(_ message: ManicatChatMessage, grouped: Bool) -> some View {
        let mine = message.authorId == currentUserId
        let readers = readBy.filter { $0.key != currentUserId && $0.value == message.id }.keys.map(name)

        return VStack(alignment: mine ? .trailing : .leading, spacing: 4) {
            if !grouped {
                HStack(spacing: 6) {
                    if !mine { ManicatAvatar(name: name(message.authorId), url: participants.first { $0.id == message.authorId }?.avatar, size: .sm) }
                    Text("\(mine ? "You" : name(message.authorId)) · \(message.createdAt.formatted(.dateTime.hour().minute().locale(locale)))")
                        .font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted)
                }
                .padding(.top, 8)
            }
            Button { picking = picking == message.id ? nil : message.id } label: {
                Text(message.text ?? "")
                    .font(.system(size: ManicatMetrics.textSm))
                    .foregroundStyle(mine ? tokens.background : tokens.foreground)
                    .manicatStyle(styles.text)
                    .padding(.horizontal, ManicatMetrics.space.s3)
                    .padding(.vertical, 8)
                    .background(mine ? tokens.foreground : tokens.surfaceMuted, in: RoundedRectangle(cornerRadius: 18))
                    .manicatStyle(styles.bubble)
                    .manicatStyle(mine ? styles.bubbleMine : { $0 })
            }
            .buttonStyle(.plain)
            if picking == message.id {
                HStack(spacing: 4) {
                    ForEach(reactions, id: \.self) { emoji in
                        Button { react(message.id, emoji) } label: { Text(emoji).padding(6) }
                            .buttonStyle(.plain)
                            .accessibilityLabel("React \(emoji)")
                    }
                }
                .background(tokens.surface, in: Capsule())
                .overlay(Capsule().stroke(tokens.border, lineWidth: 1))
            }
            if !message.reactions.isEmpty {
                HStack(spacing: 4) {
                    ForEach(message.reactions) { reaction in
                        Button { react(message.id, reaction.emoji) } label: {
                            Text("\(reaction.emoji) \(reaction.count)")
                                .font(.system(size: ManicatMetrics.textXs))
                                .foregroundStyle(tokens.foreground)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 2)
                                .background(reaction.mine ? tokens.surfaceMuted : .clear, in: Capsule())
                                .overlay(Capsule().stroke(reaction.mine ? tokens.foreground : tokens.border, lineWidth: 1))
                        }
                        .buttonStyle(.plain)
                        .accessibilityAddTraits(reaction.mine ? .isSelected : [])
                    }
                }
            }
            if message.status == .failed {
                Button { onRetry?(message.id) } label: { Text("Failed to send. Retry").font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.danger) }.buttonStyle(.plain)
            } else if mine, !readers.isEmpty {
                Text("Seen by \(readers.joined(separator: ", "))").font(.system(size: 11)).foregroundStyle(tokens.textMuted)
            }
        }
        .frame(maxWidth: .infinity, alignment: mine ? .trailing : .leading)
    }

    private var composerBar: some View {
        HStack(spacing: ManicatMetrics.space.s2) {
            TextField("", text: $draft, prompt: Text(placeholder).foregroundColor(tokens.textMuted))
                .textFieldStyle(.plain)
                .font(.system(size: ManicatMetrics.textSm))
                .foregroundStyle(tokens.foreground)
                .onSubmit { send() }
                .accessibilityLabel(placeholder)
                .manicatStyle(styles.input)
            Button(action: send) {
                Text("↑").font(.system(size: 16, weight: .semibold)).foregroundStyle(tokens.background).frame(width: 32, height: 32).background(tokens.foreground, in: Circle())
            }
            .buttonStyle(.plain)
            .disabled(draft.trimmingCharacters(in: .whitespaces).isEmpty)
            .opacity(draft.trimmingCharacters(in: .whitespaces).isEmpty ? 0.4 : 1)
            .accessibilityLabel("Send")
        }
        .padding(ManicatMetrics.space.s3)
        .overlay(alignment: .top) { Rectangle().fill(tokens.border).frame(height: 1) }
        .manicatStyle(styles.composer)
    }

    private func send() {
        let text = draft.trimmingCharacters(in: .whitespaces)
        guard !text.isEmpty else { return }
        draft = ""
        messages.append(ManicatChatMessage(id: "local-\(messages.count)-\(Int(Date().timeIntervalSince1970 * 1000))", authorId: currentUserId, text: text, createdAt: Date(), status: .sent))
        onSend?(text)
    }

    private func react(_ id: String, _ emoji: String) {
        picking = nil
        guard let at = messages.firstIndex(where: { $0.id == id }) else { return }
        var updated = messages[at].reactions
        if let found = updated.firstIndex(where: { $0.emoji == emoji }) {
            updated[found].count += updated[found].mine ? -1 : 1
            updated[found].mine.toggle()
            if updated[found].count <= 0 { updated.remove(at: found) }
        } else {
            updated.append(ManicatChatReaction(emoji: emoji, count: 1, mine: true))
        }
        messages[at].reactions = updated
        onReact?(id, emoji)
    }
}
