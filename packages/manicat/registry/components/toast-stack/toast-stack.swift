import SwiftUI

public enum ManicatToastType { case success, info, warning, error, loading }

public struct ManicatToastAction {
    public let label: String
    public let onClick: (String) -> Void

    public init(_ label: String, onClick: @escaping (String) -> Void) {
        self.label = label
        self.onClick = onClick
    }
}

public struct ManicatToastEntry: Identifiable {
    public var id: String
    public var type: ManicatToastType
    public var title: String
    public var description: String?
    public var action: ManicatToastAction?
    /// Seconds before it leaves. 0 keeps it until dismissed.
    public var duration: TimeInterval

    public init(id: String = "", type: ManicatToastType = .info, title: String, description: String? = nil, action: ManicatToastAction? = nil, duration: TimeInterval = 5) {
        self.id = id
        self.type = type
        self.title = title
        self.description = description
        self.action = action
        self.duration = duration
    }
}

/// The queue. Create one, keep it (`@StateObject`) and call `toast`, `update` and `dismiss` from anywhere you can reach it.
public final class ManicatToastStore: ObservableObject {
    @Published public private(set) var toasts: [ManicatToastEntry] = []
    private let limit: Int
    private var counter = 0

    public init(limit: Int = 12) { self.limit = limit }

    @discardableResult public func toast(_ toast: ManicatToastEntry) -> String {
        var entry = toast
        if entry.id.isEmpty {
            counter += 1
            entry.id = "toast-\(counter)"
        }
        toasts = Array(([entry] + toasts.filter { $0.id != entry.id }).prefix(limit))
        return entry.id
    }

    public func update(_ id: String, _ change: (inout ManicatToastEntry) -> Void) {
        guard let at = toasts.firstIndex(where: { $0.id == id }) else { return }
        change(&toasts[at])
    }

    public func dismiss(_ id: String? = nil) {
        if let id { toasts.removeAll { $0.id == id } } else { toasts = [] }
    }
}

/// Mirrors toast-stack.tsx / toast-stack.rn.tsx / toast-stack.vue: wraps your content and floats the newest toasts over it.
public struct ManicatToastStack<Content: View>: View {
    public struct Styles {
        public var toast: ManicatStyle = { $0 }
        public var title: ManicatStyle = { $0 }
        public var description: ManicatStyle = { $0 }
        public var action: ManicatStyle = { $0 }
        public init() {}
    }

    public enum Position { case top, bottom }

    @Environment(\.manicat) private var tokens
    @ObservedObject private var store: ManicatToastStore

    private let label: String
    private let position: Position
    private let visibleToasts: Int
    private let styles: Styles
    private let content: Content

    public init(_ store: ManicatToastStore, label: String = "Notifications", position: Position = .bottom, visibleToasts: Int = 3, styles: Styles = Styles(), @ViewBuilder content: () -> Content) {
        self._store = ObservedObject(wrappedValue: store)
        self.label = label
        self.position = position
        self.visibleToasts = visibleToasts
        self.styles = styles
        self.content = content()
    }

    public var body: some View {
        ZStack(alignment: position == .top ? .top : .bottom) {
            content
            VStack(spacing: 8) {
                ForEach(Array(store.toasts.prefix(visibleToasts))) { entry in
                    timed(entry)
                }
            }
            .padding(.horizontal, 16)
            .padding(position == .top ? .top : .bottom, 24)
            .animation(.spring(response: 0.35, dampingFraction: 0.85), value: store.toasts.map { $0.id })
            .accessibilityElement(children: .contain)
            .accessibilityLabel(label)
        }
    }

    private func timed(_ entry: ManicatToastEntry) -> some View {
        let key = entry.id + "-" + String(entry.duration) + "-" + String(entry.type == .loading)
        let edge: Edge = position == .top ? .top : .bottom

        return toast(entry)
            .task(id: key) {
                guard entry.duration > 0, entry.type != .loading else { return }
                try? await Task.sleep(nanoseconds: UInt64(entry.duration * 1_000_000_000))
                if !Task.isCancelled { store.dismiss(entry.id) }
            }
            .transition(.move(edge: edge).combined(with: .opacity))
    }

    private func toast(_ entry: ManicatToastEntry) -> some View {
        let color: Color
        switch entry.type {
        case .success: color = tokens.success
        case .error: color = tokens.danger
        case .warning: color = tokens.warning
        case .info: color = tokens.accent
        case .loading: color = tokens.textMuted
        }

        return HStack(spacing: ManicatMetrics.space.s3) {
            if entry.type == .loading { ProgressView().controlSize(.small) } else { Circle().fill(color).frame(width: 8, height: 8) }
            VStack(alignment: .leading, spacing: 2) {
                Text(entry.title).font(.system(size: ManicatMetrics.textSm, weight: .medium)).foregroundStyle(tokens.foreground).manicatStyle(styles.title)
                if let description = entry.description { Text(description).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textSecondary).manicatStyle(styles.description) }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            if let action = entry.action {
                Button { action.onClick(entry.id) } label: { Text(action.label).font(.system(size: ManicatMetrics.textXs, weight: .semibold)).foregroundStyle(tokens.foreground).manicatStyle(styles.action) }
                    .buttonStyle(.plain)
            }
            Button { store.dismiss(entry.id) } label: { Text("×").font(.system(size: 18)).foregroundStyle(tokens.textMuted) }
                .buttonStyle(.plain)
                .accessibilityLabel("Dismiss")
        }
        .padding(.vertical, ManicatMetrics.space.s3)
        .padding(.horizontal, ManicatMetrics.space.s4)
        .frame(maxWidth: 420)
        .background(tokens.surface, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
        .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(tokens.border, lineWidth: 1))
        .shadow(color: .black.opacity(0.12), radius: 12, x: 0, y: 4)
        .manicatStyle(styles.toast)
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(.isStaticText)
    }
}
