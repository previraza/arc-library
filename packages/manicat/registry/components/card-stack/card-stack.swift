import SwiftUI

public enum ManicatCardDecision { case left, right }

/// Mirrors card-stack.tsx / card-stack.rn.tsx / card-stack.vue: a deck you swipe through. Swipe right or left (or use the buttons, or
/// the arrow keys on the Mac); Undo brings the last card back.
public struct ManicatCardStack<Item: Identifiable, Card: View>: View {
    public struct Styles {
        public var card: ManicatStyle = { $0 }
        public var button: ManicatStyle = { $0 }
        public var buttonText: ManicatStyle = { $0 }
        public var status: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @State private var history: [(item: Item, decision: ManicatCardDecision)] = []
    @State private var dx: CGFloat = 0

    private let items: [Item]
    private let title: (Item) -> String
    private let labels: (left: String, right: String)
    private let outcomes: (left: String, right: String)
    private let label: String
    private let styles: Styles
    private let onDecide: ((Item, ManicatCardDecision) -> Void)?
    private let onUndo: ((Item, ManicatCardDecision) -> Void)?
    private let onReset: (() -> Void)?
    private let card: (Item) -> Card

    public init(_ items: [Item], title: @escaping (Item) -> String, labels: (left: String, right: String) = ("Skip", "Keep"), outcomes: (left: String, right: String) = ("skipped", "kept"), label: String = "Cards", styles: Styles = Styles(), onDecide: ((Item, ManicatCardDecision) -> Void)? = nil, onUndo: ((Item, ManicatCardDecision) -> Void)? = nil, onReset: (() -> Void)? = nil, @ViewBuilder card: @escaping (Item) -> Card) {
        self.items = items
        self.title = title
        self.labels = labels
        self.outcomes = outcomes
        self.label = label
        self.styles = styles
        self.onDecide = onDecide
        self.onUndo = onUndo
        self.onReset = onReset
        self.card = card
    }

    public var body: some View {
        let done = Set(history.map { $0.item.id })
        let queue = items.filter { !done.contains($0.id) }
        let top = queue.first
        let last = history.last

        VStack(spacing: ManicatMetrics.space.s3) {
            ZStack {
                if let top {
                    if queue.count > 1 {
                        cardFace(queue[1]).scaleEffect(0.95).offset(y: 10).opacity(0.7)
                    }
                    cardFace(top)
                        .offset(x: dx)
                        .rotationEffect(.degrees(Double(dx) / 25))
                        .gesture(DragGesture().onChanged { dx = $0.translation.width }.onEnded { drag in
                            if drag.translation.width > 90 { decide(.right, top) } else if drag.translation.width < -90 { decide(.left, top) } else { withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) { dx = 0 } }
                        })
                } else {
                    Button { history = []; onReset?() } label: {
                        Text("All done. Start over").font(.system(size: ManicatMetrics.textSm, weight: .medium)).foregroundStyle(tokens.foreground)
                            .frame(maxWidth: .infinity, minHeight: 160)
                            .overlay(RoundedRectangle(cornerRadius: 26).strokeBorder(tokens.border, style: StrokeStyle(lineWidth: 1, dash: [4])))
                    }
                    .buttonStyle(.plain)
                }
            }
            HStack(spacing: ManicatMetrics.space.s2) {
                deckButton("← \(labels.left)", disabled: top == nil) { if let top { decide(.left, top) } }
                deckButton("\(labels.right) →", disabled: top == nil) { if let top { decide(.right, top) } }
                Button {
                    if let last { history.removeLast(); onUndo?(last.item, last.decision) }
                } label: {
                    Text("Undo").font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.textSecondary)
                }
                .buttonStyle(.plain)
                .disabled(last == nil)
                .opacity(last == nil ? 0.4 : 1)
            }
            Text(last.map { "\(title($0.item)) \($0.decision == .left ? outcomes.left : outcomes.right)" } ?? " ")
                .font(.system(size: ManicatMetrics.textXs))
                .foregroundStyle(tokens.textMuted)
                .manicatStyle(styles.status)
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
        .onKeyPress(.rightArrow) { if let top { decide(.right, top) }; return .handled }
        .onKeyPress(.leftArrow) { if let top { decide(.left, top) }; return .handled }
    }

    private func cardFace(_ item: Item) -> some View {
        card(item)
            .frame(maxWidth: .infinity)
            .background(tokens.surface, in: RoundedRectangle(cornerRadius: 26))
            .overlay(RoundedRectangle(cornerRadius: 26).stroke(tokens.border, lineWidth: 1))
            .manicatStyle(styles.card)
    }

    private func deckButton(_ text: String, disabled: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(text)
                .font(.system(size: ManicatMetrics.textSm, weight: .medium))
                .foregroundStyle(tokens.foreground)
                .manicatStyle(styles.buttonText)
                .padding(.horizontal, ManicatMetrics.space.s4)
                .frame(minHeight: ManicatMetrics.controlHeight.sm)
                .background(tokens.surface, in: Capsule())
                .overlay(Capsule().stroke(tokens.border, lineWidth: 1))
                .manicatStyle(styles.button)
        }
        .buttonStyle(.plain)
        .disabled(disabled)
        .opacity(disabled ? 0.4 : 1)
    }

    private func decide(_ decision: ManicatCardDecision, _ item: Item) {
        withAnimation(.easeIn(duration: 0.18)) { dx = decision == .right ? 420 : -420 }
        Task {
            try? await Task.sleep(nanoseconds: 180_000_000)
            await MainActor.run {
                history.append((item, decision))
                dx = 0
                onDecide?(item, decision)
            }
        }
    }
}
