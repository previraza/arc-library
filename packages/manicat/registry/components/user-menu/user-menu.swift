import SwiftUI

public enum ManicatUserStatus: String, CaseIterable {
    case available = "Available", busy = "Busy", away = "Away"
}

public struct ManicatUser {
    public let name: String
    public let email: String
    public let plan: String?
    public let avatarURL: URL?

    public init(name: String, email: String, plan: String? = nil, avatarURL: URL? = nil) {
        self.name = name
        self.email = email
        self.plan = plan
        self.avatarURL = avatarURL
    }
}

/// Mirrors user-menu.tsx / user-menu.rn.tsx / user-menu.vue: the account avatar opens a menu with who you are, an optional status,
/// your links and Sign out. The list is the system menu.
public struct ManicatUserMenu: View {
    public struct Styles {
        public var trigger: ManicatStyle = { $0 }
        public init() {}
    }

    private let user: ManicatUser
    private let items: [ManicatMenuItem]
    private let status: Binding<ManicatUserStatus>?
    private let onSignOut: (() -> Void)?
    private let styles: Styles

    public init(user: ManicatUser, items: [ManicatMenuItem] = [], status: Binding<ManicatUserStatus>? = nil, styles: Styles = Styles(), onSignOut: (() -> Void)? = nil) {
        self.user = user
        self.items = items
        self.status = status
        self.styles = styles
        self.onSignOut = onSignOut
    }

    public var body: some View {
        Menu {
            Section("\(user.name) · \(user.email)\(user.plan.map { " · \($0)" } ?? "")") {
                if let status {
                    Picker("Status", selection: status) {
                        ForEach(ManicatUserStatus.allCases, id: \.self) { Text($0.rawValue).tag($0) }
                    }
                }
                ForEach(items) { item in
                    Button(role: item.destructive ? .destructive : nil, action: item.action) { Text(item.label) }
                        .disabled(item.disabled)
                }
            }
            if let onSignOut {
                Divider()
                Button(role: .destructive, action: onSignOut) { Text("Sign out") }
            }
        } label: {
            ManicatAvatar(name: user.name, url: user.avatarURL, status: status.map { $0.wrappedValue == .available ? .online : .offline })
                .manicatStyle(styles.trigger)
        }
        .menuStyle(.button)
        .menuIndicator(.hidden)
        .buttonStyle(.plain)
        .accessibilityLabel("\(user.name) account menu")
    }
}
