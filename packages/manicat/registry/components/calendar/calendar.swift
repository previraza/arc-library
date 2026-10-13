import SwiftUI

/// Date helpers for the calendar family (calendar, date picker, date range picker). A month is always laid out as six weeks, so
/// the grid never changes height between months.
public enum ManicatCalendarMath {
    public static func calendar(weekStartsOn: Int = 0, locale: Locale = Locale(identifier: "en_US")) -> Calendar {
        var calendar = Calendar(identifier: .gregorian)
        calendar.locale = locale
        calendar.firstWeekday = weekStartsOn == 1 ? 2 : 1
        return calendar
    }

    public static func startOfMonth(_ date: Date, calendar: Calendar = calendar()) -> Date {
        calendar.date(from: calendar.dateComponents([.year, .month], from: date)) ?? date
    }

    public static func addMonths(_ date: Date, _ count: Int, calendar: Calendar = calendar()) -> Date {
        calendar.date(byAdding: .month, value: count, to: startOfMonth(date, calendar: calendar)) ?? date
    }

    public static func addDays(_ date: Date, _ count: Int, calendar: Calendar = calendar()) -> Date {
        calendar.date(byAdding: .day, value: count, to: date) ?? date
    }

    public static func sameDay(_ a: Date?, _ b: Date?, calendar: Calendar = calendar()) -> Bool {
        guard let a, let b else { return false }
        return calendar.isDate(a, inSameDayAs: b)
    }

    /// The 42 days shown for a month, starting on the calendar's first weekday.
    public static func monthGrid(_ month: Date, calendar: Calendar = calendar()) -> [Date] {
        let first = startOfMonth(month, calendar: calendar)
        let offset = (calendar.component(.weekday, from: first) - calendar.firstWeekday + 7) % 7
        return (0..<42).map { addDays(first, $0 - offset, calendar: calendar) }
    }

    public static func weekdayLabels(calendar: Calendar = calendar()) -> [String] {
        let symbols = calendar.shortWeekdaySymbols
        return (0..<7).map { symbols[(calendar.firstWeekday - 1 + $0) % 7] }
    }

    public static func monthLabel(_ month: Date, calendar: Calendar = calendar()) -> String {
        let formatter = DateFormatter()
        formatter.calendar = calendar
        formatter.locale = calendar.locale
        formatter.dateFormat = "LLLL yyyy"
        return formatter.string(from: month)
    }
}

/// Mirrors calendar.tsx / calendar.rn.tsx / calendar.vue: a month grid with previous and next, today, a selected day and an
/// optional range. Days can be limited with `minDate`, `maxDate` and `disabledDates`.
public struct ManicatCalendar: View {
    public struct Styles {
        public var header: ManicatStyle = { $0 }
        public var title: ManicatStyle = { $0 }
        public var nav: ManicatStyle = { $0 }
        public var weekday: ManicatStyle = { $0 }
        public var day: ManicatStyle = { $0 }
        public var dayText: ManicatStyle = { $0 }
        public var selected: ManicatStyle = { $0 }
        public var today: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens

    @Binding private var selection: Date?
    @Binding private var month: Date
    private let minDate: Date?
    private let maxDate: Date?
    private let disabledDates: ((Date) -> Bool)?
    private let locale: Locale
    private let weekStartsOn: Int
    private let showToday: Bool
    private let range: (start: Date, end: Date?)?
    private let onHover: ((Date) -> Void)?
    private let styles: Styles

    public init(selection: Binding<Date?>, month: Binding<Date>, minDate: Date? = nil, maxDate: Date? = nil, disabledDates: ((Date) -> Bool)? = nil, locale: Locale = Locale(identifier: "en_US"), weekStartsOn: Int = 0, showToday: Bool = true, range: (start: Date, end: Date?)? = nil, onHover: ((Date) -> Void)? = nil, styles: Styles = Styles()) {
        self._selection = selection
        self._month = month
        self.minDate = minDate
        self.maxDate = maxDate
        self.disabledDates = disabledDates
        self.locale = locale
        self.weekStartsOn = weekStartsOn
        self.showToday = showToday
        self.range = range
        self.onHover = onHover
        self.styles = styles
    }

