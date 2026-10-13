import SwiftUI

public struct ManicatAccordionItem: Identifiable {
    public var id: String { title }
    public let title: String
    public let content: AnyView

    public init<Content: View>(title: String, @ViewBuilder content: () -> Content) {
        self.title = title
        self.content = AnyView(content())
    }

    /// A plain text answer.
    public init(title: String, text: String) {
        self.init(title: title) { Text(text) }
    }
}

/// Mirrors accordion.tsx / accordion.rn.tsx / accordion.vue: one item open at a time.
public struct ManicatAccordion: View {
    public enum Size { case md, lg }

    public struct Styles {
        public var item: ManicatStyle = { $0 }
        public var trigger: ManicatStyle = { $0 }
        public var title: ManicatStyle = { $0 }
        public var icon: ManicatStyle = { $0 }
        public var panel: ManicatStyle = { $0 }
        public var text: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @State private var open: Int?

    private let items: [ManicatAccordionItem]
    private let size: Size
    private let styles: Styles

    public init(items: [ManicatAccordionItem], defaultOpen: Int? = nil, size: Size = .md, styles: Styles = Styles()) {
        self.items = items
        self.size = size
        self.styles = styles
        self._open = State(wrappedValue: defaultOpen)
    }

    public var body: some View {
        let large = size == .lg

        VStack(spacing: 0) {
            ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
                let expanded = open == index
                VStack(spacing: 0) {
                    Button { withAnimation(.easeInOut(duration: 0.25)) { open = expanded ? nil : index } } label: {
                        HStack(spacing: ManicatMetrics.space.s5) {
                            Text(item.title)
                                .font(.system(size: large ? ManicatMetrics.textLg : ManicatMetrics.textSm, weight: .medium))
                                .foregroundStyle(tokens.foreground)
                                .manicatStyle(styles.title)
                                .frame(maxWidth: .infinity, alignment: .leading)
                            Text("⌄")
                                .font(.system(size: 18))
                                .foregroundStyle(expanded ? tokens.foreground : tokens.textMuted)
                                .rotationEffect(.degrees(expanded ? 180 : 0))
                                .manicatStyle(styles.icon)
                        }
                        .padding(.vertical, ManicatMetrics.space.s2)
                        .frame(minHeight: large ? 76 : ManicatMetrics.controlHeight.lg)
                        .contentShape(Rectangle())
                        .manicatStyle(styles.trigger)
                    }
                    .buttonStyle(.plain)
                    .accessibilityValue(expanded ? "Expanded" : "Collapsed")
                    if expanded {
                        item.content
                            .font(.system(size: large ? 16 : ManicatMetrics.textSm))
                            .lineSpacing(large ? 6 : 3)
                            .foregroundStyle(tokens.textSecondary)
                            .manicatStyle(styles.text)
                            .padding(.bottom, ManicatMetrics.space.s5)
                            .padding(.trailing, 32)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .manicatStyle(styles.panel)
                            .transition(.opacity)
                    }
                }
                .overlay(alignment: .bottom) { Rectangle().fill(tokens.border).frame(height: 1) }
                .manicatStyle(styles.item)
            }
        }
        .overlay(alignment: .top) { Rectangle().fill(tokens.border).frame(height: 1) }
    }
}
