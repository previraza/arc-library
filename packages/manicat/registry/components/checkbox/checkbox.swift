import SwiftUI

public enum ManicatCheckedState { case unchecked, checked, indeterminate }

/// Mirrors checkbox.tsx / checkbox.rn.tsx / checkbox.vue. An indeterminate box resolves to checked when pressed, like the web version.
public struct ManicatCheckbox: View {
    public struct Styles {
        public var box: ManicatStyle = { $0 }
        public var mark: ManicatStyle = { $0 }
        public var label: ManicatStyle = { $0 }
        public var description: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @Environment(\.isEnabled) private var enabled

    @Binding private var state: ManicatCheckedState
    private let label: String?
    private let description: String?
    private let styles: Styles

    public init(state: Binding<ManicatCheckedState>, label: String? = nil, description: String? = nil, styles: Styles = Styles()) {
        self._state = state
        self.label = label
        self.description = description
        self.styles = styles
    }

    /// A plain on/off checkbox.
    public init(isOn: Binding<Bool>, label: String? = nil, description: String? = nil, styles: Styles = Styles()) {
        self.init(state: Binding(get: { isOn.wrappedValue ? .checked : .unchecked }, set: { isOn.wrappedValue = $0 == .checked }), label: label, description: description, styles: styles)
    }

    public var body: some View {
        let on = state != .unchecked

        Button { state = state == .checked ? .unchecked : .checked } label: {
            HStack(alignment: .top, spacing: 0) {
                // The square sits in a 44 point hit area, so the target is comfortable while the glyph stays small.
                RoundedRectangle(cornerRadius: 5)
                    .fill(on ? tokens.controlOn : tokens.surface)
                    .overlay(RoundedRectangle(cornerRadius: 5).stroke(on ? tokens.controlOn : tokens.borderStrong, lineWidth: 1))
                    .overlay {
                        if on {
                            Text(state == .indeterminate ? "–" : "✓")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundStyle(tokens.controlThumbOn)
                                .manicatStyle(styles.mark)
                        }
                    }
                    .frame(width: 18, height: 18)
                    .manicatStyle(styles.box)
                    .frame(width: ManicatMetrics.controlHeight.md, height: ManicatMetrics.controlHeight.md)
                if label != nil || description != nil {
                    VStack(alignment: .leading, spacing: 2) {
                        if let label {
                            Text(label).font(.system(size: ManicatMetrics.textSm, weight: .medium)).foregroundStyle(tokens.foreground).manicatStyle(styles.label)
                        }
                        if let description {
                            Text(description).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted).manicatStyle(styles.description)
                        }
                    }
                    .padding(.top, (ManicatMetrics.controlHeight.md - ManicatMetrics.textSm * 1.4) / 2)
                }
            }
            .opacity(enabled ? 1 : 0.5)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label ?? "")
        .accessibilityValue(state == .indeterminate ? "Mixed" : state == .checked ? "Checked" : "Unchecked")
        .accessibilityAddTraits(.isToggle)
    }
}