    public var body: some View {
        let calendar = ManicatCalendarMath.calendar(weekStartsOn: weekStartsOn, locale: locale)
        let days = ManicatCalendarMath.monthGrid(month, calendar: calendar)
        let today = Date()

        VStack(spacing: 0) {
            HStack {
                navButton("‹", label: "Previous month") { month = ManicatCalendarMath.addMonths(month, -1, calendar: calendar) }
                Spacer(minLength: 0)
                Text(ManicatCalendarMath.monthLabel(month, calendar: calendar))
                    .font(.system(size: ManicatMetrics.textSm, weight: .semibold))
                    .foregroundStyle(tokens.foreground)
                    .manicatStyle(styles.title)
                    .accessibilityAddTraits(.isHeader)
                Spacer(minLength: 0)
                navButton("›", label: "Next month") { month = ManicatCalendarMath.addMonths(month, 1, calendar: calendar) }
            }
            .padding(.bottom, ManicatMetrics.space.s2)
            .manicatStyle(styles.header)
            HStack(spacing: 0) {
                ForEach(Array(ManicatCalendarMath.weekdayLabels(calendar: calendar).enumerated()), id: \.offset) { _, label in
                    Text(String(label.prefix(2)))
                        .font(.system(size: ManicatMetrics.textXs))
                        .foregroundStyle(tokens.textMuted)
                        .manicatStyle(styles.weekday)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 6)
                }
            }
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 0), count: 7), spacing: 0) {
                ForEach(days, id: \.self) { date in
                    dayCell(date, calendar: calendar, today: today)
                }
            }
        }
        .frame(maxWidth: .infinity)
    }

    private func navButton(_ glyph: String, label: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(glyph).font(.system(size: 18)).foregroundStyle(tokens.textSecondary).frame(width: 32, height: 32).manicatStyle(styles.nav)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label)
    }

    @ViewBuilder private func dayCell(_ date: Date, calendar: Calendar, today: Date) -> some View {
        let outside = !calendar.isDate(date, equalTo: month, toGranularity: .month)
        let off = isOff(date, calendar: calendar)
        let selected = ManicatCalendarMath.sameDay(date, selection, calendar: calendar) || ManicatCalendarMath.sameDay(date, range?.start, calendar: calendar) || ManicatCalendarMath.sameDay(date, range?.end, calendar: calendar)
        let isToday = showToday && ManicatCalendarMath.sameDay(date, today, calendar: calendar)
        let inRange = range.map { range in range.end.map { date >= range.start && date <= $0 } ?? false } ?? false

        Button { selection = date } label: {
            Text("\(calendar.component(.day, from: date))")
                .font(.system(size: ManicatMetrics.textSm)).monospacedDigit()
                .foregroundStyle(selected ? tokens.controlThumbOn : outside ? tokens.textMuted : tokens.foreground)
                .opacity(off ? 0.4 : 1)
                .manicatStyle(styles.dayText)
                .frame(maxWidth: .infinity)
                .aspectRatio(1, contentMode: .fit)
                .background(selected ? tokens.controlOn : inRange ? tokens.surfaceMuted : .clear, in: Circle())
                .overlay(Circle().stroke(isToday && !selected ? tokens.borderStrong : .clear, lineWidth: 1))
                .manicatStyle(styles.day)
                .manicatStyle(selected ? styles.selected : { $0 })
                .manicatStyle(isToday ? styles.today : { $0 })
        }
        .buttonStyle(.plain)
        .disabled(off)
        .accessibilityLabel(date.formatted(date: .complete, time: .omitted))
        .accessibilityAddTraits(selected ? .isSelected : [])
        .onHover { inside in if inside { onHover?(date) } }
    }

    private func isOff(_ date: Date, calendar: Calendar) -> Bool {
        if let minDate, calendar.startOfDay(for: date) < calendar.startOfDay(for: minDate) { return true }
        if let maxDate, calendar.startOfDay(for: date) > calendar.startOfDay(for: maxDate) { return true }
        return disabledDates?(date) ?? false
    }
}
