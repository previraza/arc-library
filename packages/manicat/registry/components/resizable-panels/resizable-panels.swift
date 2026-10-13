import SwiftUI

/// A panel inside `ManicatResizablePanels`: its content plus the sizing rules.
public struct ManicatResizablePanel: Identifiable {
    public let id: String
    public let label: String
    /// Share of the space it starts with, in percent.
    public let defaultSize: Double
    public let minSize: Double
    public let maxSize: Double
    let content: AnyView

    public init<Content: View>(id: String, label: String, defaultSize: Double, minSize: Double = 10, maxSize: Double = 100, @ViewBuilder content: () -> Content) {
        self.id = id
        self.label = label
        self.defaultSize = defaultSize
        self.minSize = minSize
        self.maxSize = maxSize
        self.content = AnyView(content())
    }
}

public enum ManicatPanelDirection { case horizontal, vertical }

/// Mirrors resizable-panels.tsx / resizable-panels.rn.tsx / resizable-panels.vue: panels separated by draggable handles. Sizes are
/// percentages that always add up to 100. Arrow keys and VoiceOver's adjust gesture move a handle too.
public struct ManicatResizablePanels: View {
    @Environment(\.manicat) private var tokens
    @State private var sizes: [Double]
    @State private var origin: [Double]?

    private let panels: [ManicatResizablePanel]
    private let direction: ManicatPanelDirection
    private let label: String
    private let onLayoutChange: (([Double]) -> Void)?

    private let handle: CGFloat = 14

    public init(_ panels: [ManicatResizablePanel], direction: ManicatPanelDirection = .horizontal, label: String = "Resizable panels", onLayoutChange: (([Double]) -> Void)? = nil) {
        self.panels = panels
        self.direction = direction
        self.label = label
        self.onLayoutChange = onLayoutChange
        self._sizes = State(wrappedValue: panels.map { $0.defaultSize })
    }

    public var body: some View {
        GeometryReader { proxy in
            let horizontal = direction == .horizontal
            let total = max(1, horizontal ? proxy.size.width : proxy.size.height)

            ZStack(alignment: .topLeading) {
                stack(horizontal: horizontal, total: total)
                ForEach(0..<max(0, panels.count - 1), id: \.self) { index in
                    let at = sizes.prefix(index + 1).reduce(0, +) / 100 * total
                    grip(index, horizontal: horizontal, total: total)
                        .frame(width: horizontal ? handle : proxy.size.width, height: horizontal ? proxy.size.height : handle)
                        .offset(x: horizontal ? at - handle / 2 : 0, y: horizontal ? 0 : at - handle / 2)
                }
            }
        }
        .clipped()
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
    }

    @ViewBuilder private func stack(horizontal: Bool, total: CGFloat) -> some View {
        if horizontal {
            HStack(spacing: 0) {
                ForEach(Array(panels.enumerated()), id: \.element.id) { index, panel in
                    panel.content.frame(width: sizes[index] / 100 * total).clipped()
                }
            }
        } else {
            VStack(spacing: 0) {
                ForEach(Array(panels.enumerated()), id: \.element.id) { index, panel in
                    panel.content.frame(height: sizes[index] / 100 * total).clipped()
                }
            }
        }
    }

    private func grip(_ index: Int, horizontal: Bool, total: CGFloat) -> some View {
        RoundedRectangle(cornerRadius: 2).fill(tokens.borderStrong)
            .frame(width: horizontal ? 4 : 28, height: horizontal ? 28 : 4)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .contentShape(Rectangle())
            .gesture(DragGesture(minimumDistance: 0)
                .onChanged { drag in
                    if origin == nil { origin = sizes }
                    move(index, from: origin ?? sizes, by: Double((horizontal ? drag.translation.width : drag.translation.height) / total) * 100)
                }
                .onEnded { _ in origin = nil })
            .accessibilityElement()
            .accessibilityLabel("Resize \(panels[index].label)")
            .accessibilityAdjustableAction { direction in move(index, from: sizes, by: direction == .increment ? 5 : -5) }
    }

    private func move(_ index: Int, from start: [Double], by delta: Double) {
        let a = panels[index], b = panels[index + 1]
        let sum = start[index] + start[index + 1]
        let first = max(a.minSize, min(min(a.maxSize, sum - b.minSize), start[index] + delta))
        var next = start
        next[index] = first
        next[index + 1] = sum - first
        sizes = next
        onLayoutChange?(next)
    }
}
