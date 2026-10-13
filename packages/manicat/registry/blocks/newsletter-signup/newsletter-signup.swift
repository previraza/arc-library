import SwiftUI

public enum ManicatNewsletterVariant { case inline, card }

/// Mirrors newsletter-signup.tsx / newsletter-signup.rn.tsx / newsletter-signup.vue: an email field with validation, a busy state, a
/// failure message that keeps the address, and a confirmation. `onSubscribe` throws to show the failure.
public struct ManicatNewsletterSignup: View {
    public struct Styles {
        public var title: ManicatStyle = { $0 }
        public var description: ManicatStyle = { $0 }
        public var card: ManicatStyle = { $0 }
        public var note: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @Environment(\.openURL) private var openURL
    @State private var email = ""
    @State private var error = ""
    @State private var busy = false
    @State private var done = false

    private let variant: ManicatNewsletterVariant
    private let title: String?
    private let description: String?
    private let placeholder: String
    private let buttonLabel: String
    private let privacyNote: String
    private let privacyLink: (label: String, url: URL)?
    private let readers: (count: Int, faces: [URL])?
    private let styles: Styles
    private let onSubscribe: ((String) async throws -> Void)?

    public init(variant: ManicatNewsletterVariant = .inline, title: String? = nil, description: String? = nil, placeholder: String = "you@company.com", buttonLabel: String = "Subscribe", privacyNote: String = "No tracking pixels. Unsubscribe with one click.", privacyLink: (label: String, url: URL)? = nil, readers: (count: Int, faces: [URL])? = nil, styles: Styles = Styles(), onSubscribe: ((String) async throws -> Void)? = nil) {
        self.variant = variant
        self.title = title
        self.description = description
        self.placeholder = placeholder
        self.buttonLabel = buttonLabel
        self.privacyNote = privacyNote
        self.privacyLink = privacyLink
        self.readers = readers
        self.styles = styles
        self.onSubscribe = onSubscribe
    }

    private var defaults: (title: String, description: String) {
        variant == .inline
            ? ("Five minutes on interface craft, every Friday", "Three links worth your time and one short essay on the details that make software feel right.")
            : ("Get the next issue on Friday", "Three links and one short essay on interface craft. Five minutes, once a week.")
    }

    public var body: some View {
        let text = defaults
        let form = VStack(alignment: .leading, spacing: 12) {
            Text(title ?? text.title).font(.system(size: 24, weight: .semibold)).tracking(-0.4).foregroundStyle(tokens.foreground).accessibilityAddTraits(.isHeader).manicatStyle(styles.title)
            Text(description ?? text.description).font(.system(size: 14)).lineSpacing(3).foregroundStyle(tokens.textSecondary).manicatStyle(styles.description)
            if done {
                Text("✓ Check your inbox to confirm.").fontWeight(.medium).foregroundStyle(tokens.success)
            } else {
                ManicatInput("Email", text: $email, placeholder: placeholder, kind: .email, error: error.isEmpty ? nil : error)
                    .onChange(of: email) { _, _ in error = "" }
                    .onSubmit { Task { await submit() } }
                ManicatButton(buttonLabel, loading: busy) { Task { await submit() } }
            }
            if let readers {
                HStack(spacing: 8) {
                    ForEach(Array(readers.faces.prefix(4)), id: \.self) { url in ManicatAvatar(name: "", url: url, size: .sm) }
                    Text("\(readers.count.formatted()) readers").font(.system(size: 13)).foregroundStyle(tokens.textSecondary)
                }
            }
            HStack(spacing: 4) {
                Text(privacyNote).font(.system(size: 12)).foregroundStyle(tokens.textMuted)
                if let privacyLink {
                    Button { openURL(privacyLink.url) } label: { Text(privacyLink.label).font(.system(size: 12)).underline().foregroundStyle(tokens.textMuted) }.buttonStyle(.plain)
                }
            }
            .manicatStyle(styles.note)
        }

        if variant == .card {
            form.padding(20).background(tokens.surface, in: RoundedRectangle(cornerRadius: 28)).overlay(RoundedRectangle(cornerRadius: 28).stroke(tokens.border, lineWidth: 1)).manicatStyle(styles.card)
        } else {
            form
        }
    }

    @MainActor private func submit() async {
        if busy { return }
        let value = email.trimmingCharacters(in: .whitespaces)
        if value.isEmpty { error = "Enter your email address"; return }
        if value.range(of: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$", options: .regularExpression) == nil { error = "Enter an email like name@company.com"; return }
        error = ""
        busy = true
        defer { busy = false }
        do {
            try await onSubscribe?(value)
            done = true
        } catch {
            self.error = "That didn't go through. Your email is kept, so try again."
        }
    }
}
