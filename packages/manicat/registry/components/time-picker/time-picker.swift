import SwiftUI

/// Mirrors time-picker.tsx / time-picker.rn.tsx / time-picker.vue: a field that opens a list of times in steps of `minuteStep`.
/// The value is "HH:MM" in 24 hour form.
public struct ManicatTimePicker: View {
    public enum Format { case twelveHour, twentyFourHour }

    public struct Styles {
        public var label: ManicatStyle = { $0 }
        public var trigger: ManicatStyle = { $0 }
        public var valueText: ManicatStyle = { $0 }
        public var menu: ManicatStyle = { $0 }
        public var option: ManicatStyle = { $0 }
        public var hint: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @Environment(\.isEnabled) private var enabled
    @State private var open = false

    private let label: String
    @Binding private var time: String
    private let description: String?
    private let minuteStep: Int
    private let format: Format
    private let styles: Styles

    public init(_ label: String, time: Binding<String>, description: String? = nil, minuteStep: Int = 15, format: Format = .twelveHour, styles: Styles = Styles()) {
        self.label = label
        self._time = time
        self.description = description
        self.minuteStep = minuteStep
        self.format = format
        self.styles = styles
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: ManicatMetrics.space.s2) {
            Text(label).font(.system(size: ManicatMetrics.textSm, weight: .medium)).foregroundStyle(tokens.foreground).manicatStyle(styles.label)
            Button { open = true } label: {
                HStack {
                    Text(display(time)).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.foreground).manicatStyle(styles.valueText)
                    Spacer(minLength: 0)
                    Text("⌄").font(.system(size: 14)).foregroundStyle(tokens.textMuted)
                }
                .padding(.horizontal, ManicatMetrics.space.s3)
                .frame(minHeight: ManicatMetrics.controlHeight.md)
                .background(tokens.surface, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
                .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(tokens.borderStrong, lineWidth: 1))
                .opacity(enabled ? 1 : 0.5)
                .manicatStyle(styles.trigger)
            }
            .buttonStyle(.plain)
            .accessibilityLabel(label)
            .accessibilityValue(display(time))
            .popover(isPresented: $open) { menu }
            if let description {
                Text(description).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted).manicatStyle(styles.hint)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var times: [String] {
        (0..<(24 * 60 / minuteStep)).map { index in
            let minutes = index * minuteStep
            return String(format: "%02d:%02d", minutes / 60, minutes % 60)
        }
    }

    private var menu: some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(spacing: 0) {
                    ForEach(times, id: \.self) { entry in
                        Button { time = entry; open = false } label: {
                            HStack {
                                Text(display(entry)).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.foreground)
                                Spacer(minLength: 0)
                                if entry == time { Text("✓").foregroundStyle(tokens.foreground) }
                            }
                            .padding(.horizontal, ManicatMetrics.space.s4)
                            .frame(height: 44)
                            .background(entry == time ? tokens.surfaceMuted : .clear, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl - 4))
                            .manicatStyle(styles.option)
                        }
                        .buttonStyle(.plain)
                        .id(entry)
                        .accessibilityAddTraits(entry == time ? .isSelected : [])
                    }
                }
                .padding(6)
            }
            .onAppear { proxy.scrollTo(time, anchor: .center) }
        }
        .frame(minWidth: 220, maxHeight: 380)
        .background(tokens.surface)
        .manicatStyle(styles.menu)
        .presentationCompactAdaptation(.popover)
    }

    private func display(_ value: String) -> String {
        let parts = value.split(separator: ":").compactMap { Int($0) }
        guard parts.count == 2 else { return value }
        if format == .twentyFourHour { return String(format: "%02d:%02d", parts[0], parts[1]) }
        return String(format: "%d:%02d %@", parts[0] % 12 == 0 ? 12 : parts[0] % 12, parts[1], parts[0] < 12 ? "AM" : "PM")
    }
}
