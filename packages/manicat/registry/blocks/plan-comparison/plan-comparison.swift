import SwiftUI

/// Mirrors plan-comparison.tsx / plan-comparison.rn.tsx / plan-comparison.vue: two plans, a billing switch that changes the price, a
/// "differences only" filter and the feature table.
public struct ManicatPlanComparison: View {
    public struct Styles {
        public var title: ManicatStyle = { $0 }
        public var description: ManicatStyle = { $0 }
        public var plan: ManicatStyle = { $0 }
        public var row: ManicatStyle = { $0 }
        public init() {}
    }

    private enum Plan: String, CaseIterable {
        case team, studio

        var name: String { rawValue.capitalized }
        var tagline: String { self == .team ? "For smaller teams" : "For work across teams" }
        func price(yearly: Bool) -> Int { self == .team ? (yearly ? 10 : 13) : (yearly ? 22 : 27) }
    }

    private struct Feature: Identifiable {
        var id: String { label }
        let label: String, team: String, studio: String
        var shared = false

        func value(_ plan: Plan) -> String { plan == .team ? team : studio }
    }

    private static let features = [
        Feature(label: "Active projects", team: "Unlimited", studio: "Unlimited", shared: true),
        Feature(label: "Shared workspaces", team: "1 workspace", studio: "Unlimited"),
        Feature(label: "Guest reviewers", team: "5 per project", studio: "Unlimited"),
        Feature(label: "Version history", team: "30 days", studio: "Unlimited"),
        Feature(label: "Approval flows", team: "Not included", studio: "Included"),
        Feature(label: "Custom roles", team: "Not included", studio: "Included"),
        Feature(label: "Source exports", team: "Included", studio: "Included", shared: true),
        Feature(label: "Support", team: "Email", studio: "Priority email"),
    ]

    @Environment(\.manicat) private var tokens
    @State private var billing = "monthly"
    @State private var differencesOnly = false
    @State private var selected: Plan?

    private let styles: Styles

    public init(styles: Styles = Styles()) { self.styles = styles }

    public var body: some View {
        let yearly = billing == "yearly"
        let visible = differencesOnly ? Self.features.filter { !$0.shared } : Self.features

        VStack(alignment: .leading, spacing: 12) {
            Text("Room for the way you work").font(.system(size: 24, weight: .semibold)).tracking(-0.4).foregroundStyle(tokens.foreground).accessibilityAddTraits(.isHeader).manicatStyle(styles.title)
            Text("Only the details that change between plans. Switch billing to see what you would pay.").font(.system(size: 14)).lineSpacing(3).foregroundStyle(tokens.textSecondary).manicatStyle(styles.description)
            ManicatSegmentedControl(options: [ManicatSegment(value: "monthly", label: "Monthly"), ManicatSegment(value: "yearly", label: "Yearly")], value: $billing, label: "Billing period")
            Text(yearly ? "Billed yearly, save up to 23%" : "Billed month to month").font(.system(size: 12)).foregroundStyle(tokens.textMuted)
            HStack(alignment: .top, spacing: 12) {
                ForEach(Plan.allCases, id: \.self) { plan in planCard(plan, yearly: yearly) }
            }
            HStack {
                Text("\(visible.count) of \(Self.features.count) features").font(.system(size: 13)).foregroundStyle(tokens.textSecondary)
                Spacer(minLength: 0)
                ManicatSwitch(isOn: $differencesOnly, label: "Show differences only")
            }
            VStack(spacing: 0) {
                ForEach(visible) { feature in
                    VStack(alignment: .leading, spacing: 6) {
                        Text(feature.label).font(.system(size: 14, weight: .medium)).foregroundStyle(tokens.foreground)
                        ForEach(Plan.allCases, id: \.self) { plan in
                            let value = feature.value(plan)
                            HStack {
                                Text(plan.name).font(.system(size: 12)).foregroundStyle(tokens.textMuted)
                                Spacer(minLength: 0)
                                Text(value == "Included" ? "✓ Included" : value).font(.system(size: 14)).foregroundStyle(value == "Not included" ? tokens.textMuted : value == "Included" ? tokens.success : tokens.foreground)
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.vertical, 12)
                    .overlay(alignment: .bottom) { Rectangle().fill(tokens.border).frame(height: 1) }
                    .manicatStyle(styles.row)
                }
            }
            .overlay(alignment: .top) { Rectangle().fill(tokens.border).frame(height: 1) }
            Text("Prices in USD per seat. Yearly plans are billed annually.").font(.system(size: 12)).foregroundStyle(tokens.textMuted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func planCard(_ plan: Plan, yearly: Bool) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(plan.name).font(.system(size: 16, weight: .semibold)).foregroundStyle(tokens.foreground)
            Text(plan.tagline).font(.system(size: 12)).foregroundStyle(tokens.textMuted)
            Text("$\(plan.price(yearly: yearly))").font(.system(size: 28, weight: .semibold)).foregroundStyle(tokens.foreground)
            Text("per seat / month").font(.system(size: 12)).foregroundStyle(tokens.textMuted)
            ManicatButton(selected == plan ? "Selected" : "Select \(plan.name)", variant: selected == plan ? .primary : .secondary, size: .sm) { selected = selected == plan ? nil : plan }
                .accessibilityAddTraits(selected == plan ? .isSelected : [])
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(tokens.surface, in: RoundedRectangle(cornerRadius: 20))
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(selected == plan ? tokens.foreground : tokens.border, lineWidth: 1))
        .manicatStyle(styles.plan)
    }
}
