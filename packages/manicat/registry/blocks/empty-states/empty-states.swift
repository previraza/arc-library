import SwiftUI

public enum ManicatEmptyScene: String, CaseIterable { case search, offline, inbox, map }
public enum ManicatEmptyPhase { case idle, loading, done }

/// Mirrors empty-states.tsx / empty-states.rn.tsx / empty-states.vue: four empty states you can switch between. Each action runs a
/// short loading step and then shows the result; pressing it again goes back.
public struct ManicatEmptyStates: View {
    public struct Styles {
        public var art: ManicatStyle = { $0 }
        public var glyph: ManicatStyle = { $0 }
        public var title: ManicatStyle = { $0 }
        public var line: ManicatStyle = { $0 }
        public init() {}
    }

    private struct Copy {
        let idle: (title: String, line: String, action: String)
        let done: (title: String, line: String, action: String)
        let loading: String
        let wait: UInt64
        let glyph: String
    }

    private static func copy(_ scene: ManicatEmptyScene) -> Copy {
        switch scene {
        case .search: return Copy(idle: ("No results for “Q3 roadmap”", "Two filters are on: owner is Emma Collins and status is archived.", "Clear filters"), done: ("12 results for “Q3 roadmap”", "Filters cleared. Showing matches from every owner and status.", "Restore filters"), loading: "", wait: 0, glyph: "⌕")
        case .offline: return Copy(idle: ("You are offline", "Edits are saved on this device and sync when the connection returns.", "Try again"), done: ("Back online", "Three edits synced to the Northwind workspace just now.", "Go offline"), loading: "Reaching sync.northwind.example…", wait: 1_400, glyph: "⌁")
        case .inbox: return Copy(idle: ("All caught up", "You have read every message in Inbox. New mail lands here first.", "Check for mail"), done: ("Still all caught up", "Checked just now. Nothing new since 8:30 this morning.", "Check again"), loading: "Checking for new mail…", wait: 1_100, glyph: "✓")
        case .map: return Copy(idle: ("Page not found", "The link to /projects/atlas-2023 is broken, or the page has moved.", "Find the page"), done: ("Found it in Archive", "Atlas 2023 roadmap moved to /archive/atlas-2023 in March.", "Show broken link"), loading: "Searching the workspace for Atlas…", wait: 1_200, glyph: "?")
        }
    }

    private static let labels: [ManicatEmptyScene: String] = [.search: "No results", .offline: "Offline", .inbox: "Caught up", .map: "Not found"]

    @Environment(\.manicat) private var tokens
    @State private var scene: String
    @State private var phase = ManicatEmptyPhase.idle

    private let styles: Styles
    private let onAction: ((ManicatEmptyScene, ManicatEmptyPhase) -> Void)?

    public init(defaultScene: ManicatEmptyScene = .search, styles: Styles = Styles(), onAction: ((ManicatEmptyScene, ManicatEmptyPhase) -> Void)? = nil) {
        self.styles = styles
        self.onAction = onAction
        self._scene = State(wrappedValue: defaultScene.rawValue)
    }

    private var current: ManicatEmptyScene { ManicatEmptyScene(rawValue: scene) ?? .search }

    public var body: some View {
        let entry = Self.copy(current)
        let text = phase == .done ? entry.done : entry.idle

        VStack(spacing: 14) {
            ManicatSegmentedControl(options: ManicatEmptyScene.allCases.map { ManicatSegment(value: $0.rawValue, label: Self.labels[$0] ?? "") }, value: $scene, label: "Empty state")
                .onChange(of: scene) { _, _ in phase = .idle }
            Text(entry.glyph).font(.system(size: 64)).foregroundStyle(phase == .done ? tokens.success : tokens.textMuted).accessibilityHidden(true).manicatStyle(styles.glyph)
                .frame(maxWidth: .infinity, minHeight: 160)
                .background(tokens.surfaceMuted, in: RoundedRectangle(cornerRadius: 28))
                .overlay(RoundedRectangle(cornerRadius: 28).stroke(tokens.border, lineWidth: 1))
                .manicatStyle(styles.art)
            Text(text.title).font(.system(size: 20, weight: .semibold)).tracking(-0.3).foregroundStyle(tokens.foreground).multilineTextAlignment(.center).accessibilityAddTraits(.isHeader).manicatStyle(styles.title)
            Text(phase == .loading ? entry.loading : text.line).font(.system(size: 14)).lineSpacing(3).foregroundStyle(tokens.textSecondary).multilineTextAlignment(.center).manicatStyle(styles.line)
            ManicatButton(text.action, size: .sm, loading: phase == .loading) { act(entry) }
        }
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Empty states")
        .task(id: phase == .loading ? scene : "") {
            guard phase == .loading else { return }
            try? await Task.sleep(nanoseconds: entry.wait * 1_000_000)
            if !Task.isCancelled {
                phase = .done
                onAction?(current, .done)
            }
        }
    }

    private func act(_ entry: Copy) {
        switch phase {
        case .loading: return
        case .done: phase = .idle
        case .idle:
            if entry.wait == 0 {
                phase = .done
                onAction?(current, .done)
            } else {
                phase = .loading
            }
        }
    }
}
