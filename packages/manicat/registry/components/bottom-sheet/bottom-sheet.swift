import SwiftUI

public struct ManicatBottomSheetStyles {
    public var sheet: ManicatStyle = { $0 }
    public var handle: ManicatStyle = { $0 }
    public var title: ManicatStyle = { $0 }
    public var description: ManicatStyle = { $0 }
    public var body: ManicatStyle = { $0 }
    public init() {}
}

public extension View {
    /// Mirrors bottom-sheet.tsx / bottom-sheet.rn.tsx / bottom-sheet.vue. It is the system sheet, so it has the platform's
    /// detents, drag indicator and dismissal.
    func manicatBottomSheet<Content: View>(isPresented: Binding<Bool>, title: String, description: String? = nil, styles: ManicatBottomSheetStyles = ManicatBottomSheetStyles(), @ViewBuilder content: @escaping () -> Content) -> some View {
        sheet(isPresented: isPresented) {
            ManicatBottomSheetBody(title: title, description: description, styles: styles, content: content)
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.visible)
                .presentationCornerRadius(28)
        }
    }
}

struct ManicatBottomSheetBody<Content: View>: View {
    @Environment(\.manicat) private var tokens

    let title: String
    let description: String?
    let styles: ManicatBottomSheetStyles
    let content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: ManicatMetrics.space.s3) {
            VStack(alignment: .leading, spacing: 4) {
                Text(title).font(.system(size: ManicatMetrics.textLg, weight: .medium)).foregroundStyle(tokens.foreground).manicatStyle(styles.title)
                if let description {
                    Text(description).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.textSecondary).manicatStyle(styles.description)
                }
            }
            VStack(alignment: .leading, spacing: ManicatMetrics.space.s3) { content() }
                .font(.system(size: ManicatMetrics.textSm))
                .foregroundStyle(tokens.textSecondary)
                .manicatStyle(styles.body)
            Spacer(minLength: 0)
        }
        .padding(.horizontal, ManicatMetrics.space.s5)
        .padding(.top, ManicatMetrics.space.s5)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(tokens.surface)
        .manicatStyle(styles.sheet)
    }
}
