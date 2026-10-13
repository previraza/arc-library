import SwiftUI

/// Mirrors toast.tsx / toast.rn.tsx / toast.vue: a small notice that rises in, closes itself after `duration`, and sinks out.
/// It draws only the toast, so place it where you want it: `.overlay(alignment: .bottom) { ManicatToast(...) }`, or use the
/// `manicatToast` modifier, which does that for you.
public struct ManicatToast: View {
    public struct Styles {
        public var root: ManicatStyle = { $0 }
        public var title: ManicatStyle = { $0 }
        public var description: ManicatStyle = { $0 }
        public var close: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens

    @Binding private var isPresented: Bool
    private let title: String
    private let description: String?
    private let duration: Double
    private let styles: Styles

    public init(isPresented: Binding<Bool>, title: String, description: String? = nil, duration: Double = 4.5, styles: Styles = Styles()) {
        self._isPresented = isPresented
        self.title = title
        self.description = description
        self.duration = duration
        self.styles = styles
    }

    public var body: some View {
        ZStack {
            if isPresented {
                HStack(spacing: ManicatMetrics.space.s3) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(title).font(.system(size: ManicatMetrics.textSm, weight: .medium)).foregroundStyle(tokens.foreground).manicatStyle(styles.title)
                        if let description {
                            Text(description).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textSecondary).manicatStyle(styles.description)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    Button { isPresented = false } label: {
                        Text("×").font(.system(size: 18)).foregroundStyle(tokens.textMuted).manicatStyle(styles.close)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Dismiss")
                }
                .padding(ManicatMetrics.space.s4)
                .background(tokens.surface, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
                .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(tokens.border, lineWidth: 1))
                .shadow(color: .black.opacity(0.12), radius: 16, y: 6)
                .manicatStyle(styles.root)
                .padding(ManicatMetrics.space.s4)
                .transition(.asymmetric(
                    insertion: .opacity.combined(with: .offset(y: 16)).animation(.timingCurve(0.215, 0.61, 0.355, 1, duration: 0.28)),
                    removal: .opacity.combined(with: .offset(y: 16)).animation(.easeIn(duration: 0.16))
                ))
                .accessibilityAddTraits(.updatesFrequently)
                .task(id: isPresented) {
                    guard duration > 0 else { return }
                    try? await Task.sleep(nanoseconds: UInt64(duration * 1_000_000_000))
                    if !Task.isCancelled { withAnimation { isPresented = false } }
                }
            }
        }
        .animation(.default, value: isPresented)
    }
}

public extension View {
    /// Floats a toast over the bottom edge of this view.
    func manicatToast(isPresented: Binding<Bool>, title: String, description: String? = nil, duration: Double = 4.5) -> some View {
        overlay(alignment: .bottom) { ManicatToast(isPresented: isPresented, title: title, description: description, duration: duration) }
    }
}
