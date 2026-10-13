import SwiftUI

public struct ManicatColorSwatch: Identifiable {
    public var id: String { color }
    public let color: String

    public init(_ color: String) { self.color = color }
}

/// Mirrors color-picker.tsx / color-picker.rn.tsx / color-picker.vue: a hex field and a row of swatches. For a free-form picker,
/// pair it with the system `ColorPicker`.
public struct ManicatColorPicker: View {
    public struct Styles {
        public var label: ManicatStyle = { $0 }
        public var preview: ManicatStyle = { $0 }
        public var input: ManicatStyle = { $0 }
        public var swatches: ManicatStyle = { $0 }
        public var swatch: ManicatStyle = { $0 }
        public init() {}
    }

    public static let defaultSwatches = ["#7747ff", "#2563eb", "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#ec4899", "#111111"].map(ManicatColorSwatch.init)

    @Environment(\.manicat) private var tokens
    @State private var draft: String?

    @Binding private var hex: String
    private let label: String
    private let swatches: [ManicatColorSwatch]
    private let styles: Styles

    public init(hex: Binding<String>, label: String = "Colour", swatches: [ManicatColorSwatch] = ManicatColorPicker.defaultSwatches, styles: Styles = Styles()) {
        self._hex = hex
        self.label = label
        self.swatches = swatches
        self.styles = styles
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: ManicatMetrics.space.s2) {
            Text(label).font(.system(size: ManicatMetrics.textSm, weight: .medium)).foregroundStyle(tokens.foreground).manicatStyle(styles.label)
            HStack(spacing: ManicatMetrics.space.s3) {
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color(hex: hex))
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(tokens.border, lineWidth: 1))
                    .frame(width: ManicatMetrics.controlHeight.md, height: ManicatMetrics.controlHeight.md)
                    .accessibilityLabel("Selected colour \(hex)")
                    .manicatStyle(styles.preview)
                TextField("", text: Binding(get: { draft ?? hex }, set: { text in
                    draft = text
                    if let normal = Self.normalise(text) { hex = normal }
                }))
                .textFieldStyle(.plain)
                .autocorrectionDisabled()
                .font(.system(size: ManicatMetrics.textSm, design: .monospaced))
                .foregroundStyle(tokens.foreground)
                .padding(.horizontal, ManicatMetrics.space.s3)
                .frame(minHeight: ManicatMetrics.controlHeight.md)
                .background(tokens.surface, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
                .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(tokens.borderStrong, lineWidth: 1))
                .accessibilityLabel("\(label) hex value")
                .onSubmit { draft = nil }
                .manicatStyle(styles.input)
            }
            ManicatFlowLayout(spacing: ManicatMetrics.space.s2, lineSpacing: ManicatMetrics.space.s2) {
                ForEach(swatches) { swatch in
                    let selected = swatch.color.lowercased() == hex.lowercased()
                    Button { hex = swatch.color; draft = nil } label: {
                        Circle()
                            .fill(Color(hex: swatch.color))
                            .overlay(Circle().stroke(selected ? tokens.foreground : tokens.border, lineWidth: selected ? 2 : 1))
                            .frame(width: 28, height: 28)
                            .manicatStyle(styles.swatch)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(swatch.color)
                    .accessibilityAddTraits(selected ? .isSelected : [])
                }
            }
            .manicatStyle(styles.swatches)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    /// "#abc", "abc" and "#AABBCC" all become "#aabbcc"; anything else is not a colour yet.
    static func normalise(_ text: String) -> String? {
        let digits = text.trimmingCharacters(in: .whitespaces).trimmingCharacters(in: CharacterSet(charactersIn: "#")).lowercased()
        let hexDigits = CharacterSet(charactersIn: "0123456789abcdef")
        guard digits.unicodeScalars.allSatisfy({ hexDigits.contains($0) }) else { return nil }
        if digits.count == 6 { return "#\(digits)" }
        if digits.count == 3 { return "#" + digits.map { "\($0)\($0)" }.joined() }
        return nil
    }
}
