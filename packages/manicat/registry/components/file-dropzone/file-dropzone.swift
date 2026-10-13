import SwiftUI

public struct ManicatDropzoneItem: Identifiable {
    public enum Status { case uploading, uploaded, failed }

    public let id: String
    public let name: String
    public let size: Int
    public var status: Status?
    /// 0 to 100 while uploading.
    public var progress: Double
    public var error: String?
    public var retryable: Bool
    public let source: Any?

    public init(id: String, name: String, size: Int, status: Status? = nil, progress: Double = 0, error: String? = nil, retryable: Bool = false, source: Any? = nil) {
        self.id = id
        self.name = name
        self.size = size
        self.status = status
        self.progress = progress
        self.error = error
        self.retryable = retryable
        self.source = source
    }
}

/// Mirrors file-dropzone.tsx / file-dropzone.rn.tsx / file-dropzone.vue: a pick area and a list with upload progress, retry and
/// cancel. `onUpload` does the uploading and reports progress; without it files are marked uploaded at once.
public struct ManicatFileDropzone: View {
    public struct Styles {
        public var zone: ManicatStyle = { $0 }
        public var item: ManicatStyle = { $0 }
        public var name: ManicatStyle = { $0 }
        public var progress: ManicatStyle = { $0 }
        public var note: ManicatStyle = { $0 }
        public init() {}
    }

    public typealias Upload = (ManicatDropzoneItem, @escaping (Double) -> Void) async throws -> Void

    @Environment(\.manicat) private var tokens
    @State private var tasks: [String: Task<Void, Never>] = [:]

    @Binding private var items: [ManicatDropzoneItem]
    private let multiple: Bool
    private let maxFiles: Int
    private let maxSize: Int?
    private let label: String
    private let description: String?
    private let note: String?
    private let styles: Styles
    private let onPick: () async -> [ManicatPickedFile]
    private let onUpload: Upload?

    public init(items: Binding<[ManicatDropzoneItem]>, multiple: Bool = true, maxFiles: Int = .max, maxSize: Int? = nil, label: String = "Add files", description: String? = nil, note: String? = nil, styles: Styles = Styles(), onPick: @escaping () async -> [ManicatPickedFile], onUpload: Upload? = nil) {
        self._items = items
        self.multiple = multiple
        self.maxFiles = maxFiles
        self.maxSize = maxSize
        self.label = label
        self.description = description
        self.note = note
        self.styles = styles
        self.onPick = onPick
        self.onUpload = onUpload
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: ManicatMetrics.space.s2) {
            Button { Task { await add() } } label: {
                VStack(spacing: 4) {
                    Text(label).font(.system(size: ManicatMetrics.textSm, weight: .semibold)).foregroundStyle(tokens.foreground)
                    if let description { Text(description).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textSecondary) }
                    Text("Press to choose \(multiple ? "files" : "a file")").font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted)
                }
                .frame(maxWidth: .infinity, minHeight: 112)
                .overlay(RoundedRectangle(cornerRadius: 22).strokeBorder(tokens.borderStrong, style: StrokeStyle(lineWidth: 1, dash: [5, 4])))
                .contentShape(Rectangle())
                .manicatStyle(styles.zone)
            }
            .buttonStyle(.plain)
            .accessibilityLabel(label)
            if let note { Text(note).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted).manicatStyle(styles.note) }
            ForEach(items) { item in row(item) }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func row(_ item: ManicatDropzoneItem) -> some View {
        HStack(spacing: ManicatMetrics.space.s3) {
            VStack(alignment: .leading, spacing: 2) {
                Text(item.name).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.foreground).lineLimit(1).manicatStyle(styles.name)
                Text(item.status == .failed ? (item.error ?? "Upload failed") : item.status == .uploading ? "Uploading \(Int(item.progress.rounded()))%" : size(item.size))
                    .font(.system(size: ManicatMetrics.textXs))
                    .foregroundStyle(item.status == .failed ? tokens.danger : tokens.textMuted)
                if item.status == .uploading {
                    GeometryReader { proxy in
                        Capsule().fill(tokens.surfaceMuted).overlay(alignment: .leading) { Capsule().fill(tokens.accent).frame(width: proxy.size.width * item.progress / 100) }
                    }
                    .frame(height: 4)
                    .manicatStyle(styles.progress)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            if item.status == .failed, item.retryable {
                Button { Task { await run(item) } } label: { Text("Retry").font(.system(size: ManicatMetrics.textXs, weight: .medium)).foregroundStyle(tokens.foreground) }.buttonStyle(.plain)
            }
            Button { remove(item.id) } label: { Text("×").font(.system(size: 18)).foregroundStyle(tokens.textMuted) }
                .buttonStyle(.plain)
                .accessibilityLabel("Remove \(item.name)")
        }
        .padding(ManicatMetrics.space.s3)
        .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(item.status == .failed ? tokens.danger : tokens.border, lineWidth: 1))
        .manicatStyle(styles.item)
    }

    private func size(_ bytes: Int) -> String {
        bytes >= 1_048_576 ? String(format: "%.1f MB", Double(bytes) / 1_048_576) : "\(max(1, Int((Double(bytes) / 1024).rounded()))) KB"
    }

    @MainActor private func add() async {
        let picked = Array(await onPick().prefix(max(0, maxFiles - items.count)))
        let stamp = Int(Date().timeIntervalSince1970 * 1000)
        let added = picked.enumerated().map { index, file -> ManicatDropzoneItem in
            if let maxSize, file.size > maxSize {
                return ManicatDropzoneItem(id: "f-\(stamp)-\(index)", name: file.name, size: file.size, status: .failed, error: "Larger than \(size(maxSize))", source: file.source)
            }
            return ManicatDropzoneItem(id: "f-\(stamp)-\(index)", name: file.name, size: file.size, status: .uploading, source: file.source)
        }
        items += added
        for item in added where item.status == .uploading { tasks[item.id] = Task { await run(item) } }
    }

    @MainActor private func run(_ item: ManicatDropzoneItem) async {
        guard let onUpload else { update(item.id) { $0.status = .uploaded; $0.progress = 100 }; return }
        update(item.id) { $0.status = .uploading; $0.progress = 0; $0.error = nil }
        do {
            try await onUpload(item) { percent in Task { @MainActor in update(item.id) { $0.progress = percent } } }
            update(item.id) { $0.status = .uploaded; $0.progress = 100 }
        } catch {
            update(item.id) { $0.status = .failed; $0.error = error.localizedDescription; $0.retryable = true }
        }
    }

    private func update(_ id: String, _ change: (inout ManicatDropzoneItem) -> Void) {
        guard let at = items.firstIndex(where: { $0.id == id }) else { return }
        change(&items[at])
    }

    private func remove(_ id: String) {
        tasks[id]?.cancel()
        items.removeAll { $0.id == id }
    }
}
