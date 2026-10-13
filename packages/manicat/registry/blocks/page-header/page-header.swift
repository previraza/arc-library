import SwiftUI

public struct ManicatPageHeaderIssue: Identifiable {
    public let id: String
    public let title: String
    public let owner: String
    public let label: String

    public init(id: String, title: String, owner: String, label: String) {
        self.id = id
        self.title = title
        self.owner = owner
        self.label = label
    }
}

/// Mirrors page-header.tsx / page-header.rn.tsx / page-header.vue: a project header with breadcrumbs, a status, members and four
/// sections you can switch between. Issues can be checked off, which moves the progress.
public struct ManicatPageHeader: View {
    public struct Styles {
        public var title: ManicatStyle = { $0 }
        public var tabs: ManicatStyle = { $0 }
        public var row: ManicatStyle = { $0 }
        public init() {}
    }

    private enum Section: String, CaseIterable { case overview, issues, updates, files }

    private struct Update: Identifiable { let id: String, author: String, date: String, good: Bool, status: String, body: String }
    private struct Milestone: Identifiable { var id: String { name }; let name: String, note: String, state: Int }

    private static let startingIssues = [
        ManicatPageHeaderIssue(id: "CHK-138", title: "Saved card list clips the expiry date on small screens", owner: "Sofia Ramirez", label: "Bug"),
        ManicatPageHeaderIssue(id: "CHK-136", title: "Add an edit link beside each section of the review step", owner: "Emma Collins", label: "Design"),
        ManicatPageHeaderIssue(id: "CHK-135", title: "Wallet sheet opens twice after a failed card check", owner: "Marcus Johnson", label: "Bug"),
        ManicatPageHeaderIssue(id: "CHK-133", title: "Show the delivery estimate before payment", owner: "Ava Mitchell", label: "Research"),
        ManicatPageHeaderIssue(id: "CHK-131", title: "Promo code field loses focus after an invalid code", owner: "Sofia Ramirez", label: "Bug"),
    ]
    private static let updates = [
        Update(id: "u3", author: "Ava Mitchell", date: "Sep 12", good: true, status: "On track", body: "Five usability sessions are done. People trust a single review step as long as the total stays visible while they edit."),
        Update(id: "u2", author: "Marcus Johnson", date: "Sep 5", good: false, status: "At risk", body: "Card tokenization is waiting on the payments team. We moved the review step ahead so the October date can hold."),
        Update(id: "u1", author: "Emma Collins", date: "Aug 29", good: true, status: "On track", body: "Kickoff. Scope is saved cards, one review step, and a staged rollout starting October 14."),
    ]
    private static let files = [
        (name: "Checkout flows v3", kind: "Design file", size: "18.4 MB", date: "Sep 20"),
        (name: "Payments API notes", kind: "Document", size: "96 KB", date: "Sep 16"),
        (name: "Rollout plan", kind: "Slides", size: "4.8 MB", date: "Sep 11"),
        (name: "Launch checklist", kind: "Document", size: "54 KB", date: "Sep 2"),
    ]
    private static let milestones = [
        Milestone(name: "Saved payment methods", note: "Shipped Sep 18", state: 0),
        Milestone(name: "Single review step", note: "In progress, due Oct 1", state: 1),
        Milestone(name: "Staged rollout", note: "Planned for Oct 14", state: 2),
    ]
    private static let doneAtStart = 31

    @Environment(\.manicat) private var tokens
    @State private var section = Section.overview.rawValue
    @State private var issues = ManicatPageHeader.startingIssues
    @State private var done = ManicatPageHeader.doneAtStart

    private let title: String
    private let breadcrumbs: [String]
    private let members: [ManicatAvatarGroupMember]
    private let styles: Styles
    private let onShare: (() -> Void)?

