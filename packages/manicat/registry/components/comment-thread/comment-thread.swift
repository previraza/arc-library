import SwiftUI

public struct ManicatCommentAuthor {
    public let id: String
    public let name: String
    public let avatar: URL?

    public init(id: String, name: String, avatar: URL? = nil) {
        self.id = id
        self.name = name
        self.avatar = avatar
    }
}

public struct ManicatCommentReaction: Identifiable {
    public var id: String { emoji }
    public let emoji: String
    public var users: [String]

    public init(emoji: String, users: [String]) {
        self.emoji = emoji
        self.users = users
    }
}

public struct ManicatComment: Identifiable {
    public let id: String
    public let author: ManicatCommentAuthor
    public var body: String
    public let createdAt: String
    public var edited: Bool
    public var deleted: Bool
    public var reactions: [ManicatCommentReaction]
    public var replies: [ManicatComment]

    public init(id: String, author: ManicatCommentAuthor, body: String, createdAt: String, edited: Bool = false, deleted: Bool = false, reactions: [ManicatCommentReaction] = [], replies: [ManicatComment] = []) {
        self.id = id
        self.author = author
        self.body = body
        self.createdAt = createdAt
        self.edited = edited
        self.deleted = deleted
        self.reactions = reactions
        self.replies = replies
    }
}

public enum ManicatCommentEvent {
    case reply(ManicatComment, parentId: String?)
    case edit(id: String, body: String)
    case delete(id: String)
    case react(id: String, emoji: String, added: Bool)
}

/// Mirrors comment-thread.tsx / comment-thread.rn.tsx / comment-thread.vue: nested comments with reactions, replying, editing and
/// deleting for your own. Every change updates `comments` and calls `onChange`.
public struct ManicatCommentThread: View {
    public struct Styles {
        public var comment: ManicatStyle = { $0 }
        public var body: ManicatStyle = { $0 }
        public var action: ManicatStyle = { $0 }
        public var composer: ManicatStyle = { $0 }
        public init() {}
    }

    private struct Row: Identifiable {
        var id: String { comment.id }
        let comment: ManicatComment
        let depth: Int
    }

    @Environment(\.manicat) private var tokens
    @State private var replyTo: String?
    @State private var editing: String?
    @State private var draft = ""

    @Binding private var comments: [ManicatComment]
    private let currentUser: ManicatCommentAuthor
    private let title: String
    private let reactions: [String]
    private let placeholder: String
    private let maxDepth: Int
    private let styles: Styles
    private let onChange: ((ManicatCommentEvent) -> Void)?

