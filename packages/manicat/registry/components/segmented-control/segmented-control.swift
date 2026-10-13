import SwiftUI

public struct ManicatSegment: Identifiable {
    public var id: String { value }
    public let value: String
    public let label: String

    public init(value: String, label: String) {
        self.value = value
        self.label = label
    }
}

/// Mirrors segmented-control.tsx / segmented-control.rn.tsx / segmented-control.vue. Add content after a label with `accessory`.
public struct ManicatSegmentedControl: View {
    public struct Styles {
        public var track: ManicatStyle = { $0 }
        public var button: ManicatStyle = { $0 }
        public var selection: ManicatStyle = { $0 }
        public var text: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @Namespace private var selectionNamespace

    private let options: [ManicatSegment]
    @Binding private var value: String
    private let label: String?
    private let styles: Styles
    private var accessory: ((String) -> AnyView)?

    public init(options: [ManicatSegment], value: Binding<String>, label: String? = nil, styles: Styles = Styles()) {
        self.options = options
        self._value = value
        self.label = label
        self.styles = styles
    }

    /// Content after a segment's label, such as a badge. It receives the segment's value.
    public func accessory<V: View>(@ViewBuilder _ content: @escaping (String) -> V) -> Self {
        var copy = self
        copy.accessory = { AnyView(content($0)) }
        return copy
    }

    public var body: some View {
        HStack(spacing: ManicatMetrics.space.s1) {
            ForEach(options) { option in
                let selected = option.value == value
                Button { withAnimation(.timingCurve(0.215, 0.61, 0.355, 1, duration: 0.2)) { value = option.value } } label: {
                    HStack(spacing: 6) {
                        Text(option.label)
                            .font(.system(size: ManicatMetrics.textSm, weight: .medium))
                            .foregroundStyle(selected ? tokens.accentStrong : tokens.textSecondary)
                            .manicatStyle(styles.text)
                        accessory?(option.value)
                    }
                    .padding(.horizontal, ManicatMetrics.space.s3)
                    .frame(minHeight: ManicatMetrics.controlHeight.sm)
                    .background {
                        if selected {
                            RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl - 3)
                                .fill(tokens.surface)
                                .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl - 3).stroke(tokens.border, lineWidth: 1))
                                .matchedGeometryEffect(id: "selection", in: selectionNamespace)
                                .manicatStyle(styles.selection)
                        }
                    }
                    .manicatStyle(styles.button)
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(selected ? .isSelected : [])
            }
        }
        .padding(ManicatMetrics.space.s1)
        .background(tokens.surfaceMuted, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
        .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(tokens.border, lineWidth: 1))
        .manicatStyle(styles.track)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label ?? "")
    }
}
