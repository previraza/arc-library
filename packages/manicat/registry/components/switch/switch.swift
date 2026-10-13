import SwiftUI

/// Mirrors switch.tsx / switch.rn.tsx / switch.vue: a 42 by 24 track, an 18 point thumb that travels 18 points, the same colours.
/// Built on `Toggle`, so VoiceOver, keyboard and Switch Control behave as they do for the system switch.
public struct ManicatSwitch: View {
    public struct Styles {
        public var track: ManicatStyle = { $0 }
        public var thumb: ManicatStyle = { $0 }
        public var label: ManicatStyle = { $0 }
        public init() {}
    }

    @Binding private var isOn: Bool
    private let label: String?
    private let styles: Styles

    public init(isOn: Binding<Bool>, label: String? = nil, styles: Styles = Styles()) {
        self._isOn = isOn
        self.label = label
        self.styles = styles
    }

    public var body: some View {
        Toggle(isOn: $isOn) { Text(label ?? "") }
            .toggleStyle(SwitchStyle(styles: styles))
            .fixedSize()
    }

    private struct SwitchStyle: ToggleStyle {
        let styles: Styles
        @Environment(\.manicat) private var tokens
        @Environment(\.isEnabled) private var enabled

        func makeBody(configuration: Configuration) -> some View {
            Button { configuration.isOn.toggle() } label: {
                HStack(spacing: ManicatMetrics.space.s3) {
                    track(on: configuration.isOn)
                    configuration.label
                        .font(.system(size: ManicatMetrics.textSm))
                        .foregroundStyle(tokens.foreground)
                        .manicatStyle(styles.label)
                }
                .frame(minHeight: ManicatMetrics.controlHeight.md)
                .opacity(enabled ? 1 : 0.5)
            }
            .buttonStyle(.plain)
        }

        private func track(on: Bool) -> some View {
            Capsule()
                .fill(on ? tokens.controlOn : tokens.controlTrack)
                .frame(width: 42, height: 24)
                .overlay(alignment: on ? .trailing : .leading) {
                    Circle()
                        .fill(on ? tokens.controlThumbOn : tokens.controlThumb)
                        .frame(width: 18, height: 18)
                        .shadow(color: .black.opacity(0.18), radius: 2, y: 1)
                        .manicatStyle(styles.thumb)
                        .padding(3)
                }
                .animation(.timingCurve(0.215, 0.61, 0.355, 1, duration: 0.22), value: on)
                .manicatStyle(styles.track)
        }
    }
}
