import SwiftUI

public struct ManicatLogoBrand: Identifiable {
    public var id: String { name }
    public let name: String
    /// The mark, as an image URL. Brands without one show only the name.
    public let url: URL?

    public init(_ name: String, url: URL? = nil) {
        self.name = name
        self.url = url
    }
}

/// Mirrors logo-marquee.tsx / logo-marquee.rn.tsx / logo-marquee.vue: a row of marks that travels sideways and loops; Pause stops it.
public struct ManicatLogoMarquee: View {
    public struct Styles {
        public var title: ManicatStyle = { $0 }
        public var description: ManicatStyle = { $0 }
        public var brand: ManicatStyle = { $0 }
        public var name: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @State private var paused = false
    @State private var width: CGFloat = 0
    @State private var origin = Date()
    @State private var frozen: CGFloat = 0

    private let title: String
    private let description: String
    private let brands: [ManicatLogoBrand]
    /// Points per second the row travels.
    private let speed: CGFloat
    private let styles: Styles

    public init(title: String = "Good work moves between tools", description: String = "From the first idea to the final handoff, a familiar set of tools stays close to the work.", brands: [ManicatLogoBrand] = ["Figma", "Linear", "Notion", "Slack", "GitHub", "Stripe", "Vercel"].map { ManicatLogoBrand($0) }, speed: CGFloat = 40, styles: Styles = Styles()) {
        self.title = title
        self.description = description
        self.brands = brands
        self.speed = speed
        self.styles = styles
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title).font(.system(size: 24, weight: .semibold)).tracking(-0.4).foregroundStyle(tokens.foreground).accessibilityAddTraits(.isHeader).manicatStyle(styles.title)
            Text(description).font(.system(size: 14)).lineSpacing(3).foregroundStyle(tokens.textSecondary).manicatStyle(styles.description)
            TimelineView(.animation(paused: paused)) { context in track(at: context.date) }
            .accessibilityLabel("Illustrative tool logos")
            ManicatButton(paused ? "Play" : "Pause", variant: .ghost, size: .sm) {
                if paused {
                    origin = Date()
                } else {
                    frozen = width > 0 ? (frozen + CGFloat(Date().timeIntervalSince(origin)) * speed).truncatingRemainder(dividingBy: width) : 0
                }
                paused.toggle()
            }
            .accessibilityLabel(paused ? "Play logo motion" : "Pause logo motion")
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func track(at date: Date) -> some View {
        let travelled = width > 0 ? (frozen + CGFloat(date.timeIntervalSince(origin)) * speed).truncatingRemainder(dividingBy: width) : 0

        return HStack(spacing: 0) {
            row.background(GeometryReader { proxy in Color.clear.onAppear { width = proxy.size.width } })
            row.accessibilityHidden(true)
        }
        .fixedSize()
        .offset(x: -travelled)
        .frame(maxWidth: .infinity, alignment: .leading)
        .clipped()
    }

    private var row: some View {
        HStack(spacing: 0) {
            ForEach(brands) { brand in
                HStack(spacing: 8) {
                    if let url = brand.url {
                        AsyncImage(url: url) { image in image.resizable().scaledToFit() } placeholder: { Color.clear }.frame(width: 22, height: 22).accessibilityHidden(true)
                    }
                    Text(brand.name).font(.system(size: 16, weight: .medium)).foregroundStyle(tokens.textSecondary).manicatStyle(styles.name)
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
                .manicatStyle(styles.brand)
            }
        }
    }
}
