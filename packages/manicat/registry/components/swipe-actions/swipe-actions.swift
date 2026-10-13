import SwiftUI

public struct ManicatSwipeAction: Identifiable {
    public enum Tone { case neutral, accent, danger }

    public var id: String { label }
    public let label: String
    public let icon: String?
    public let tone: Tone
    /// Keep the row in place after the action runs instead of closing it.
    public let keepRow: Bool
    public let onSelect: () -> Void

    public init(_ label: String, icon: String? = nil, tone: Tone = .neutral, keepRow: Bool = false, onSelect: @escaping () -> Void) {
        self.label = label
        self.icon = icon
        self.tone = tone
        self.keepRow = keepRow
        self.onSelect = onSelect
    }
}

/// A list container for swipeable rows. Mirrors swipe-actions.tsx / swipe-actions.rn.tsx / swipe-actions.vue.
public struct ManicatSwipeActions<Content: View>: View {
    private let label: String
    private let content: Content

    public init(_ label: String, @ViewBuilder content: () -> Content) {
        self.label = label
        self.content = content()
    }

    public var body: some View {
        VStack(spacing: 0) { content }
            .frame(maxWidth: .infinity)
            .accessibilityElement(children: .contain)
            .accessibilityLabel(label)
    }
}

/// Drag the row sideways to reveal actions. Each action is also an accessibility action, so it isn't gesture-only.
public struct ManicatSwipeActionsRow<Content: View>: View {
    public struct Styles {
        public var row: ManicatStyle = { $0 }
        public var action: ManicatStyle = { $0 }
        public var actionText: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @State private var offset: CGFloat = 0
    @State private var settled: CGFloat = 0

    private let label: String
    private let leading: [ManicatSwipeAction]
    private let trailing: [ManicatSwipeAction]
    private let styles: Styles
    private let content: Content

    private let width: CGFloat = 84

    public init(_ label: String, leading: [ManicatSwipeAction] = [], trailing: [ManicatSwipeAction] = [], styles: Styles = Styles(), @ViewBuilder content: () -> Content) {
        self.label = label
        self.leading = leading
        self.trailing = trailing
        self.styles = styles
        self.content = content()
    }

    private var maxLeft: CGFloat { CGFloat(leading.count) * width }
    private var maxRight: CGFloat { CGFloat(trailing.count) * width }

    public var body: some View {
        ZStack {
            HStack(spacing: 0) {
                strip(leading)
                Spacer(minLength: 0)
                strip(trailing)
            }
            content
                .padding(.horizontal, ManicatMetrics.space.s4)
                .padding(.vertical, ManicatMetrics.space.s2)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(tokens.surface)
                .offset(x: offset)
                .gesture(DragGesture(minimumDistance: 8)
                    .onChanged { drag in offset = max(-maxRight, min(maxLeft, settled + drag.translation.width)) }
                    .onEnded { drag in
                        let end = settled + drag.translation.width
                        let target: CGFloat = end > width / 2 && maxLeft > 0 ? maxLeft : end < -width / 2 && maxRight > 0 ? -maxRight : 0
                        settled = target
                        withAnimation(.spring(response: 0.3, dampingFraction: 1)) { offset = target }
                    })
                .accessibilityElement(children: .combine)
                .accessibilityLabel(label)
                .accessibilityActions { ForEach(leading + trailing) { action in Button(action.label) { action.onSelect() } } }
        }
        .clipped()
        .overlay(alignment: .bottom) { Rectangle().fill(tokens.border).frame(height: 1) }
        .manicatStyle(styles.row)
    }

    private func strip(_ actions: [ManicatSwipeAction]) -> some View {
        HStack(spacing: 0) {
            ForEach(actions) { action in
                Button {
                    action.onSelect()
                    if !action.keepRow { close() }
                } label: {
                    VStack(spacing: 4) {
                        if let icon = action.icon { Text(icon).font(.system(size: 16)) }
                        Text(action.label).font(.system(size: ManicatMetrics.textXs, weight: .medium)).manicatStyle(styles.actionText)
                    }
                    .foregroundStyle(.white)
                    .frame(width: width)
                    .frame(maxHeight: .infinity)
                    .background(color(action.tone))
                    .manicatStyle(styles.action)
                }
                .buttonStyle(.plain)
                .accessibilityLabel(action.label)
            }
        }
    }

    private func color(_ tone: ManicatSwipeAction.Tone) -> Color {
        switch tone {
        case .danger: return tokens.danger
        case .accent: return tokens.accent
        case .neutral: return tokens.textSecondary
        }
    }

    private func close() {
        settled = 0
        withAnimation(.spring(response: 0.3, dampingFraction: 1)) { offset = 0 }
    }
}