    public init(title: String = "Checkout redesign", breadcrumbs: [String] = ["Projects", "Northline"], members: [ManicatAvatarGroupMember] = ["Emma Collins", "Marcus Johnson", "Ava Mitchell", "Sofia Ramirez", "Jasmine Brooks"].map { ManicatAvatarGroupMember(name: $0) }, styles: Styles = Styles(), onShare: (() -> Void)? = nil) {
        self.title = title
        self.breadcrumbs = breadcrumbs
        self.members = members
        self.styles = styles
        self.onShare = onShare
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(breadcrumbs.joined(separator: " / ")).font(.system(size: 13)).foregroundStyle(tokens.textMuted)
            HStack(spacing: 8) {
                Text(title).font(.system(size: 26, weight: .semibold)).tracking(-0.5).foregroundStyle(tokens.foreground).accessibilityAddTraits(.isHeader).manicatStyle(styles.title)
                Spacer(minLength: 0)
                ManicatBadge("On track", tone: .success, small: true)
            }
            HStack(spacing: 8) {
                ManicatAvatarGroup(members: members, max: 4, size: .sm)
                Spacer(minLength: 0)
                ManicatButton("Share", variant: .secondary, size: .sm) { onShare?() }
            }
            ManicatSegmentedControl(options: Section.allCases.map { ManicatSegment(value: $0.rawValue, label: $0 == .issues ? "Issues \(issues.count)" : $0.rawValue.capitalized) }, value: $section, label: "Project sections")
                .manicatStyle(styles.tabs)
            content
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    @ViewBuilder private var content: some View {
        switch Section(rawValue: section) ?? .overview {
        case .overview: overview
        case .issues: issueList
        case .updates:
            ForEach(Self.updates) { update in
                VStack(alignment: .leading, spacing: 4) {
                    (Text("\(update.author) · \(update.date) · ").foregroundColor(tokens.textMuted) + Text(update.status).foregroundColor(update.good ? tokens.success : tokens.warning)).font(.system(size: 12))
                    Text(update.body).font(.system(size: 14)).lineSpacing(3).foregroundStyle(tokens.textSecondary)
                }
            }
        case .files:
            ForEach(Self.files, id: \.name) { file in
                HStack {
                    VStack(alignment: .leading) {
                        Text(file.name).foregroundStyle(tokens.foreground)
                        Text("\(file.kind) · \(file.size)").font(.system(size: 12)).foregroundStyle(tokens.textMuted)
                    }
                    Spacer(minLength: 0)
                    Text(file.date).font(.system(size: 12)).foregroundStyle(tokens.textMuted)
                }
            }
        }
    }

    private var overview: some View {
        VStack(alignment: .leading, spacing: 12) {
            ManicatProgress(value: Double(done), max: Double(done + issues.count), label: "\(done) of \(done + issues.count) issues done", showValue: true)
            Text("Milestones").font(.system(size: 15, weight: .semibold)).foregroundStyle(tokens.foreground).accessibilityAddTraits(.isHeader)
            ForEach(Self.milestones) { item in
                HStack(spacing: 10) {
                    Text(item.state == 0 ? "●" : item.state == 1 ? "◐" : "○").foregroundStyle(item.state == 0 ? tokens.success : tokens.textMuted)
                    Text(item.name).foregroundStyle(tokens.foreground).frame(maxWidth: .infinity, alignment: .leading)
                    Text(item.note).font(.system(size: 12)).foregroundStyle(tokens.textMuted)
                }
            }
        }
    }

    private var issueList: some View {
        VStack(alignment: .leading, spacing: 4) {
            if issues.isEmpty { Text("Nothing left to do.").foregroundStyle(tokens.textSecondary) }
            ForEach(issues) { issue in
                HStack(spacing: 10) {
                    Button {
                        issues.removeAll { $0.id == issue.id }
                        done += 1
                    } label: { Text("○").font(.system(size: 20)).foregroundStyle(tokens.textMuted) }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Mark \(issue.id) done")
                    VStack(alignment: .leading) {
                        Text("\(issue.id) · \(issue.label) · \(issue.owner)").font(.system(size: 11)).foregroundStyle(tokens.textMuted)
                        Text(issue.title).font(.system(size: 14)).foregroundStyle(tokens.foreground)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                .padding(.vertical, 10)
                .overlay(alignment: .bottom) { Rectangle().fill(tokens.border).frame(height: 1) }
                .manicatStyle(styles.row)
            }
            ManicatButton("Reset", variant: .ghost, size: .sm) {
                issues = Self.startingIssues
                done = Self.doneAtStart
            }
        }
    }
}
