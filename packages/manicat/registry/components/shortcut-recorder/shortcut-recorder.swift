import SwiftUI

public struct ManicatShortcutBinding {
    public let shortcut: String
    public let label: String

    public init(shortcut: String, label: String) {
        self.shortcut = shortcut
        self.label = label
    }
}

private let manicatModifiers = ["mod", "ctrl", "alt", "shift", "meta"]
private let manicatSymbols = ["mod": "⌘", "ctrl": "⌃", "alt": "⌥", "shift": "⇧", "meta": "⌘", "enter": "↵", "escape": "esc", "space": "␣", "up": "↑", "down": "↓", "left": "←", "right": "→"]

/// "Cmd + K", "ctrl+shift+p" → "mod+k", "ctrl+shift+p": modifiers first in a fixed order, lowercase.
public func manicatNormalizeShortcut(_ text: String) -> String {
    let aliases = ["cmd": "mod", "command": "mod", "control": "ctrl", "option": "alt"]
    let parts = text.lowercased().split(whereSeparator: { "+- \t".contains($0) }).map { aliases[String($0)] ?? String($0) }
    let mods = manicatModifiers.filter { parts.contains($0) }
    let keys = parts.filter { !manicatModifiers.contains($0) }
    return (mods + keys.prefix(1)).joined(separator: "+")
}

/// Mirrors shortcut-recorder.tsx / shortcut-recorder.rn.tsx / shortcut-recorder.vue. Like the RN port it takes the shortcut as text
/// ("mod+k", "ctrl+shift+p") and shows it as key caps; use the web version where you want to capture real key presses.
public struct ManicatShortcutRecorder: View {
    public struct Styles {
        public var label: ManicatStyle = { $0 }
        public var field: ManicatStyle = { $0 }
        public var key: ManicatStyle = { $0 }
        public var input: ManicatStyle = { $0 }
        public var hint: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @Environment(\.isEnabled) private var enabled
    @State private var draft = ""
    @State private var problem: String?

    private let label: String
    @Binding private var value: String?
    private let resetValue: String??
    private let bindings: [ManicatShortcutBinding]
    private let requireModifier: Bool
    private let placeholder: String
    private let description: String?
    private let styles: Styles
    private let onValueChange: ((String?, ManicatShortcutBinding?) -> Void)?

    public init(_ label: String, value: Binding<String?>, resetValue: String?? = nil, bindings: [ManicatShortcutBinding] = [], requireModifier: Bool = true, placeholder: String = "e.g. mod+k", description: String? = nil, styles: Styles = Styles(), onValueChange: ((String?, ManicatShortcutBinding?) -> Void)? = nil) {
        self.label = label
        self._value = value
        self.resetValue = resetValue
        self.bindings = bindings
        self.requireModifier = requireModifier
        self.placeholder = placeholder
        self.description = description
        self.styles = styles
        self.onValueChange = onValueChange
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: ManicatMetrics.space.s2) {
            Text(label).font(.system(size: ManicatMetrics.textSm, weight: .medium)).foregroundStyle(tokens.foreground).manicatStyle(styles.label)
            HStack(spacing: ManicatMetrics.space.s2) {
                HStack(spacing: 4) {
                    ForEach((value ?? "").split(separator: "+").map(String.init), id: \.self) { part in
                        Text(manicatSymbols[part] ?? part.uppercased())
                            .font(.system(size: ManicatMetrics.textXs, weight: .semibold))
                            .foregroundStyle(tokens.foreground)
                            .padding(.horizontal, 6)
                            .frame(minWidth: 24, minHeight: 24)
                            .background(tokens.surfaceMuted, in: RoundedRectangle(cornerRadius: 6))
                            .overlay(RoundedRectangle(cornerRadius: 6).stroke(tokens.border, lineWidth: 1))
                            .manicatStyle(styles.key)
                    }
                }
                TextField("", text: $draft, prompt: Text(value == nil ? placeholder : "Change…").foregroundColor(tokens.textMuted))
                    .textFieldStyle(.plain)
                    .font(.system(size: ManicatMetrics.textSm))
                    .foregroundStyle(tokens.foreground)
                    .autocorrectionDisabled()
                    .onSubmit { commit() }
                    .accessibilityLabel(label)
                    .manicatStyle(styles.input)
                if let resetValue, value != resetValue {
                    Button { value = resetValue; onValueChange?(resetValue, nil) } label: {
                        Text("Reset").font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textSecondary)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Reset shortcut")
                }
            }
            .padding(.horizontal, ManicatMetrics.space.s3)
            .frame(minHeight: ManicatMetrics.controlHeight.md)
            .background(tokens.surface, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
            .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(problem == nil ? tokens.borderStrong : tokens.warning, lineWidth: 1))
            .manicatStyle(styles.field)
            if let problem {
                Text(problem).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.warning).manicatStyle(styles.hint).accessibilityAddTraits(.isStaticText)
            } else if let description {
                Text(description).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted).manicatStyle(styles.hint)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .opacity(enabled ? 1 : 0.5)
    }

    private func commit() {
        let next = manicatNormalizeShortcut(draft)
        draft = ""
        guard !next.isEmpty else { problem = nil; return }
        if requireModifier, !manicatModifiers.contains(where: { next.hasPrefix($0) }) {
            problem = "Add a modifier such as mod, ctrl or alt."
            return
        }
        let replaced = bindings.first { manicatNormalizeShortcut($0.shortcut) == next }
        problem = replaced.map { "Replaces \"\($0.label)\"." }
        value = next
        onValueChange?(next, replaced)
    }
}
