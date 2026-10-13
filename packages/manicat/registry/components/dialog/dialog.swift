import SwiftUI

/// Mirrors dialog.tsx / dialog.rn.tsx / dialog.vue: a centred modal over a dimmed screen. It is a modifier, like `.sheet`: apply
/// it to the screen (or any view that fills it), not to the button, and flip `isPresented` from the button.
public struct ManicatDialogStyles {
    public var overlay: ManicatStyle = { $0 }
    public var content: ManicatStyle = { $0 }
    public var header: ManicatStyle = { $0 }
    public var title: ManicatStyle = { $0 }
    public var description: ManicatStyle = { $0 }
    public var close: ManicatStyle = { $0 }
    public var body: ManicatStyle = { $0 }
    public init() {}
}

public extension View {
    func manicatDialog<Content: View>(isPresented: Binding<Bool>, title: String, description: String? = nil, styles: ManicatDialogStyles = ManicatDialogStyles(), @ViewBuilder content: @escaping () -> Content) -> some View {
        modifier(ManicatDialogModifier(isPresented: isPresented, title: title, description: description, styles: styles, dialogContent: content))
    }
}

struct ManicatDialogModifier<DialogContent: View>: ViewModifier {
    @Environment(\.manicat) private var tokens

    @Binding var isPresented: Bool
    let title: String
    let description: String?
    let styles: ManicatDialogStyles
    let dialogContent: () -> DialogContent

    func body(content: Content) -> some View {
        content.overlay {
            ZStack {
                if isPresented {
                    scrim
                    card
                }
            }
            .animation(.timingCurve(0.215, 0.61, 0.355, 1, duration: 0.22), value: isPresented)
        }
    }

    private var scrim: some View {
        Color.black.opacity(0.46)
            .ignoresSafeArea()
            .manicatStyle(styles.overlay)
            .onTapGesture { isPresented = false }
            .transition(.opacity)
    }

    private var card: some View {
        VStack(spacing: 0) {
            header
            dialogContent()
                .font(.system(size: ManicatMetrics.textSm))
                .foregroundStyle(tokens.textSecondary)
                .padding(ManicatMetrics.space.s5)
                .frame(maxWidth: .infinity, alignment: .leading)
                .manicatStyle(styles.body)
        }
        .frame(maxWidth: 440)
        .background(tokens.surface, in: RoundedRectangle(cornerRadius: 26))
        .overlay(RoundedRectangle(cornerRadius: 26).stroke(tokens.border, lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: 26))
        .manicatStyle(styles.content)
        .padding(ManicatMetrics.space.s5)
        .transition(.opacity.combined(with: .scale(scale: 0.96)))
        .accessibilityAddTraits(.isModal)
    }

    private var header: some View {
        HStack(alignment: .top, spacing: ManicatMetrics.space.s5) {
            VStack(alignment: .leading, spacing: ManicatMetrics.space.s2) {
                Text(title).font(.system(size: ManicatMetrics.textLg, weight: .medium)).foregroundStyle(tokens.foreground).manicatStyle(styles.title)
                if let description {
                    Text(description).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.textSecondary).manicatStyle(styles.description)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            Button { isPresented = false } label: {
                Text("×").font(.system(size: 18)).foregroundStyle(tokens.textSecondary)
                    .frame(width: 32, height: 32)
                    .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(tokens.border, lineWidth: 1))
                    .manicatStyle(styles.close)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Close")
        }
        .padding(ManicatMetrics.space.s5)
        .overlay(alignment: .bottom) { Rectangle().fill(tokens.border).frame(height: 1) }
        .manicatStyle(styles.header)
    }
}
