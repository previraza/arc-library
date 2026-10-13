import SwiftUI

public enum ManicatContactVariant { case form, channels, offices }

public struct ManicatContactMessage {
    public let name: String
    public let email: String
    public let topic: String
    public let message: String
}

public struct ManicatContactChannel: Identifiable {
    public var id: String { value }
    public let value: String
    public let label: String
    /// One line under the label in the list, such as a response time.
    public let meta: String
    /// The detail shown when the channel is selected.
    public let detail: String
    /// A value shown with a copy button, such as an email address.
    public let copyValue: String?
    /// The action button of the detail. Pressing it confirms in place.
    public let action: (label: String, doneLabel: String)?

    public init(value: String, label: String, meta: String, detail: String, copyValue: String? = nil, action: (label: String, doneLabel: String)? = nil) {
        self.value = value
        self.label = label
        self.meta = meta
        self.detail = detail
        self.copyValue = copyValue
        self.action = action
    }
}

public struct ManicatContactOffice: Identifiable {
    public var id: String { city }
    public let city: String
    /// IANA time zone, used for the live local time and open status.
    public let timeZone: String
    public let address: [String]
    public let email: String?
    /// Opening hours in local 24 hour time.
    public let hours: ClosedRange<Int>

    public init(city: String, timeZone: String, address: [String], email: String? = nil, hours: ClosedRange<Int> = 9...17) {
        self.city = city
        self.timeZone = timeZone
        self.address = address
        self.email = email
        self.hours = hours
    }
}

/// Mirrors contact-section.tsx / contact-section.rn.tsx / contact-section.vue: a contact form with validation, a list of channels with
/// details, or offices with a live clock and open status. `onSubmit` throws to keep the form and show an error.
public struct ManicatContactSection: View {
    public struct Styles {
        public var title: ManicatStyle = { $0 }
        public var description: ManicatStyle = { $0 }
        public var card: ManicatStyle = { $0 }
        public init() {}
    }

    public static let exampleChannels = [
        ManicatContactChannel(value: "chat", label: "Chat with support", meta: "Replies in about 4 minutes", detail: "Hannah and Jordan are online now. Chat is best for quick questions about installing, theming, or a component that misbehaves.", action: ("Start a chat", "Chat started")),
        ManicatContactChannel(value: "email", label: "Email support", meta: "Replies within a business day", detail: "Send screenshots, links, or a reproduction. Every message gets a reply from a person within one business day.", copyValue: "support@example.com"),
        ManicatContactChannel(value: "sales", label: "Talk to sales", meta: "Weekdays, 9am to 6pm PT", detail: "Licensing for a larger team, invoicing, or a security review. Tyler will walk you through it on a 20 minute call.", copyValue: "+1 (415) 555-0132", action: ("Request a call", "Call requested")),
        ManicatContactChannel(value: "community", label: "Ask the community", meta: "4,200 members", detail: "Designers and engineers who ship with Manicat UI answer questions about components, theming, and motion, usually within the hour.", action: ("Open the forum", "Forum opened")),
    ]

    public static let exampleOffices = [
        ManicatContactOffice(city: "San Francisco", timeZone: "America/Los_Angeles", address: ["100 Example Street, Floor 4", "San Francisco, CA 94000"], email: "sf@example.com"),
        ManicatContactOffice(city: "New York", timeZone: "America/New_York", address: ["200 Sample Avenue, Suite 12", "New York, NY 10000"], email: "nyc@example.com"),
        ManicatContactOffice(city: "Lisbon", timeZone: "Europe/Lisbon", address: ["Rua do Exemplo 10, 3º", "1000-000 Lisboa, Portugal"], email: "lisbon@example.com"),
    ]

    @Environment(\.manicat) private var tokens
    @State private var channel: String
    @State private var done: String?

    private let variant: ManicatContactVariant
    private let title: String?
    private let description: String?
    private let topics: [String]
    private let channels: [ManicatContactChannel]
    private let offices: [ManicatContactOffice]
    private let styles: Styles
    private let onSubmit: ((ManicatContactMessage) async throws -> Void)?
    private let onCopy: ((String) -> Void)?

