import SwiftUI

public enum ManicatFooterVariant { case columns, minimal, logo }

public struct ManicatFooterLink: Identifiable {
    public var id: String { label }
    public let label: String
    public let url: URL?
    /// Shows an outward arrow.
    public let external: Bool

    public init(_ label: String, url: URL? = nil, external: Bool = false) {
        self.label = label
        self.url = url
        self.external = external
    }
}

public struct ManicatFooterColumn: Identifiable {
    public var id: String { title }
    public let title: String
    public let links: [ManicatFooterLink]

    public init(title: String, links: [ManicatFooterLink]) {
        self.title = title
        self.links = links
    }
}

public struct ManicatFooterNewsletter {
    public let title: String?
    public let description: String?
    public let placeholder: String
    /// Called with a valid address. Throw to show an error; return to show the subscribed state.
    public let onSubscribe: ((String) async throws -> Void)?

    public init(title: String? = nil, description: String? = nil, placeholder: String = "you@example.com", onSubscribe: ((String) async throws -> Void)? = nil) {
        self.title = title
        self.description = description
        self.placeholder = placeholder
        self.onSubscribe = onSubscribe
    }
}

public struct ManicatFooterStatus {
    public enum Tone { case success, warning, danger }

    public let label: String
    public let tone: Tone
    public let url: URL?

    public init(_ label: String, tone: Tone = .success, url: URL? = nil) {
        self.label = label
        self.tone = tone
        self.url = url
    }
}

/// Mirrors site-footer.tsx / site-footer.rn.tsx / site-footer.vue: brand, link columns, a newsletter, legal links, a status line and
/// social links, in three variants.
public struct ManicatSiteFooter: View {
    public struct Styles {
        public var brand: ManicatStyle = { $0 }
        public var columnTitle: ManicatStyle = { $0 }
        public var link: ManicatStyle = { $0 }
        public var bottom: ManicatStyle = { $0 }
        public init() {}
    }

    public static let exampleColumns = [
        ManicatFooterColumn(title: "Product", links: ["Components", "Blocks", "Templates", "Pricing"].map { ManicatFooterLink($0) }),
        ManicatFooterColumn(title: "Resources", links: [ManicatFooterLink("Documentation"), ManicatFooterLink("Changelog"), ManicatFooterLink("Guides"), ManicatFooterLink("Figma kit", external: true)]),
        ManicatFooterColumn(title: "Company", links: ["About", "Customers", "Careers", "Contact"].map { ManicatFooterLink($0) }),
    ]

    @Environment(\.manicat) private var tokens
    @Environment(\.openURL) private var openURL

    private let variant: ManicatFooterVariant
    private let brand: (name: String, url: URL?)
    private let tagline: String
    private let columns: [ManicatFooterColumn]
    private let links: [ManicatFooterLink]?
    private let legal: [ManicatFooterLink]
    private let socials: [ManicatFooterLink]
    private let newsletter: ManicatFooterNewsletter?
    private let status: ManicatFooterStatus?
    private let year: Int
    private let styles: Styles
    private let onNavigate: ((ManicatFooterLink) -> Void)?

