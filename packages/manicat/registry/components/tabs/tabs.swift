import SwiftUI

public struct ManicatTab: Identifiable {
    public var id: String { value }
    public let value: String
    public let label: String
    public let disabled: Bool
    public let content: AnyView

    public init<Content: View>(value: String, label: String, disabled: Bool = false, @ViewBuilder content: () -> Content) {
        self.value = value
        self.label = label
        self.disabled = disabled
        self.content = AnyView(content())
    }
}

/// Mirrors tabs.tsx / tabs.rn.tsx / tabs.vue: a tab list over the panel of the selected tab.
public struct ManicatTabs: View {
    public struct Styles {
        public var list: ManicatStyle = { $0 }
        public var trigger: ManicatStyle = { $0 }
        public var selection: ManicatStyle = { $0 }
        public var label: ManicatStyle = { $0 }
        public var content: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @Namespace private var selectionNamespace

    private let items: [ManicatTab]
    @Binding private var value: String
    private let styles: Styles

    public init(items: [ManicatTab], value: Binding<String>, styles: Styles = Styles()) {
        self.items = items
        self._value = value
        self.styles = styles
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: ManicatMetrics.space.s1) {
                    ForEach(items) { item in
                        let selected = item.value == value
                        Button { withAnimation(.timingCurve(0.215, 0.61, 0.355, 1, duration: 0.2)) { value = item.value } } label: {
                            Text(item.label)
                                .font(.system(size: ManicatMetrics.textSm, weight: .medium))
                                .foregroundStyle(selected ? tokens.accentStrong : tokens.textSecondary)
                                .manicatStyle(styles.label)
                                .padding(.horizontal, ManicatMetrics.space.s3)
                                .frame(minWidth: 88, minHeight: ManicatMetrics.controlHeight.sm)
                                .background {
                                    if selected {
                                        RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl - 3)
                                            .fill(tokens.surface)
                                            .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl - 3).stroke(tokens.border, lineWidth: 1))
                                            .matchedGeometryEffect(id: "selection", in: selectionNamespace)
                                            .manicatStyle(styles.selection)
                                    }
                                }
                                .manicatStyle(styles.trigger)
                        }
                        .buttonStyle(.plain)
                        .disabled(item.disabled)
                        .opacity(item.disabled ? 0.45 : 1)
                        .accessibilityAddTraits(selected ? .isSelected : [])
                    }
                }
                .padding(ManicatMetrics.space.s1)
                .background(tokens.surfaceMuted, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
                .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(tokens.border, lineWidth: 1))
                .manicatStyle(styles.list)
            }
            if let current = items.first(where: { $0.value == value }) ?? items.first {
                current.content
                    .font(.system(size: ManicatMetrics.textSm))
                    .foregroundStyle(tokens.textSecondary)
                    .padding(.top, ManicatMetrics.space.s4)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .manicatStyle(styles.content)
            }
        }
    }
}
