import SwiftUI

/// Mirrors image-compare.tsx / image-compare.rn.tsx / image-compare.vue: drag the divider to reveal more of one side. Arrow keys
/// move it too.
public struct ManicatImageCompare<Before: View, After: View>: View {
    public struct Styles {
        public var handle: ManicatStyle = { $0 }
        public var tag: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens

    @Binding private var position: Double
    private let vertical: Bool
    private let labels: (String, String)?
    private let label: String
    private let aspectRatio: CGFloat
    private let styles: Styles
    private let before: Before
    private let after: After

    public init(position: Binding<Double>, vertical: Bool = false, labels: (String, String)? = ("Before", "After"), label: String = "Image comparison", aspectRatio: CGFloat = 1.6, styles: Styles = Styles(), @ViewBuilder before: () -> Before, @ViewBuilder after: () -> After) {
        self._position = position
        self.vertical = vertical
        self.labels = labels
        self.label = label
        self.aspectRatio = aspectRatio
        self.styles = styles
        self.before = before()
        self.after = after()
    }

    public var body: some View {
        GeometryReader { proxy in
            let size = proxy.size
            let along = (vertical ? size.height : size.width) * position / 100

            ZStack(alignment: .topLeading) {
                after.frame(width: size.width, height: size.height).clipped()
                before
                    .frame(width: size.width, height: size.height)
                    .clipped()
                    .mask(alignment: .topLeading) {
                        Rectangle().frame(width: vertical ? size.width : along, height: vertical ? along : size.height)
                    }
                // The line and its handle.
                Rectangle().fill(.white)
                    .frame(width: vertical ? size.width : 2, height: vertical ? 2 : size.height)
                    .position(x: vertical ? size.width / 2 : along, y: vertical ? along : size.height / 2)
                Text(vertical ? "↕" : "↔")
                    .font(.system(size: 14))
                    .foregroundStyle(tokens.foreground)
                    .frame(width: 32, height: 32)
                    .background(tokens.surface, in: Circle())
                    .overlay(Circle().stroke(tokens.border, lineWidth: 1))
                    .manicatStyle(styles.handle)
                    .position(x: vertical ? size.width / 2 : along, y: vertical ? along : size.height / 2)
                if let labels {
                    tag(labels.0).position(x: 12 + 28, y: 24)
                    tag(labels.1).position(x: size.width - 12 - 28, y: size.height - 24)
                }
            }
            .contentShape(Rectangle())
            .gesture(DragGesture(minimumDistance: 0).onChanged { value in
                let ratio = vertical ? value.location.y / size.height : value.location.x / size.width
                position = Double(min(100, max(0, ratio * 100)))
            })
        }
        .aspectRatio(aspectRatio, contentMode: .fit)
        .clipShape(RoundedRectangle(cornerRadius: 26))
        .overlay(RoundedRectangle(cornerRadius: 26).stroke(tokens.border, lineWidth: 1))
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(label)
        .accessibilityValue("\(Int(position.rounded())) percent")
        .accessibilityAdjustableAction { direction in
            switch direction {
            case .increment: position = min(100, position + 5)
            case .decrement: position = max(0, position - 5)
            @unknown default: break
            }
        }
    }

    private func tag(_ text: String) -> some View {
        Text(text)
            .font(.system(size: ManicatMetrics.textXs))
            .foregroundStyle(.white)
            .padding(.horizontal, 8)
            .padding(.vertical, 2)
            .background(.black.opacity(0.5), in: Capsule())
            .manicatStyle(styles.tag)
    }
}