    public init(variant: ManicatFooterVariant = .columns, brand: (name: String, url: URL?) = ("Manicat UI", nil), tagline: String = "Interface components that move with intent.", columns: [ManicatFooterColumn] = ManicatSiteFooter.exampleColumns, links: [ManicatFooterLink]? = nil, legal: [ManicatFooterLink] = ["Privacy", "Terms", "Licenses"].map { ManicatFooterLink($0) }, socials: [ManicatFooterLink] = ["X", "GitHub", "LinkedIn"].map { ManicatFooterLink($0, external: true) }, newsletter: ManicatFooterNewsletter? = ManicatFooterNewsletter(title: "Stay in the loop"), status: ManicatFooterStatus? = ManicatFooterStatus("All systems normal"), year: Int = Calendar.current.component(.year, from: Date()), styles: Styles = Styles(), onNavigate: ((ManicatFooterLink) -> Void)? = nil) {
        self.variant = variant
        self.brand = brand
        self.tagline = tagline
        self.columns = columns
        self.links = links
        self.legal = legal
        self.socials = socials
        self.newsletter = newsletter
        self.status = status
        self.year = year
        self.styles = styles
        self.onNavigate = onNavigate
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            Button { press(ManicatFooterLink(brand.name, url: brand.url)) } label: {
                Text(brand.name).font(.system(size: 18, weight: .semibold)).foregroundStyle(tokens.foreground).manicatStyle(styles.brand)
            }
            .buttonStyle(.plain)
            .accessibilityAddTraits(.isLink)
            if variant != .minimal { Text(tagline).font(.system(size: 14)).foregroundStyle(tokens.textSecondary) }
            if variant == .columns, let newsletter { FooterNewsletter(config: newsletter) }
            if variant == .minimal {
                row(links ?? columns.compactMap { $0.links.first }, label: "Footer")
            } else {
                ForEach(columns) { column in
                    VStack(alignment: .leading, spacing: 8) {
                        Text(column.title).font(.system(size: 13, weight: .semibold)).foregroundStyle(tokens.foreground).accessibilityAddTraits(.isHeader).manicatStyle(styles.columnTitle)
                        ForEach(column.links) { link in anchor(link) }
                    }
                }
            }
            bottom
            if variant == .logo {
                Text(brand.name).font(.system(size: 72, weight: .bold)).tracking(-3).lineLimit(1).minimumScaleFactor(0.3).foregroundStyle(tokens.border).accessibilityHidden(true)
            }
        }
        .padding(.top, 24)
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(alignment: .top) { Rectangle().fill(tokens.border).frame(height: 1) }
    }

    private var bottom: some View {
        VStack(alignment: .leading, spacing: 12) {
            ManicatFlowLayout(spacing: 16, lineSpacing: 8) {
                Text("© \(String(year)) \(brand.name)").font(.system(size: 13)).foregroundStyle(tokens.textMuted)
                if !legal.isEmpty { row(legal, label: "Legal") }
            }
            if let status {
                Button { onNavigate?(ManicatFooterLink(status.label, url: status.url)) } label: {
                    HStack(spacing: 8) {
                        Circle().fill(dot(status.tone)).frame(width: 8, height: 8)
                        Text(status.label).font(.system(size: 13)).foregroundStyle(tokens.textSecondary)
                    }
                }
                .buttonStyle(.plain)
            }
            if !socials.isEmpty { row(socials, label: "Social") }
        }
        .padding(.top, 16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(alignment: .top) { Rectangle().fill(tokens.border).frame(height: 1) }
        .manicatStyle(styles.bottom)
    }

    private func dot(_ tone: ManicatFooterStatus.Tone) -> Color {
        switch tone {
        case .success: return tokens.success
        case .warning: return tokens.warning
        case .danger: return tokens.danger
        }
    }

    private func row(_ items: [ManicatFooterLink], label: String) -> some View {
        ManicatFlowLayout(spacing: 16, lineSpacing: 8) { ForEach(items) { link in anchor(link) } }.accessibilityLabel(label)
    }

    private func anchor(_ link: ManicatFooterLink) -> some View {
        Button { press(link) } label: {
            Text(link.label + (link.external ? " ↗" : "")).font(.system(size: 14)).foregroundStyle(tokens.textSecondary).manicatStyle(styles.link)
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(link.url == nil ? [] : .isLink)
    }

    private func press(_ link: ManicatFooterLink) {
        onNavigate?(link)
        if let url = link.url { openURL(url) }
    }
}

private struct FooterNewsletter: View {
    let config: ManicatFooterNewsletter

    private enum Phase { case idle, loading, done }

    @Environment(\.manicat) private var tokens
    @State private var email = ""
    @State private var phase = Phase.idle
    @State private var error = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let title = config.title { Text(title).font(.system(size: 16, weight: .semibold)).foregroundStyle(tokens.foreground).accessibilityAddTraits(.isHeader) }
            if let description = config.description { Text(description).font(.system(size: 13)).foregroundStyle(tokens.textSecondary) }
            ManicatInput("Email address", text: $email, placeholder: config.placeholder, kind: .email, error: error.isEmpty ? nil : error)
                .disabled(phase != .idle)
                .onChange(of: email) { _, _ in error = "" }
                .onSubmit { Task { await submit() } }
            ManicatButton(phase == .done ? "✓ Subscribed" : "Subscribe", size: .sm, loading: phase == .loading) { Task { await submit() } }
        }
    }

    @MainActor private func submit() async {
        guard phase == .idle else { return }
        let value = email.trimmingCharacters(in: .whitespaces)
        if value.isEmpty { error = "Enter your email address"; return }
        if value.range(of: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$", options: .regularExpression) == nil { error = "That email doesn't look right"; return }
        error = ""
        phase = .loading
        do {
            if let subscribe = config.onSubscribe { try await subscribe(value) } else { try await Task.sleep(nanoseconds: 900_000_000) }
            phase = .done
        } catch {
            phase = .idle
            self.error = "We couldn't subscribe you. Try again in a moment"
        }
    }
}
