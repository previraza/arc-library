import SwiftUI

/// Mirrors expandable-card.tsx / expandable-card.rn.tsx / expandable-card.vue: the card grows in place to show its content,
/// pushing what is below it down.
public struct ManicatExpandableCard<Content: View>: View {
    public struct Styles {
        public var header: ManicatStyle = { $0 }
        public var title: ManicatStyle = { $0 }
        public var description: ManicatStyle = { $0 }
        public var chevron: ManicatStyle = { $0 }
        public var body: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @State private var expanded: Bool

    private let title: String
    private let description: String?
    private let styles: Styles
    private let content: Content

    public init(title: String, description: String? = nil, defaultExpanded: Bool = false, styles: Styles = Styles(), @ViewBuilder content: () -> Content) {
        self.title = title
        self.description = description
        self.styles = styles
        self.content = content()
        self._expanded = State(wrappedValue: defaultExpanded)
    }

    public var body: some View {
        VStack(spacing: 0) {
            Button {
                withAnimation(.easeInOut(duration: 0.25)) { expanded.toggle() }
            } label: {
                HStack(spacing: ManicatMetrics.space.s3) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(title)
                            .font(.system(size: ManicatMetrics.textLg, weight: .medium))
                            .foregroundStyle(tokens.foreground)
                            .manicatStyle(styles.title)
                        if let description {
                            Text(description)
                                .font(.system(size: ManicatMetrics.textSm))
                                .foregroundStyle(tokens.textSecondary)
                                .manicatStyle(styles.description)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    Text("⌄")
                        .font(.system(size: 18))
                        .foregroundStyle(tokens.textMuted)
                        .rotationEffect(.degrees(expanded ? 180 : 0))
                        .manicatStyle(styles.chevron)
                }
                .padding(ManicatMetrics.space.s5)
                .contentShape(Rectangle())
                .manicatStyle(styles.header)
            }
            .buttonStyle(.plain)
            .accessibilityValue(expanded ? "Expanded" : "Collapsed")
            if expanded {
                VStack(alignment: .leading, spacing: 0) { content }
                    .padding(ManicatMetrics.space.s5)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .overlay(alignment: .top) { Rectangle().fill(tokens.border).frame(height: 1) }
                    .manicatStyle(styles.body)
                    .transition(.opacity)
            }
        }
        .background(tokens.surface, in: RoundedRectangle(cornerRadius: 26))
        .overlay(RoundedRectangle(cornerRadius: 26).stroke(tokens.border, lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: 26))
    }
}
