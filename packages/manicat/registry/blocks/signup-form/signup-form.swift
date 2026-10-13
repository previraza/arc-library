import SwiftUI

public struct ManicatSignupDetails {
    public let name: String
    public let email: String
    public let password: String
    public let productUpdates: Bool
}

public enum ManicatSignupProvider: String, CaseIterable { case google = "Google", apple = "Apple", github = "GitHub" }

/// Mirrors signup-form.tsx / signup-form.rn.tsx / signup-form.vue: single sign-on, then name, work email and a password with a strength
/// hint. Errors show after a field is left or after submitting. `onSubmit` throws to show a submit error.
public struct ManicatSignupForm: View {
    public struct Styles {
        public var title: ManicatStyle = { $0 }
        public var description: ManicatStyle = { $0 }
        public var error: ManicatStyle = { $0 }
        public var sso: ManicatStyle = { $0 }
        public init() {}
    }

    private enum Field: Hashable { case name, email, password }

    private static let strengthLabel = ["", "Weak", "Fair", "Good", "Strong"]

    @Environment(\.manicat) private var tokens
    @FocusState private var focus: Field?
    @State private var done: String?
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var productUpdates = false
    @State private var touched: Set<Field> = []
    @State private var submitted = false
    @State private var busy = false
    @State private var submitError = ""

    private let serverError: String?
    private let styles: Styles
    private let onSubmit: ((ManicatSignupDetails) async throws -> Void)?
    private let onProvider: ((ManicatSignupProvider) -> Void)?

    public init(serverError: String? = nil, styles: Styles = Styles(), onSubmit: ((ManicatSignupDetails) async throws -> Void)? = nil, onProvider: ((ManicatSignupProvider) -> Void)? = nil) {
        self.serverError = serverError
        self.styles = styles
        self.onSubmit = onSubmit
        self.onProvider = onProvider
    }

    private func errors() -> [Field: String] {
        [
            .name: name.trimmingCharacters(in: .whitespaces).count < 2 ? "Enter your full name." : "",
            .email: email.trimmingCharacters(in: .whitespaces).range(of: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$", options: .regularExpression) == nil ? "Enter a full address, like name@example.com." : "",
            .password: password.count < 8 ? "Use at least 8 characters." : "",
        ]
    }

    private var score: Int {
        if password.isEmpty { return 0 }
        let lower = password.range(of: "[a-z]", options: .regularExpression) != nil
        let upper = password.range(of: "[A-Z]", options: .regularExpression) != nil
        let other = password.range(of: "[0-9]|[^\\w\\s]", options: .regularExpression) != nil
        return [password.count >= 8, password.count >= 12, lower && upper, other].filter { $0 }.count
    }

    public var body: some View {
        let problems = errors()
        func shown(_ field: Field) -> String? {
            let message = problems[field] ?? ""
            return (touched.contains(field) || submitted) && !message.isEmpty ? message : nil
        }

        return VStack(alignment: .leading, spacing: 12) {
            if let done {
                Text("You're in, \(done)").font(.system(size: 24, weight: .semibold)).tracking(-0.4).foregroundStyle(tokens.foreground).accessibilityAddTraits(.isHeader).manicatStyle(styles.title)
                Text("We sent a confirmation link to \(email.trimmingCharacters(in: .whitespaces)).").font(.system(size: 14)).foregroundStyle(tokens.textSecondary).manicatStyle(styles.description)
                ManicatButton("Start again", variant: .secondary) {
                    self.done = nil
                    name = ""
                    email = ""
                    password = ""
                    submitted = false
                    touched = []
                }
            } else {
                Text("Create your account").font(.system(size: 24, weight: .semibold)).tracking(-0.4).foregroundStyle(tokens.foreground).accessibilityAddTraits(.isHeader).manicatStyle(styles.title)
                Text("Start with your work email. You can invite your team after.").font(.system(size: 14)).lineSpacing(3).foregroundStyle(tokens.textSecondary).manicatStyle(styles.description)
                ManicatFlowLayout(spacing: 8, lineSpacing: 8) {
                    ForEach(ManicatSignupProvider.allCases, id: \.rawValue) { provider in
                        ManicatButton(provider.rawValue, variant: .secondary, size: .sm) { onProvider?(provider) }.accessibilityLabel("Sign up with \(provider.rawValue)")
                    }
                }
                .accessibilityLabel("Sign up with")
                .manicatStyle(styles.sso)
                Text("or").foregroundStyle(tokens.textMuted).frame(maxWidth: .infinity)
                ManicatInput("Full name", text: $name, placeholder: "Jasmine Brooks", error: shown(.name)).focused($focus, equals: .name)
                ManicatInput("Work email", text: $email, placeholder: "name@example.com", kind: .email, error: shown(.email)).focused($focus, equals: .email)
                ManicatPasswordField("Password", text: $password, description: shown(.password) ?? (password.isEmpty ? "Use 8 or more characters" : "\(Self.strengthLabel[max(score, 1)]) password")).focused($focus, equals: .password)
                ManicatCheckbox(isOn: $productUpdates, label: "Send me product updates")
                if let message = [submitError, serverError ?? ""].first(where: { !$0.isEmpty }) {
                    Text(message).font(.system(size: 13)).foregroundStyle(tokens.danger).manicatStyle(styles.error)
                }
                ManicatButton("Create account", loading: busy) { Task { await submit() } }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .onChange(of: focus) { old, _ in
            // Leaving a field that has text makes its error visible.
            guard let old else { return }
            let text = old == .name ? name : old == .email ? email : password
            if !text.isEmpty { touched.insert(old) }
        }
    }

    @MainActor private func submit() async {
        if busy { return }
        submitted = true
        submitError = ""
        guard errors().values.allSatisfy({ $0.isEmpty }) else { return }
        busy = true
        defer { busy = false }
        do {
            try await onSubmit?(ManicatSignupDetails(name: name.trimmingCharacters(in: .whitespaces), email: email.trimmingCharacters(in: .whitespaces), password: password, productUpdates: productUpdates))
            done = name.trimmingCharacters(in: .whitespaces).split(separator: " ").first.map(String.init) ?? "there"
        } catch {
            submitError = error.localizedDescription.isEmpty ? "We couldn't create your account. Try again." : error.localizedDescription
        }
    }
}
