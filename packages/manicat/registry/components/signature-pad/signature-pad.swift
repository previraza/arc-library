import SwiftUI

public enum ManicatInkColor: String, CaseIterable { case black, blue, violet }
public enum ManicatInkWidth: String, CaseIterable { case fine, medium, bold }

public struct ManicatInkStroke: Identifiable {
    public let id: String
    public var points: [CGPoint]
    public let color: ManicatInkColor
    public let width: ManicatInkWidth
}

/// Mirrors signature-pad.tsx / signature-pad.rn.tsx / signature-pad.vue: draw with a finger, a stylus or the mouse. The strokes are
/// plain points, so you can store them or render them yourself.
public struct ManicatSignaturePad: View {
    public struct Styles {
        public var surface: ManicatStyle = { $0 }
        public var line: ManicatStyle = { $0 }
        public var hint: ManicatStyle = { $0 }
        public var action: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @State private var color: ManicatInkColor
    @State private var width: ManicatInkWidth

    @Binding private var strokes: [ManicatInkStroke]
    private let signer: String?
    private let hint: String
    private let height: CGFloat
    private let styles: Styles
    private let onChange: (([ManicatInkStroke]) -> Void)?

    public init(strokes: Binding<[ManicatInkStroke]>, signer: String? = nil, hint: String = "Sign above the line", defaultColor: ManicatInkColor = .black, defaultWidth: ManicatInkWidth = .medium, height: CGFloat = 180, styles: Styles = Styles(), onChange: (([ManicatInkStroke]) -> Void)? = nil) {
        self._strokes = strokes
        self.signer = signer
        self.hint = hint
        self.height = height
        self.styles = styles
        self.onChange = onChange
        self._color = State(wrappedValue: defaultColor)
        self._width = State(wrappedValue: defaultWidth)
    }

    private func ink(_ color: ManicatInkColor) -> Color {
        switch color {
        case .black: return Color(hex: "#111111")
        case .blue: return Color(hex: "#1f5fd1")
        case .violet: return Color(hex: "#6d3cc9")
        }
    }

    private func thickness(_ width: ManicatInkWidth) -> CGFloat {
        switch width {
        case .fine: return 1.5
        case .medium: return 2.5
        case .bold: return 4
        }
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: ManicatMetrics.space.s2) {
            ZStack(alignment: .bottom) {
                Canvas { context, _ in
                    for stroke in strokes {
                        let path = stroke.points.count > 1 ? ManicatChart.linePath(stroke.points, curve: .smooth) : Path { $0.addEllipse(in: CGRect(x: stroke.points[0].x - 0.5, y: stroke.points[0].y - 0.5, width: 1, height: 1)) }
                        context.stroke(path, with: .color(ink(stroke.color)), style: StrokeStyle(lineWidth: thickness(stroke.width), lineCap: .round, lineJoin: .round))
                    }
                }
                Rectangle().fill(tokens.borderStrong).frame(height: 1).padding(.horizontal, 24).padding(.bottom, 36).manicatStyle(styles.line)
                if strokes.isEmpty {
                    Text(hint).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted).padding(.bottom, 12).manicatStyle(styles.hint)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: height)
            .background(tokens.surface)
            .contentShape(Rectangle())
            .gesture(DragGesture(minimumDistance: 0)
                .onChanged { drag in
                    if drag.translation == .zero || strokes.isEmpty || strokes.last?.points.isEmpty == true {
                        commit(strokes + [ManicatInkStroke(id: "s-\(strokes.count)-\(Int(Date().timeIntervalSince1970 * 1000))", points: [drag.location], color: color, width: width)])
                    } else {
                        var next = strokes
                        next[next.count - 1].points.append(drag.location)
                        commit(next)
                    }
                })
            .clipShape(RoundedRectangle(cornerRadius: 26))
            .overlay(RoundedRectangle(cornerRadius: 26).stroke(tokens.border, lineWidth: 1))
            .manicatStyle(styles.surface)
            .accessibilityElement()
            .accessibilityLabel("Signature pad\(signer.map { " for \($0)" } ?? "")")
            HStack(spacing: ManicatMetrics.space.s3) {
                ForEach(ManicatInkColor.allCases, id: \.self) { name in
                    Button { color = name } label: {
                        Circle().fill(ink(name)).frame(width: 22, height: 22).overlay(Circle().stroke(color == name ? tokens.foreground : .clear, lineWidth: 2).padding(-3))
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("\(name.rawValue) ink")
                    .accessibilityAddTraits(color == name ? .isSelected : [])
                }
                ForEach(ManicatInkWidth.allCases, id: \.self) { name in
                    Button { width = name } label: {
                        RoundedRectangle(cornerRadius: 2).fill(tokens.foreground).frame(width: 18, height: thickness(name))
                            .frame(width: 28, height: 28)
                            .background(width == name ? tokens.surfaceMuted : .clear, in: Circle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("\(name.rawValue) pen")
                    .accessibilityAddTraits(width == name ? .isSelected : [])
                }
                Spacer(minLength: 0)
                action("Undo") { commit(Array(strokes.dropLast())) }
                action("Clear") { commit([]) }
            }
            if let signer { Text(signer).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted) }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func action(_ title: String, run: @escaping () -> Void) -> some View {
        Button(action: run) { Text(title).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textSecondary).manicatStyle(styles.action) }
            .buttonStyle(.plain)
            .disabled(strokes.isEmpty)
            .opacity(strokes.isEmpty ? 0.4 : 1)
    }

    private func commit(_ next: [ManicatInkStroke]) {
        strokes = next
        onChange?(next)
    }
}
