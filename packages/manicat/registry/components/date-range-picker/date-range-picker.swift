import SwiftUI

public struct ManicatDateRange {
    public let start: Date
    public let end: Date

    public init(start: Date, end: Date) {
        self.start = start
        self.end = end
    }
}

public struct ManicatDateRangePreset: Identifiable {
    public var id: String { label }
    public let label: String
    public let range: (Date) -> ManicatDateRange

    public init(_ label: String, range: @escaping (Date) -> ManicatDateRange) {
        self.label = label
        self.range = range
    }
}

/// Mirrors date-range-picker.tsx / date-range-picker.rn.tsx / date-range-picker.vue: a field that opens a calendar with presets. Two
/// presses pick the range: the start, then the end.
public struct ManicatDateRangePicker: View {
    public struct Styles {
        public var label: ManicatStyle = { $0 }
        public var trigger: ManicatStyle = { $0 }
        public var valueText: ManicatStyle = { $0 }
        public var popover: ManicatStyle = { $0 }
        public var preset: ManicatStyle = { $0 }
        public init() {}
    }

    public static let defaultPresets: [ManicatDateRangePreset] = [
        ManicatDateRangePreset("Last 7 days") { today in ManicatDateRange(start: ManicatCalendarMath.addDays(Calendar.current.startOfDay(for: today), -6), end: Calendar.current.startOfDay(for: today)) },
        ManicatDateRangePreset("Last 30 days") { today in ManicatDateRange(start: ManicatCalendarMath.addDays(Calendar.current.startOfDay(for: today), -29), end: Calendar.current.startOfDay(for: today)) },
        ManicatDateRangePreset("This month") { today in ManicatDateRange(start: ManicatCalendarMath.startOfMonth(today), end: Calendar.current.startOfDay(for: today)) },
    ]

    @Environment(\.manicat) private var tokens
    @State private var open = false
    @State private var anchor: Date?
    @State private var hover: Date?
    @State private var month = ManicatCalendarMath.startOfMonth(Date())
    @State private var picked: Date?

    private let label: String
    @Binding private var range: ManicatDateRange?
    private let placeholder: String
    private let presets: [ManicatDateRangePreset]
    private let minDate: Date?
    private let maxDate: Date?
    private let weekStartsOn: Int
    private let locale: Locale
    private let styles: Styles

    public init(_ label: String = "Date range", range: Binding<ManicatDateRange?>, placeholder: String = "Select a range", presets: [ManicatDateRangePreset] = ManicatDateRangePicker.defaultPresets, minDate: Date? = nil, maxDate: Date? = nil, weekStartsOn: Int = 0, locale: Locale = Locale(identifier: "en_US"), styles: Styles = Styles()) {
        self.label = label
        self._range = range
        self.placeholder = placeholder
        self.presets = presets
        self.minDate = minDate
        self.maxDate = maxDate
        self.weekStartsOn = weekStartsOn
        self.locale = locale
        self.styles = styles
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: ManicatMetrics.space.s2) {
            Text(label).font(.system(size: ManicatMetrics.textSm, weight: .medium)).foregroundStyle(tokens.foreground).manicatStyle(styles.label)
            Button {
                month = ManicatCalendarMath.startOfMonth(range?.start ?? Date())
                open = true
            } label: {
                HStack {
                    Text(range.map { "\(short($0.start)) – \(short($0.end))" } ?? placeholder)
                        .font(.system(size: ManicatMetrics.textSm))
                        .foregroundStyle(range == nil ? tokens.textMuted : tokens.foreground)
                        .manicatStyle(styles.valueText)
                    Spacer(minLength: 0)
                    Text("▦").font(.system(size: 14)).foregroundStyle(tokens.textMuted)
                }
                .padding(.horizontal, ManicatMetrics.space.s3)
                .frame(minHeight: ManicatMetrics.controlHeight.md)
                .background(tokens.surface, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
                .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(tokens.borderStrong, lineWidth: 1))
                .manicatStyle(styles.trigger)
            }
            .buttonStyle(.plain)
            .accessibilityLabel(label)
            .popover(isPresented: $open) { panel }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var panel: some View {
        let preview: (start: Date, end: Date?)? = anchor.map { start in (start, hover.flatMap { $0 >= start ? $0 : nil } ?? start) } ?? range.map { ($0.start, $0.end) }

        return VStack(alignment: .leading, spacing: ManicatMetrics.space.s3) {
            ManicatFlowLayout(spacing: 6, lineSpacing: 6) {
                ForEach(presets) { preset in
                    Button { commit(preset.range(Date())) } label: {
                        Text(preset.label).font(.system(size: ManicatMetrics.textXs, weight: .medium)).foregroundStyle(tokens.foreground)
                            .padding(.horizontal, 10).padding(.vertical, 5)
                            .background(tokens.surfaceMuted, in: Capsule())
                            .manicatStyle(styles.preset)
                    }
                    .buttonStyle(.plain)
                }
            }
            Text(anchor == nil ? "Choose the start date" : "Choose the end date").font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted)
            ManicatCalendar(
                selection: Binding(get: { nil }, set: { picked in if let picked { pick(picked) } }),
                month: $month, minDate: minDate, maxDate: maxDate, locale: locale, weekStartsOn: weekStartsOn, range: preview, onHover: { hover = $0 }
            )
        }
        .padding(ManicatMetrics.space.s4)
        .frame(width: 340)
        .background(tokens.surface)
        .manicatStyle(styles.popover)
        .presentationCompactAdaptation(.popover)
    }

    private func short(_ date: Date) -> String { date.formatted(.dateTime.month(.abbreviated).day().year().locale(locale)) }

    private func commit(_ next: ManicatDateRange) {
        range = next
        anchor = nil
        hover = nil
        open = false
    }

    private func pick(_ date: Date) {
        guard let start = anchor else {
            anchor = date
            return
        }
        commit(date < start ? ManicatDateRange(start: date, end: start) : ManicatDateRange(start: start, end: date))
    }
}
