import SwiftUI

public struct ManicatSignInAccount {
    public let name: String
    public let email: String
}

public enum ManicatSignInMethod: String { case email, google = "Google", apple = "Apple", github = "GitHub", passkey }

/// Mirrors sign-in.tsx / sign-in.rn.tsx / sign-in.vue: an email code flow with single sign-on and a passkey. The flow is simulated;
/// `demoCode` is the code the pretend email contains. Wire `onSignIn` to your real sign in.
public struct ManicatSignIn: View {
    public struct Styles {
        public var title: ManicatStyle = { $0 }
        public var description: ManicatStyle = { $0 }
        public var sso: ManicatStyle = { $0 }
        public init() {}
    }

    private enum Step { case email, code, done }

    private static let resendSeconds = 30

    @Environment(\.manicat) private var tokens
    @State private var step = Step.email
    @State private var email = ""
    @State private var attempted = false
    @State private var code = ""
    @State private var codeError = ""
    @State private var resendIn = 0
    @State private var account: ManicatSignInAccount?

    private let demoCode: String
    private let styles: Styles
    private let onSignIn: ((ManicatSignInAccount, ManicatSignInMethod) -> Void)?

    public init(demoCode: String = "123456", styles: Styles = Styles(), onSignIn: ((ManicatSignInAccount, ManicatSignInMethod) -> Void)? = nil) {
        self.demoCode = demoCode
        self.styles = styles
        self.onSignIn = onSignIn
    }

    private var validEmail: Bool { email.trimmingCharacters(in: .whitespaces).range(of: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$", options: .regularExpression) != nil }
    private var emailError: String? {
        guard attempted, !validEmail else { return nil }
        return email.trimmingCharacters(in: .whitespaces).isEmpty ? "Enter your email address." : "Enter a full address, like name@example.com."
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            switch step {
            case .email: emailStep
            case .code: codeStep
            case .done: doneStep
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Sign in")
        .task(id: resendIn) {
            guard resendIn > 0 else { return }
            try? await Task.sleep(nanoseconds: 1_000_000_000)
            if !Task.isCancelled { resendIn -= 1 }
        }
    }

    private func heading(_ text: String) -> some View {
        Text(text).font(.system(size: 24, weight: .semibold)).tracking(-0.4).foregroundStyle(tokens.foreground).accessibilityAddTraits(.isHeader).manicatStyle(styles.title)
    }

    private func lead(_ text: String) -> some View {
        Text(text).font(.system(size: 14)).lineSpacing(3).foregroundStyle(tokens.textSecondary).manicatStyle(styles.description)
    }

    @ViewBuilder private var emailStep: some View {
        heading("Sign in to Manicat UI")
        lead("Enter your email and we will send you a 6 digit code.")
        ManicatInput("Email", text: $email, placeholder: "name@example.com", kind: .email, error: emailError)
            .onSubmit { sendCode() }
        ManicatButton("Continue with email") { sendCode() }
        ManicatFlowLayout(spacing: 8, lineSpacing: 8) {
            ForEach([ManicatSignInMethod.google, .apple, .github], id: \.rawValue) { provider in
                ManicatButton(provider.rawValue, variant: .secondary, size: .sm) { finish(provider) }
            }
            ManicatButton("Passkey", variant: .secondary, size: .sm) { finish(.passkey) }
        }
        .accessibilityLabel("Single sign-on")
        .manicatStyle(styles.sso)
    }

    @ViewBuilder private var codeStep: some View {
        heading("Check your email")
        lead("Enter the 6 digit code we sent. It expires in 10 minutes.")
        HStack {
            Text(email.trimmingCharacters(in: .whitespaces)).foregroundStyle(tokens.foreground).frame(maxWidth: .infinity, alignment: .leading)
            ManicatButton("Change", variant: .ghost, size: .sm) { step = .email; codeError = "" }.accessibilityLabel("Change email")
        }
        ManicatOtpInput("Verification code", code: $code, description: "For this demo, the code is \(demoCode).", error: codeError.isEmpty ? nil : codeError)
            .onChange(of: code) { _, value in
                codeError = ""
                if value.count == 6 { verify(value) }
            }
        ManicatButton("Verify and sign in") { verify(code) }
        ManicatButton(resendIn > 0 ? "Resend code in \(resendIn)s" : "Resend code", variant: .ghost, size: .sm) {
            resendIn = Self.resendSeconds
            code = ""
        }
        .disabled(resendIn > 0)
    }

    @ViewBuilder private var doneStep: some View {
        if let account {
            heading("Welcome back, \(account.name.split(separator: " ").first.map(String.init) ?? account.name)")
            Text(account.email).foregroundStyle(tokens.textSecondary)
            ManicatButton("Sign out", variant: .secondary) {
                step = .email
                code = ""
                email = ""
                attempted = false
            }
        }
    }

    private func finish(_ method: ManicatSignInMethod) {
        let typed = email.trimmingCharacters(in: .whitespaces)
        let address = typed.isEmpty ? "jasmine@northwind.studio" : typed
        let local = address.split(separator: "@").first.map(String.init) ?? address
        let name = local.replacingOccurrences(of: "[._]", with: " ", options: .regularExpression).capitalized
        let next = ManicatSignInAccount(name: name, email: address)
        account = next
        step = .done
        onSignIn?(next, method)
    }

    private func sendCode() {
        attempted = true
        guard validEmail else { return }
        step = .code
        code = ""
        resendIn = Self.resendSeconds
    }

    private func verify(_ value: String) {
        if value.count < 6 { codeError = "Enter all 6 digits."; return }
        if value != demoCode { codeError = "That code didn't match. Check the latest email and try again."; return }
        finish(.email)
    }
}
