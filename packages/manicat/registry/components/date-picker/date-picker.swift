import SwiftUI

/// Mirrors date-picker.tsx / date-picker.rn.tsx / date-picker.vue: a field that opens a calendar. Pressing the chosen day again
/// clears it.
public struct ManicatDatePicker: View {
    public struct Styles {
        public var label: ManicatStyle = { $0 }
        public var trigger: ManicatStyle = { $0 }
        public var valueText: ManicatStyle = { $0 }
        public var popover: ManicatStyle = { $0 }
        public var hint: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @Environment(\.isEnabled) private var enabled
    @State private var open = false
    @State private var month = Date()

    private let label: String
    @Binding private var date: Date?
    private let description: String?
    private let placeholder: String
    private let minDate: Date?
    private let maxDate: Date?
    private let disabledDates: ((Date) -> Bool)?
    private let locale: Locale
    private let showToday: Bool
    private let styles: Styles

    public init(_ label: String, date: Binding<Date?>, description: String? = nil, placeholder: String = "Select a date", minDate: Date? = nil, maxDate: Date? = nil, disabledDates: ((Date) -> Bool)? = nil, locale: Locale = Locale(identifier: "en_US"), showToday: Bool = true, styles: Styles = Styles()) {
        self.label = label
        self._date = date
        self.description = description
        self.placeholder = placeholder
        self.minDate = minDate
        self.maxDate = maxDate
        self.disabledDates = disabledDates
        self.locale = locale
        self.showToday = showToday
        self.styles = styles
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: ManicatMetrics.space.s2) {
            Text(label).font(.system(size: ManicatMetrics.textSm, weight: .medium)).foregroundStyle(tokens.foreground).manicatStyle(styles.label)
            Button {
                month = ManicatCalendarMath.startOfMonth(date ?? Date())
                open = true
            } label: {
                HStack {
                    Text(date.map { $0.formatted(.dateTime.month(.abbreviated).day().year().locale(locale)) } ?? placeholder)
                        .font(.system(size: ManicatMetrics.textSm))
                        .foregroundStyle(date == nil ? tokens.textMuted : tokens.foreground)
                        .manicatStyle(styles.valueText)
                    Spacer(minLength: 0)
                    Text("▦").font(.system(size: 14)).foregroundStyle(tokens.textMuted)
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
            .accessibilityValue(date.map { $0.formatted(date: .long, time: .omitted) } ?? placeholder)
            .popover(isPresented: $open) {
                ManicatCalendar(
                    selection: Binding(get: { date }, set: { picked in
                        date = picked.flatMap { ManicatCalendarMath.sameDay($0, date) ? nil : $0 }
                        open = false
                    }),
                    month: $month, minDate: minDate, maxDate: maxDate, disabledDates: disabledDates, locale: locale, showToday: showToday
                )
                .padding(ManicatMetrics.space.s4)
                .frame(width: 340)
                .background(tokens.surface)
                .manicatStyle(styles.popover)
                .presentationCompactAdaptation(.popover)
            }
            if let description {
                Text(description).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted).manicatStyle(styles.hint)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