    public init(comments: Binding<[ManicatComment]>, currentUser: ManicatCommentAuthor, title: String = "Discussion", reactions: [String] = ["👍", "❤️"], placeholder: String = "Write a comment…", maxDepth: Int = 3, styles: Styles = Styles(), onChange: ((ManicatCommentEvent) -> Void)? = nil) {
        self._comments = comments
        self.currentUser = currentUser
        self.title = title
        self.reactions = reactions
        self.placeholder = placeholder
        self.maxDepth = maxDepth
        self.styles = styles
        self.onChange = onChange
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: ManicatMetrics.space.s3) {
            Text("\(title) · \(total(comments))").font(.system(size: ManicatMetrics.textSm, weight: .semibold)).foregroundStyle(tokens.foreground)
            if comments.isEmpty { Text("No comments yet.").font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.textMuted) }
            ForEach(rows()) { row in commentView(row.comment, depth: row.depth) }
            composer
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(title)
    }

    private func total(_ list: [ManicatComment]) -> Int { list.reduce(0) { $0 + ($1.deleted ? 0 : 1) + total($1.replies) } }

    private func rows() -> [Row] {
        var out: [Row] = []
        func walk(_ list: [ManicatComment], _ depth: Int) { for comment in list { out.append(Row(comment: comment, depth: depth)); walk(comment.replies, depth + 1) } }
        walk(comments, 0)
        return out
    }

    private func commentView(_ comment: ManicatComment, depth: Int) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 8) {
                ManicatAvatar(name: comment.author.name, url: comment.author.avatar, size: .sm)
                Text(comment.author.name).font(.system(size: ManicatMetrics.textSm, weight: .semibold)).foregroundStyle(tokens.foreground)
                Text(comment.createdAt + (comment.edited ? " · edited" : "")).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted)
            }
            (comment.deleted ? Text("This comment was deleted.").italic() : Text(comment.body))
                .font(.system(size: ManicatMetrics.textSm))
                .foregroundStyle(comment.deleted ? tokens.textMuted : tokens.foreground)
                .manicatStyle(styles.body)
            if !comment.deleted { actions(comment) }
        }
        .padding(ManicatMetrics.space.s3)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(tokens.surface, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
        .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(tokens.border, lineWidth: 1))
        .padding(.leading, CGFloat(min(depth, maxDepth) * 20))
        .manicatStyle(styles.comment)
    }

    private func actions(_ comment: ManicatComment) -> some View {
        ManicatFlowLayout(spacing: 6, lineSpacing: 6) {
            ForEach(comment.reactions) { reaction in
                let mine = reaction.users.contains(currentUser.id)
                Button { react(comment.id, reaction.emoji) } label: {
                    Text("\(reaction.emoji) \(reaction.users.count)").font(.system(size: ManicatMetrics.textXs))
                        .padding(.horizontal, 8).padding(.vertical, 2)
                        .background(mine ? tokens.surfaceMuted : .clear, in: Capsule())
                        .overlay(Capsule().stroke(mine ? tokens.foreground : tokens.border, lineWidth: 1))
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(mine ? .isSelected : [])
            }
            ForEach(reactions.filter { emoji in !comment.reactions.contains { $0.emoji == emoji } }, id: \.self) { emoji in
                Button { react(comment.id, emoji) } label: { Text(emoji).font(.system(size: ManicatMetrics.textXs)).padding(.horizontal, 6).padding(.vertical, 2) }
                    .buttonStyle(.plain)
                    .accessibilityLabel("React \(emoji)")
            }
            link("Reply") { replyTo = comment.id; editing = nil; draft = "" }
            if comment.author.id == currentUser.id {
                link("Edit") { editing = comment.id; replyTo = nil; draft = comment.body }
                link("Delete", danger: true) { remove(comment.id) }
            }
        }
    }

    private func link(_ title: String, danger: Bool = false, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title).font(.system(size: ManicatMetrics.textXs, weight: .medium)).foregroundStyle(danger ? tokens.danger : tokens.textSecondary).manicatStyle(styles.action)
        }
        .buttonStyle(.plain)
    }

    private var composer: some View {
        VStack(alignment: .leading, spacing: 6) {
            if replyTo != nil || editing != nil {
                Button { reset() } label: {
                    Text("\(editing != nil ? "Editing" : "Replying") · Cancel").font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textSecondary)
                }
                .buttonStyle(.plain)
            }
            HStack(alignment: .bottom, spacing: ManicatMetrics.space.s2) {
                TextField("", text: $draft, prompt: Text(placeholder).foregroundColor(tokens.textMuted), axis: .vertical)
                    .textFieldStyle(.plain)
                    .font(.system(size: ManicatMetrics.textSm))
                    .foregroundStyle(tokens.foreground)
                    .padding(ManicatMetrics.space.s3)
                    .background(tokens.surface, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
                    .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(tokens.borderStrong, lineWidth: 1))
                    .accessibilityLabel(placeholder)
                ManicatButton(editing != nil ? "Save" : "Send", size: .sm) { submit() }
                    .disabled(draft.trimmingCharacters(in: .whitespaces).isEmpty)
            }
        }
        .manicatStyle(styles.composer)
    }

    private func map(_ list: [ManicatComment], _ id: String, _ change: (inout ManicatComment) -> Void) -> [ManicatComment] {
        list.map { comment in
            var copy = comment
            if copy.id == id { change(&copy) } else { copy.replies = map(copy.replies, id, change) }
            return copy
        }
    }

    private func submit() {
        let body = draft.trimmingCharacters(in: .whitespaces)
        guard !body.isEmpty else { return }
        if let editing {
            comments = map(comments, editing) { $0.body = body; $0.edited = true }
            onChange?(.edit(id: editing, body: body))
        } else {
            let comment = ManicatComment(id: "c-\(Int(Date().timeIntervalSince1970 * 1000))", author: currentUser, body: body, createdAt: "now")
            if let replyTo { comments = map(comments, replyTo) { $0.replies.append(comment) } } else { comments.append(comment) }
            onChange?(.reply(comment, parentId: replyTo))
        }
        reset()
    }

    private func react(_ id: String, _ emoji: String) {
        var added = false
        comments = map(comments, id) { comment in
            if let found = comment.reactions.firstIndex(where: { $0.emoji == emoji }) {
                if comment.reactions[found].users.contains(currentUser.id) {
                    comment.reactions[found].users.removeAll { $0 == currentUser.id }
                    if comment.reactions[found].users.isEmpty { comment.reactions.remove(at: found) }
                } else {
                    comment.reactions[found].users.append(currentUser.id)
                    added = true
                }
            } else {
                comment.reactions.append(ManicatCommentReaction(emoji: emoji, users: [currentUser.id]))
                added = true
            }
        }
        onChange?(.react(id: id, emoji: emoji, added: added))
    }

    private func remove(_ id: String) {
        comments = map(comments, id) { $0.deleted = true; $0.body = "" }
        onChange?(.delete(id: id))
    }

    private func reset() {
        replyTo = nil
        editing = nil
        draft = ""
    }
}
