import SwiftUI

public enum ManicatHeaderVariant { case simple, centered, mega }

public struct ManicatHeaderLink: Identifiable {
    public var id: String { label }
    public let label: String
    public let description: String?
    public let url: URL?

    public init(_ label: String, description: String? = nil, url: URL? = nil) {
        self.label = label
        self.description = description
        self.url = url
    }
}

public struct ManicatHeaderItem: Identifiable {
    public var id: String { value }
    /// Stable id, used for the current section.
    public let value: String
    public let label: String
    public let url: URL?
    /// Links in the dropdown panel.
    public let links: [ManicatHeaderLink]

    public init(value: String, label: String, url: URL? = nil, links: [ManicatHeaderLink] = []) {
        self.value = value
        self.label = label
        self.url = url
        self.links = links
    }
}

public struct ManicatHeaderAction {
    public let label: String
    public let url: URL?

    public init(_ label: String, url: URL? = nil) {
        self.label = label
        self.url = url
    }
}

public struct ManicatHeaderDestination {
    public let label: String
    public let url: URL?
    public let section: String?
}

/// Mirrors site-header.tsx / site-header.rn.tsx / site-header.vue. Phones always use the collapsed menu, so `variant` is kept only for
/// parity with the web block: a brand, a menu button, and a panel of sections that expand into their links.
public struct ManicatSiteHeader: View {
    public struct Styles {
        public var bar: ManicatStyle = { $0 }
        public var brand: ManicatStyle = { $0 }
        public var item: ManicatStyle = { $0 }
        public var panel: ManicatStyle = { $0 }
        public init() {}
    }

    public static let exampleItems = [
        ManicatHeaderItem(value: "product", label: "Product", links: [
            ManicatHeaderLink("Components", description: "140 interactive components"),
            ManicatHeaderLink("Blocks", description: "Complete sections, ready to ship"),
            ManicatHeaderLink("Templates", description: "Starter sites with every page"),
            ManicatHeaderLink("Themes", description: "Tune color, radius, and motion"),
        ]),
        ManicatHeaderItem(value: "resources", label: "Resources", links: [
            ManicatHeaderLink("Documentation", description: "Install, theme, and compose"),
            ManicatHeaderLink("Guides", description: "Patterns for real product work"),
            ManicatHeaderLink("Changelog", description: "Every release, week by week"),
            ManicatHeaderLink("Community", description: "Questions, answers, and showcases"),
        ]),
        ManicatHeaderItem(value: "pricing", label: "Pricing"),
        ManicatHeaderItem(value: "customers", label: "Customers"),
    ]

    @Environment(\.manicat) private var tokens
    @Environment(\.openURL) private var openURL
    @State private var menu = false
    @State private var expanded: String?
    @State private var inner: String

    private let brand: (name: String, url: URL?)
    private let items: [ManicatHeaderItem]
    private let current: Binding<String>?
    private let secondaryAction: ManicatHeaderAction?
    private let primaryAction: ManicatHeaderAction?
    private let styles: Styles
    private let onNavigate: ((ManicatHeaderDestination) -> Void)?

    public init(variant: ManicatHeaderVariant = .simple, brand: (name: String, url: URL?) = ("Manicat UI", nil), items: [ManicatHeaderItem] = ManicatSiteHeader.exampleItems, current: Binding<String>? = nil, defaultCurrent: String = "", secondaryAction: ManicatHeaderAction? = ManicatHeaderAction("Sign in"), primaryAction: ManicatHeaderAction? = ManicatHeaderAction("Get Manicat UI"), styles: Styles = Styles(), onNavigate: ((ManicatHeaderDestination) -> Void)? = nil) {
        self.brand = brand
        self.items = items
        self.current = current
        self.secondaryAction = secondaryAction
        self.primaryAction = primaryAction
        self.styles = styles
        self.onNavigate = onNavigate
        self._inner = State(wrappedValue: defaultCurrent)
    }

    private var selected: String { current?.wrappedValue ?? inner }

    public var body: some View {
        VStack(spacing: 0) {
            HStack {
                Button { go(ManicatHeaderDestination(label: brand.name, url: brand.url, section: nil)) } label: {
                    Text(brand.name).font(.system(size: 18, weight: .semibold)).foregroundStyle(tokens.foreground).manicatStyle(styles.brand)
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(.isLink)
                Spacer(minLength: 0)
                ManicatButton(menu ? "✕" : "☰", variant: .ghost, size: .sm) { menu.toggle() }
                    .accessibilityLabel(menu ? "Close menu" : "Open menu")
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .manicatStyle(styles.bar)
            if menu { panel }
        }
        .frame(maxWidth: .infinity)
        .background(tokens.background)
        .overlay(alignment: .bottom) { Rectangle().fill(tokens.border).frame(height: 1) }
        .accessibilityElement(children: .contain)
        .accessibilityAddTraits(.isHeader)
    }

    private var panel: some View {
        VStack(alignment: .leading, spacing: 4) {
            ForEach(items) { item in
                VStack(alignment: .leading, spacing: 0) {
                    Button { choose(item) } label: {
                        HStack {
                            Text(item.label).font(.system(size: 16, weight: selected == item.value ? .semibold : .regular)).foregroundStyle(selected == item.value ? tokens.foreground : tokens.textSecondary).manicatStyle(styles.item)
                            Spacer(minLength: 0)
                            if !item.links.isEmpty { Text(expanded == item.value ? "−" : "+").foregroundStyle(tokens.textMuted) }
                        }
                        .padding(.vertical, 12)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityAddTraits(selected == item.value ? .isSelected : [])
                    if expanded == item.value {
                        VStack(alignment: .leading, spacing: 10) {
                            ForEach(item.links) { link in
                                Button {
                                    go(ManicatHeaderDestination(label: link.label, url: link.url, section: item.label))
                                    menu = false
                                } label: {
                                    VStack(alignment: .leading, spacing: 0) {
                                        Text(link.label).font(.system(size: 15)).foregroundStyle(tokens.foreground)
                                        if let description = link.description { Text(description).font(.system(size: 12)).foregroundStyle(tokens.textMuted) }
                                    }
                                }
                                .buttonStyle(.plain)
                                .accessibilityAddTraits(.isLink)
                            }
                        }
                        .padding(.leading, 12)
                        .padding(.bottom, 8)
                    }
                }
            }
            HStack(spacing: 8) {
                if let secondaryAction { ManicatButton(secondaryAction.label, variant: .secondary) { go(ManicatHeaderDestination(label: secondaryAction.label, url: secondaryAction.url, section: nil)) } }
                if let primaryAction { ManicatButton(primaryAction.label) { go(ManicatHeaderDestination(label: primaryAction.label, url: primaryAction.url, section: nil)) } }
            }
            .padding(.top, 8)
        }
        .padding(.horizontal, 16)
        .padding(.bottom, 16)
        .manicatStyle(styles.panel)
    }

    private func go(_ destination: ManicatHeaderDestination) {
        onNavigate?(destination)
        if let url = destination.url { openURL(url) }
    }

    private func choose(_ item: ManicatHeaderItem) {
        if !item.links.isEmpty {
            expanded = expanded == item.value ? nil : item.value
            return
        }
        if let current { current.wrappedValue = item.value } else { inner = item.value }
        go(ManicatHeaderDestination(label: item.label, url: item.url, section: nil))
        menu = false
    }
}
