import SwiftUI

public struct ManicatActivityDay: Identifiable {
    public var id: String { date }
    /// ISO date, "2026-05-04".
    public let date: String
    public let count: Int

    public init(date: String, count: Int) {
        self.date = date
        self.count = count
    }
}

/// Mirrors activity-heatmap.tsx / activity-heatmap.rn.tsx / activity-heatmap.vue: weeks run left to right, days top to bottom, like
/// a contribution graph.
public struct ManicatActivityHeatmap: View {
    public struct Styles {
        public var readout: ManicatStyle = { $0 }
        public var cell: ManicatStyle = { $0 }
        public var legend: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @State private var hover: ManicatActivityDay?

    private let days: [ManicatActivityDay]
    private let label: String
    private let period: String
    private let unit: (one: String, other: String)
    private let thresholds: (Int, Int, Int)
    private let weekStartsOn: Int
    @Binding private var selected: String?
    private let locale: Locale
    private let styles: Styles

    public init(days: [ManicatActivityDay], label: String, period: String, unit: (one: String, other: String) = ("contribution", "contributions"), thresholds: (Int, Int, Int) = (1, 6, 14), weekStartsOn: Int = 0, selected: Binding<String?> = .constant(nil), locale: Locale = Locale(identifier: "en_US"), styles: Styles = Styles()) {
        self.days = days
        self.label = label
        self.period = period
        self.unit = unit
        self.thresholds = thresholds
        self.weekStartsOn = weekStartsOn
        self._selected = selected
        self.locale = locale
        self.styles = styles
    }

    public var body: some View {
        let sorted = days.sorted { $0.date < $1.date }
        let total = sorted.reduce(0) { $0 + $1.count }
        let shown = hover ?? sorted.first { $0.date == selected }
        let weeks = columns(sorted)

        VStack(alignment: .leading, spacing: ManicatMetrics.space.s2) {
            Text(label).font(.system(size: ManicatMetrics.textSm, weight: .medium)).foregroundStyle(tokens.foreground)
            Text(shown.map { "\(word($0.count)) on \(when($0))" } ?? "\(word(total)) · \(period)")
                .font(.system(size: ManicatMetrics.textXs))
                .foregroundStyle(tokens.textSecondary)
                .manicatStyle(styles.readout)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(alignment: .top, spacing: 3) {
                    ForEach(Array(weeks.enumerated()), id: \.offset) { _, week in
                        VStack(spacing: 3) {
                            ForEach(Array(week.enumerated()), id: \.offset) { _, day in
                                if let day {
                                    Button { selected = day.date } label: {
                                        RoundedRectangle(cornerRadius: 3)
                                            .fill(levels[level(day.count)])
                                            .overlay(RoundedRectangle(cornerRadius: 3).stroke(selected == day.date ? tokens.foreground : .clear, lineWidth: 1))
                                            .frame(width: 14, height: 14)
                                            .manicatStyle(styles.cell)
                                    }
                                    .buttonStyle(.plain)
                                    .accessibilityLabel("\(day.date), \(word(day.count))")
                                    .accessibilityAddTraits(selected == day.date ? .isSelected : [])
                                    .onHover { inside in hover = inside ? day : nil }
                                } else {
                                    Color.clear.frame(width: 14, height: 14)
                                }
                            }
                        }
                    }
                }
            }
            HStack(spacing: 4) {
                Text("Less").font(.system(size: 10)).foregroundStyle(tokens.textMuted)
                ForEach(0..<5, id: \.self) { index in RoundedRectangle(cornerRadius: 3).fill(levels[index]).frame(width: 14, height: 14) }
                Text("More").font(.system(size: 10)).foregroundStyle(tokens.textMuted)
            }
            .frame(maxWidth: .infinity, alignment: .trailing)
            .manicatStyle(styles.legend)
            .accessibilityHidden(true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("\(label), \(period): \(word(total))")
    }

    private var levels: [Color] { [tokens.surfaceMuted, tokens.success.opacity(0.33), tokens.success.opacity(0.6), tokens.success.opacity(0.8), tokens.success] }

    private func level(_ count: Int) -> Int {
        count <= 0 ? 0 : count < thresholds.1 ? 1 : count < thresholds.2 ? 2 : count < thresholds.2 * 2 ? 3 : 4
    }

    private func word(_ count: Int) -> String { "\(count) \(count == 1 ? unit.one : unit.other)" }

    private func date(_ day: ManicatActivityDay) -> Date? {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone(identifier: "UTC")
        return formatter.date(from: day.date)
    }

    private func when(_ day: ManicatActivityDay) -> String {
        date(day).map { $0.formatted(.dateTime.month(.abbreviated).day().year().locale(locale)) } ?? day.date
    }

    /// Days grouped into week columns, padded at the start so the first day lands on its weekday row.
    private func columns(_ sorted: [ManicatActivityDay]) -> [[ManicatActivityDay?]] {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "UTC") ?? .current
        let lead = sorted.first.flatMap(date).map { (calendar.component(.weekday, from: $0) - 1 - weekStartsOn + 7) % 7 } ?? 0
        let cells: [ManicatActivityDay?] = Array(repeating: nil, count: lead) + sorted.map { Optional($0) }
        return stride(from: 0, to: cells.count, by: 7).map { Array(cells[$0..<min($0 + 7, cells.count)]) }
    }
}
