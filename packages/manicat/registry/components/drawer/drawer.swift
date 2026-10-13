import SwiftUI

public enum ManicatDrawerSide { case left, right, top, bottom }

public struct ManicatDrawerStyles {
    public var overlay: ManicatStyle = { $0 }
    public var panel: ManicatStyle = { $0 }
    public var title: ManicatStyle = { $0 }
    public var description: ManicatStyle = { $0 }
    public var body: ManicatStyle = { $0 }
    public init() {}
}

public extension View {
    /// Mirrors drawer.tsx / drawer.rn.tsx / drawer.vue: a panel that slides in from an edge over a dimmed screen. Apply it to the
    /// screen (or any view that fills it), and flip `isPresented` from a button.
    func manicatDrawer<Content: View>(isPresented: Binding<Bool>, title: String, description: String? = nil, side: ManicatDrawerSide = .right, styles: ManicatDrawerStyles = ManicatDrawerStyles(), @ViewBuilder content: @escaping () -> Content) -> some View {
        modifier(ManicatDrawerModifier(isPresented: isPresented, title: title, description: description, side: side, styles: styles, drawerContent: content))
    }
}

struct ManicatDrawerModifier<DrawerContent: View>: ViewModifier {
    @Environment(\.manicat) private var tokens

    @Binding var isPresented: Bool
    let title: String
    let description: String?
    let side: ManicatDrawerSide
    let styles: ManicatDrawerStyles
    let drawerContent: () -> DrawerContent

    func body(content: Content) -> some View {
        content.overlay {
            ZStack(alignment: alignment) {
                if isPresented {
                    Color.black.opacity(0.4)
                        .ignoresSafeArea()
                        .manicatStyle(styles.overlay)
                        .onTapGesture { isPresented = false }
                        .transition(.opacity)
                    panel
                        .transition(.move(edge: edge))
                        .accessibilityAddTraits(.isModal)
                }
            }
            .animation(.timingCurve(0.215, 0.61, 0.355, 1, duration: 0.3), value: isPresented)
        }
    }

    private var panel: some View {
        VStack(alignment: .leading, spacing: ManicatMetrics.space.s4) {
            HStack(alignment: .top, spacing: ManicatMetrics.space.s3) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(title).font(.system(size: ManicatMetrics.textLg, weight: .medium)).foregroundStyle(tokens.foreground).manicatStyle(styles.title)
                    if let description {
                        Text(description).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.textSecondary).manicatStyle(styles.description)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                Button { isPresented = false } label: {
                    Text("×").font(.system(size: 18)).foregroundStyle(tokens.textSecondary).frame(width: 32, height: 32)
                        .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(tokens.border, lineWidth: 1))
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Close")
            }
            VStack(alignment: .leading, spacing: ManicatMetrics.space.s3) { drawerContent() }
                .font(.system(size: ManicatMetrics.textSm))
                .foregroundStyle(tokens.textSecondary)
                .manicatStyle(styles.body)
            if side == .left || side == .right { Spacer(minLength: 0) }
        }
        .padding(ManicatMetrics.space.s5)
        .frame(maxWidth: side == .top || side == .bottom ? .infinity : 340, maxHeight: side == .left || side == .right ? .infinity : nil, alignment: .topLeading)
        .background(tokens.surface)
        .overlay(alignment: edgeAlignment) { Rectangle().fill(tokens.border).frame(width: side == .left || side == .right ? 1 : nil, height: side == .top || side == .bottom ? 1 : nil) }
        .manicatStyle(styles.panel)
    }

    private var alignment: Alignment {
        switch side { case .left: return .leading; case .right: return .trailing; case .top: return .top; case .bottom: return .bottom }
    }

    private var edgeAlignment: Alignment {
        switch side { case .left: return .trailing; case .right: return .leading; case .top: return .bottom; case .bottom: return .top }
    }

    private var edge: Edge {
        switch side { case .left: return .leading; case .right: return .trailing; case .top: return .top; case .bottom: return .bottom }
    }
}
