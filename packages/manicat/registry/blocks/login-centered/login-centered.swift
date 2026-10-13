import SwiftUI

public enum ManicatLoginMethod: String { case passkey, email, google = "Google", apple = "Apple", github = "GitHub" }
public enum ManicatLoginMode { case signIn, signUp }

/// Mirrors login-centered.tsx / login-centered.rn.tsx / login-centered.vue: passkey first, single sign-on, then an email code. The
/// flow is simulated; `demoCode` is the code the pretend email contains. Wire `onSignIn` to your real sign in.
public struct ManicatLoginCentered: View {
    public struct Styles {
        public var title: ManicatStyle = { $0 }
        public var description: ManicatStyle = { $0 }
        public var sso: ManicatStyle = { $0 }
        public var legal: ManicatStyle = { $0 }
        public init() {}
    }

    private enum Step { case passkey, email, code, done }

    private static let resendSeconds = 30

    @Environment(\.manicat) private var tokens
    @Environment(\.openURL) private var openURL
    @State private var mode = ManicatLoginMode.signIn
    @State private var step = Step.passkey
    @State private var email = ""
    @State private var attempted = false
    @State private var code = ""
    @State private var codeError = ""
    @State private var resendIn = 0

    private let demoCode: String
    private let termsURL: URL?
    private let privacyURL: URL?
    private let styles: Styles
    private let onSignIn: ((String, ManicatLoginMethod, ManicatLoginMode) -> Void)?

    public init(demoCode: String = "482913", termsURL: URL? = nil, privacyURL: URL? = nil, styles: Styles = Styles(), onSignIn: ((String, ManicatLoginMethod, ManicatLoginMode) -> Void)? = nil) {
        self.demoCode = demoCode
        self.termsURL = termsURL
        self.privacyURL = privacyURL
        self.styles = styles
        self.onSignIn = onSignIn
    }

    private var signingUp: Bool { mode == .signUp }
    private var validEmail: Bool { email.trimmingCharacters(in: .whitespaces).range(of: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$", options: .regularExpression) != nil }
    private var emailError: String? {
        guard attempted, !validEmail else { return nil }
        return email.trimmingCharacters(in: .whitespaces).isEmpty ? "Enter your email address." : "Enter a full address, like name@example.com."
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            switch step {
            case .passkey: passkey
            case .email: emailStep
            case .code: codeStep
            case .done: done
            }
            HStack(spacing: 4) {
                Text(signingUp ? "Already have an account?" : "New here?").foregroundStyle(tokens.textSecondary)
                Button { switchMode() } label: { Text(signingUp ? "Sign in" : "Sign up").fontWeight(.medium).foregroundStyle(tokens.foreground) }.buttonStyle(.plain)
            }
            .font(.system(size: 13))
            HStack(spacing: 4) {
                Text("By continuing you agree to the")
                link("Terms", termsURL)
                Text("and")
                link("Privacy Policy", privacyURL)
            }
            .font(.system(size: 12))
            .foregroundStyle(tokens.textMuted)
            .manicatStyle(styles.legal)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(signingUp ? "Create an account" : "Sign in")
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

    @ViewBuilder private func link(_ title: String, _ url: URL?) -> some View {
        Button { if let url { openURL(url) } } label: { Text(title).underline() }.buttonStyle(.plain)
    }

    @ViewBuilder private var passkey: some View {
        heading("Sign in to Manicat UI")
        lead("Use the passkey saved on this device. No password needed.")
        ManicatButton("Continue with passkey") { finish(.passkey) }
        ManicatFlowLayout(spacing: 8, lineSpacing: 8) {
            ForEach([ManicatLoginMethod.google, .apple, .github], id: \.rawValue) { provider in
                ManicatButton(provider.rawValue, variant: .secondary, size: .sm) { finish(provider) }
            }
        }
        .accessibilityLabel("Single sign-on")
        .manicatStyle(styles.sso)
        ManicatButton("Use email instead", variant: .ghost, size: .sm) { step = .email }
    }

    @ViewBuilder private var emailStep: some View {
        heading(signingUp ? "Create your account" : "Sign in with email")
        lead(signingUp ? "Enter your work email. We will send a code to confirm it." : "We will send a 6 digit code to your inbox.")
        ManicatInput(signingUp ? "Work email" : "Email", text: $email, placeholder: "name@example.com", kind: .email, error: emailError)
            .onSubmit { sendCode() }
        ManicatButton(signingUp ? "Send code" : "Continue") { sendCode() }
        if !signingUp { ManicatButton("Use a passkey instead", variant: .ghost, size: .sm) { step = .passkey } }
    }

    @ViewBuilder private var codeStep: some View {
        heading("Check your email")
        lead("Enter the code sent to \(email.trimmingCharacters(in: .whitespaces)).")
        ManicatOtpInput("Verification code", code: $code, description: "Demo code: \(demoCode)", error: codeError.isEmpty ? nil : codeError)
            .onChange(of: code) { _, value in
                codeError = ""
                if value.count == 6 { verify(value) }
            }
        ManicatButton(signingUp ? "Verify and create account" : "Verify and sign in") { verify(code) }
        ManicatButton(resendIn > 0 ? "Resend code in \(resendIn)s" : "Resend code", variant: .ghost, size: .sm) {
            resendIn = Self.resendSeconds
            code = ""
        }
        .disabled(resendIn > 0)
        ManicatButton("Change email", variant: .ghost, size: .sm) { step = .email }
    }

    @ViewBuilder private var done: some View {
        heading(signingUp ? "Welcome to Manicat UI" : "Welcome back")
        lead((signingUp ? "Your account is ready. " : "You are signed in as ") + (email.trimmingCharacters(in: .whitespaces).isEmpty ? "maya@northwind.studio" : email.trimmingCharacters(in: .whitespaces)))
        ManicatButton("Sign out", variant: .secondary) {
            step = .passkey
            mode = .signIn
            email = ""
            code = ""
        }
    }

    private func finish(_ method: ManicatLoginMethod) {
        step = .done
        onSignIn?(email.trimmingCharacters(in: .whitespaces).isEmpty ? "maya@northwind.studio" : email.trimmingCharacters(in: .whitespaces), method, mode)
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

    private func switchMode() {
        mode = signingUp ? .signIn : .signUp
        step = signingUp ? .passkey : .email
        attempted = false
    }
}