    public init(variant: ManicatContactVariant = .form, title: String? = nil, description: String? = nil, topics: [String] = ["Sales", "Support", "Partnerships", "Press"], channels: [ManicatContactChannel] = ManicatContactSection.exampleChannels, offices: [ManicatContactOffice] = ManicatContactSection.exampleOffices, styles: Styles = Styles(), onSubmit: ((ManicatContactMessage) async throws -> Void)? = nil, onCopy: ((String) -> Void)? = nil) {
        self.variant = variant
        self.title = title
        self.description = description
        self.topics = topics
        self.channels = channels
        self.offices = offices
        self.styles = styles
        self.onSubmit = onSubmit
        self.onCopy = onCopy
        self._channel = State(wrappedValue: channels.first?.value ?? "")
    }

    private var defaults: (title: String, description: String) {
        switch variant {
        case .form: return ("Talk to our team", "Questions about licensing, a bug you can't pin down, or a component you wish existed. A person reads every message.")
        case .channels: return ("Get help your way", "Pick whatever suits the question. Every channel reaches the same small team.")
        case .offices: return ("Visit us", "We work across three time zones, so someone is usually awake. Drop by for coffee, just let us know first.")
        }
    }

    public var body: some View {
        let text = defaults

        VStack(alignment: .leading, spacing: 14) {
            Text(title ?? text.title).font(.system(size: 26, weight: .semibold)).tracking(-0.5).foregroundStyle(tokens.foreground).accessibilityAddTraits(.isHeader).manicatStyle(styles.title)
            Text(description ?? text.description).font(.system(size: 14)).lineSpacing(3).foregroundStyle(tokens.textSecondary).manicatStyle(styles.description)
            switch variant {
            case .form: ContactForm(topics: topics, onSubmit: onSubmit)
            case .channels: channelList
            case .offices: ForEach(offices) { office in officeCard(office) }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    @ViewBuilder private var channelList: some View {
        VStack(spacing: 8) {
            ForEach(channels) { entry in
                Button { channel = entry.value } label: {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(entry.label).fontWeight(.medium).foregroundStyle(tokens.foreground)
                        Text(entry.meta).font(.system(size: 12)).foregroundStyle(tokens.textMuted)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(14)
                    .background(entry.value == channel ? tokens.surfaceMuted : tokens.surface, in: RoundedRectangle(cornerRadius: 20))
                    .overlay(RoundedRectangle(cornerRadius: 20).stroke(entry.value == channel ? tokens.foreground : tokens.border, lineWidth: 1))
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(entry.value == channel ? .isSelected : [])
            }
        }
        if let active = channels.first(where: { $0.value == channel }) {
            VStack(alignment: .leading, spacing: 6) {
                Text(active.detail).lineSpacing(4).foregroundStyle(tokens.textSecondary)
                if let copyValue = active.copyValue {
                    HStack {
                        Text(copyValue).foregroundStyle(tokens.foreground).frame(maxWidth: .infinity, alignment: .leading)
                        ManicatButton("Copy", variant: .ghost, size: .sm) { onCopy?(copyValue) }
                    }
                }
                if let action = active.action {
                    ManicatButton(done == active.value ? "✓ \(action.doneLabel)" : action.label) { done = done == active.value ? nil : active.value }
                }
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(tokens.surfaceMuted, in: RoundedRectangle(cornerRadius: 20))
            .overlay(RoundedRectangle(cornerRadius: 20).stroke(tokens.border, lineWidth: 1))
        }
    }

    private func officeCard(_ office: ManicatContactOffice) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(office.city).font(.system(size: 16, weight: .semibold)).foregroundStyle(tokens.foreground)
            OfficeClock(office: office)
            ForEach(office.address, id: \.self) { line in Text(line).font(.system(size: 13)).foregroundStyle(tokens.textSecondary) }
            if let email = office.email { Text(email).font(.system(size: 13)).foregroundStyle(tokens.textMuted) }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(tokens.surface, in: RoundedRectangle(cornerRadius: 20))
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(tokens.border, lineWidth: 1))
        .manicatStyle(styles.card)
    }
}

private struct OfficeClock: View {
    let office: ManicatContactOffice
    @Environment(\.manicat) private var tokens

    var body: some View {
        TimelineView(.periodic(from: Date(), by: 30)) { context in clock(at: context.date) }
    }

    private func clock(at date: Date) -> some View {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: office.timeZone) ?? .current
        let parts = calendar.dateComponents([.hour, .minute, .weekday], from: date)
        let hour = parts.hour ?? 0
        let weekend = parts.weekday == 1 || parts.weekday == 7
        let open = !weekend && office.hours.contains(hour)

        return HStack(spacing: 8) {
            Text(String(format: "%02d:%02d", hour, parts.minute ?? 0)).monospacedDigit().foregroundStyle(tokens.foreground)
            Text(open ? "Open now" : "Closed").foregroundStyle(open ? tokens.success : tokens.textMuted)
        }
    }
}

private struct ContactForm: View {
    let topics: [String]
    let onSubmit: ((ManicatContactMessage) async throws -> Void)?

    private enum Phase { case editing, sending, sent }

    @Environment(\.manicat) private var tokens
    @State private var topic: String
    @State private var name = ""
    @State private var email = ""
    @State private var message = ""
    @State private var submitted = false
    @State private var phase = Phase.editing
    @State private var failure = ""

    init(topics: [String], onSubmit: ((ManicatContactMessage) async throws -> Void)?) {
        self.topics = topics
        self.onSubmit = onSubmit
        self._topic = State(wrappedValue: topics.first ?? "")
    }

    private var nameError: String { name.trimmingCharacters(in: .whitespaces).isEmpty ? "Enter your name" : "" }
    private var emailError: String {
        let value = email.trimmingCharacters(in: .whitespaces)
        if value.isEmpty { return "Enter your email address" }
        return value.range(of: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$", options: .regularExpression) == nil ? "Enter an email like name@example.com" : ""
    }
    private var messageError: String {
        let count = message.trimmingCharacters(in: .whitespaces).count
        return count >= 20 ? "" : count > 0 ? "Add a little more detail, at least 20 characters" : "Tell us how we can help"
    }

    var body: some View {
        if phase == .sent {
            VStack(alignment: .leading, spacing: 8) {
                Text("Message sent").font(.system(size: 20, weight: .semibold)).foregroundStyle(tokens.foreground).accessibilityAddTraits(.isHeader)
                Text("Thanks \(name.trimmingCharacters(in: .whitespaces).split(separator: " ").first.map(String.init) ?? ""). We will reply to \(email.trimmingCharacters(in: .whitespaces)) within one business day.").foregroundStyle(tokens.textSecondary)
                ManicatButton("Send another", variant: .secondary) {
                    name = ""
                    email = ""
                    message = ""
                    submitted = false
                    phase = .editing
                }
            }
        } else {
            VStack(alignment: .leading, spacing: 12) {
                ManicatSegmentedControl(options: topics.map { ManicatSegment(value: $0, label: $0) }, value: $topic, label: "Topic")
                ManicatInput("Name", text: $name, error: submitted && !nameError.isEmpty ? nameError : nil)
                ManicatInput("Email", text: $email, kind: .email, error: submitted && !emailError.isEmpty ? emailError : nil)
                ManicatTextarea("Message", text: $message, description: "\(message.count) / 500", error: submitted && !messageError.isEmpty ? messageError : nil)
                    .onChange(of: message) { _, value in if value.count > 500 { message = String(value.prefix(500)) } }
                if !failure.isEmpty { Text(failure).font(.system(size: 13)).foregroundStyle(tokens.danger) }
                ManicatButton("Send message", loading: phase == .sending) { Task { await send() } }
            }
        }
    }

    @MainActor private func send() async {
        submitted = true
        failure = ""
        guard nameError.isEmpty, emailError.isEmpty, messageError.isEmpty else { return }
        phase = .sending
        do {
            try await onSubmit?(ManicatContactMessage(name: name.trimmingCharacters(in: .whitespaces), email: email.trimmingCharacters(in: .whitespaces), topic: topic, message: message.trimmingCharacters(in: .whitespaces)))
            phase = .sent
        } catch {
            phase = .editing
            failure = error.localizedDescription.isEmpty ? "We couldn't send that. Your message is kept, so try again." : error.localizedDescription
        }
    }
}
