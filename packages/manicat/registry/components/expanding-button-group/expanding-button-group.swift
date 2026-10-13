import SwiftUI

public struct ManicatExpandingButtonItem: Identifiable {
    public enum Tone { case neutral, danger }

    public let id: String
    public let label: String
    public let icon: AnyView
    public let doneLabel: String?
    public let tone: Tone
    public let disabled: Bool
    /// Return false to cancel the confirmation. It may suspend, which keeps the button pending.
    public let onSelect: (() async -> Bool)?

    public init<Icon: View>(id: String, label: String, doneLabel: String? = nil, tone: Tone = .neutral, disabled: Bool = false, onSelect: (() async -> Bool)? = nil, @ViewBuilder icon: () -> Icon) {
        self.id = id
        self.label = label
        self.icon = AnyView(icon())
        self.doneLabel = doneLabel
        self.tone = tone
        self.disabled = disabled
        self.onSelect = onSelect
    }
}

/// Mirrors expanding-button-group.tsx / expanding-button-group.rn.tsx / expanding-button-group.vue: icon buttons that widen to show
/// their label on hover or focus, and confirm in place with a short "done" label.
public struct ManicatExpandingButtonGroup: View {
    public enum Size { case sm, md }

    public struct Styles {
        public var button: ManicatStyle = { $0 }
        public var buttonText: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @State private var expanded: String?
    @State private var done: String?

    private let items: [ManicatExpandingButtonItem]
    private let label: String
    private let size: Size
    private let confirmDuration: Double
    private let onAction: (String) -> Void
    private let styles: Styles

    public init(items: [ManicatExpandingButtonItem], label: String, size: Size = .md, confirmDuration: Double = 1.4, styles: Styles = Styles(), onAction: @escaping (String) -> Void = { _ in }) {
        self.items = items
        self.label = label
        self.size = size
        self.confirmDuration = confirmDuration
        self.styles = styles
        self.onAction = onAction
    }

    public var body: some View {
        let height: CGFloat = size == .sm ? 32 : 40

        HStack(spacing: 2) {
            ForEach(items) { item in
                let open = expanded == item.id || done == item.id
                Button { Task { await run(item) } } label: {
                    HStack(spacing: 6) {
                        item.icon
                        if open {
                            Text(done == item.id ? (item.doneLabel ?? item.label) : item.label)
                                .font(.system(size: ManicatMetrics.textSm, weight: .medium))
                                .lineLimit(1)
                                .manicatStyle(styles.buttonText)
                                .transition(.opacity)
                        }
                    }
                    .foregroundStyle(item.tone == .danger ? tokens.danger : tokens.foreground)
                    .padding(.horizontal, 10)
                    .frame(minWidth: height, minHeight: height)
                    .background(open ? tokens.surface : .clear, in: Capsule())
                    .manicatStyle(styles.button)
                }
                .buttonStyle(.plain)
                .disabled(item.disabled)
                .opacity(item.disabled ? 0.45 : 1)
                .accessibilityLabel(item.label)
                .onHover { inside in withAnimation(.easeOut(duration: 0.18)) { expanded = inside ? item.id : nil } }
            }
        }
        .padding(3)
        .background(tokens.surfaceMuted, in: Capsule())
        .overlay(Capsule().stroke(tokens.border, lineWidth: 1))
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
    }

    @MainActor private func run(_ item: ManicatExpandingButtonItem) async {
        if let result = await item.onSelect?(), result == false { return }
        onAction(item.id)
        withAnimation(.easeOut(duration: 0.18)) { done = item.id }
        try? await Task.sleep(nanoseconds: UInt64(confirmDuration * 1_000_000_000))
        withAnimation(.easeOut(duration: 0.18)) { done = nil }
    }
}
