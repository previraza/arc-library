import SwiftUI

public struct ManicatMention {
    public enum Kind { case person, channel }

    public let kind: Kind
    public let id: String
    public let label: String
    /// UTF-16 offsets into the text, like NSRange.
    public let start: Int
    public let end: Int
}

public struct ManicatMentionValue {
    public var text: String
    public var mentions: [ManicatMention]

    public init(text: String = "", mentions: [ManicatMention] = []) {
        self.text = text
        self.mentions = mentions
    }
}

public struct ManicatMentionPerson: Identifiable {
    public let id: String
    public let name: String
    public let role: String?

    public init(id: String, name: String, role: String? = nil) {
        self.id = id
        self.name = name
        self.role = role
    }
}

public struct ManicatMentionChannel: Identifiable {
    public let id: String
    public let name: String
    public let members: Int?

    public init(id: String, name: String, members: Int? = nil) {
        self.id = id
        self.name = name
        self.members = members
    }
}

/// Mirrors mention-input.tsx / mention-input.rn.tsx / mention-input.vue: type @ for people and # for channels. SwiftUI does not expose
/// the caret position, so the suggestion follows the last word of the text.
public struct ManicatMentionInput: View {
    public struct Styles {
        public var input: ManicatStyle = { $0 }
        public var suggestions: ManicatStyle = { $0 }
        public var suggestion: ManicatStyle = { $0 }
        public var suggestionText: ManicatStyle = { $0 }
        public init() {}
    }

    private struct Suggestion: Identifiable {
        let id: String
        let label: String
        let meta: String?
    }

    @Environment(\.manicat) private var tokens
    @Environment(\.isEnabled) private var enabled
    @FocusState private var focused: Bool
    @State private var active = 0

    @Binding private var value: ManicatMentionValue
    private let people: [ManicatMentionPerson]
    private let channels: [ManicatMentionChannel]
    private let placeholder: String
    private let maxSuggestions: Int
    private let label: String
    private let styles: Styles
    private let onMentionAdd: ((ManicatMention) -> Void)?

    public init(value: Binding<ManicatMentionValue>, people: [ManicatMentionPerson] = [], channels: [ManicatMentionChannel] = [], placeholder: String = "Write a message…", maxSuggestions: Int = 5, label: String = "Message", styles: Styles = Styles(), onMentionAdd: ((ManicatMention) -> Void)? = nil) {
        self._value = value
        self.people = people
        self.channels = channels
        self.placeholder = placeholder
        self.maxSuggestions = maxSuggestions
        self.label = label
        self.styles = styles
        self.onMentionAdd = onMentionAdd
    }

    /// The "@sof" or "#gen" at the end of the text, if there is one.
    private var trigger: (symbol: Character, query: String)? {
        guard let word = value.text.split(separator: " ", omittingEmptySubsequences: false).last, let first = word.first, first == "@" || first == "#" else { return nil }
        let query = String(word.dropFirst())
        return query.allSatisfy { $0.isLetter || $0.isNumber || $0 == "-" || $0 == "_" } ? (first, query) : nil
    }

    private var suggestions: [Suggestion] {
        guard let trigger else { return [] }
        let needle = trigger.query.lowercased()
        if trigger.symbol == "@" {
            return people.filter { $0.name.lowercased().contains(needle) }.prefix(maxSuggestions).map { Suggestion(id: $0.id, label: $0.name, meta: $0.role) }
        }
        return channels.filter { $0.name.lowercased().contains(needle) }.prefix(maxSuggestions).map { Suggestion(id: $0.id, label: $0.name, meta: $0.members.map { "\($0) members" }) }
    }

    public var body: some View {
        let shown = suggestions

        VStack(alignment: .leading, spacing: 6) {
            TextField("", text: Binding(get: { value.text }, set: edit), prompt: Text(placeholder).foregroundColor(tokens.textMuted), axis: .vertical)
                .textFieldStyle(.plain)
                .focused($focused)
                .lineLimit(3...)
                .font(.system(size: ManicatMetrics.textSm))
                .foregroundStyle(tokens.foreground)
                .padding(ManicatMetrics.space.s3)
                .background(tokens.surface, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
                .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(focused ? tokens.foreground : tokens.borderStrong, lineWidth: 1))
                .opacity(enabled ? 1 : 0.5)
                .onKeyPress(.downArrow) { if !shown.isEmpty { active = (active + 1) % shown.count; return .handled }; return .ignored }
                .onKeyPress(.upArrow) { if !shown.isEmpty { active = (active - 1 + shown.count) % shown.count; return .handled }; return .ignored }
                .onKeyPress(.tab) { if shown.indices.contains(active) { pick(shown[active]); return .handled }; return .ignored }
                .accessibilityLabel(label)
                .manicatStyle(styles.input)
            if !shown.isEmpty {
                VStack(spacing: 0) {
                    ForEach(Array(shown.enumerated()), id: \.element.id) { index, suggestion in
                        Button { pick(suggestion) } label: {
                            HStack {
                                Text("\(trigger?.symbol == "@" ? "@" : "#")\(suggestion.label)").font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.foreground).manicatStyle(styles.suggestionText)
                                Spacer(minLength: 0)
                                if let meta = suggestion.meta { Text(meta).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted) }
                            }
                            .padding(.horizontal, ManicatMetrics.space.s3)
                            .frame(minHeight: ManicatMetrics.controlHeight.sm + 4)
                            .background(index == active ? tokens.surfaceMuted : .clear, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl - 4))
                            .contentShape(Rectangle())
                            .manicatStyle(styles.suggestion)
                        }
                        .buttonStyle(.plain)
                        .onHover { inside in if inside { active = index } }
                    }
                }
                .padding(6)
                .background(tokens.surface, in: RoundedRectangle(cornerRadius: 22))
                .overlay(RoundedRectangle(cornerRadius: 22).stroke(tokens.border, lineWidth: 1))
                .manicatStyle(styles.suggestions)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func edit(_ text: String) {
        active = 0
        // A mention whose text was edited is no longer a mention.
        let units = Array(text.utf16)
        let kept = value.mentions.filter { mention in
            mention.end <= units.count && String(utf16CodeUnits: Array(units[mention.start..<mention.end]), count: mention.end - mention.start) == mention.label
        }
        value = ManicatMentionValue(text: text, mentions: kept)
    }

    private func pick(_ suggestion: Suggestion) {
        guard let trigger else { return }
        let symbol = String(trigger.symbol)
        let typed = symbol + trigger.query
        let label = symbol + suggestion.label
        let units = Array(value.text.utf16)
        let start = units.count - typed.utf16.count
        let mention = ManicatMention(kind: trigger.symbol == "@" ? .person : .channel, id: suggestion.id, label: label, start: start, end: start + label.utf16.count)
        value = ManicatMentionValue(text: String(value.text.dropLast(typed.count)) + label + " ", mentions: value.mentions + [mention])
        onMentionAdd?(mention)
    }
}
