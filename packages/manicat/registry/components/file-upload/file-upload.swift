import SwiftUI

/// What your picker returned: `fileImporter`, `PhotosPicker`, a document scanner…
public struct ManicatPickedFile {
    public let name: String
    public let size: Int
    /// Whatever you need to upload it later, such as the file URL.
    public let source: Any?

    public init(name: String, size: Int, source: Any? = nil) {
        self.name = name
        self.size = size
        self.source = source
    }
}

public struct ManicatFileUploadItem: Identifiable {
    public let id: String
    public let name: String
    public let size: Int
    public let source: Any?
    public let error: String?
}

/// Mirrors file-upload.tsx / file-upload.rn.tsx / file-upload.vue: a pick button and the list of what was chosen, with a size
/// check. Uploading the files is up to you.
public struct ManicatFileUpload: View {
    public struct Styles {
        public var button: ManicatStyle = { $0 }
        public var item: ManicatStyle = { $0 }
        public var name: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @Environment(\.isEnabled) private var enabled

    @Binding private var files: [ManicatFileUploadItem]
    private let label: String
    private let description: String?
    private let multiple: Bool
    private let maxSize: Int?
    private let onPick: () async -> [ManicatPickedFile]
    private let styles: Styles

    public init(files: Binding<[ManicatFileUploadItem]>, label: String = "Upload a file", description: String? = nil, multiple: Bool = false, maxSize: Int? = nil, styles: Styles = Styles(), onPick: @escaping () async -> [ManicatPickedFile]) {
        self._files = files
        self.label = label
        self.description = description
        self.multiple = multiple
        self.maxSize = maxSize
        self.styles = styles
        self.onPick = onPick
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: ManicatMetrics.space.s2) {
            Button { Task { await pick() } } label: {
                Text(label)
                    .font(.system(size: ManicatMetrics.textSm, weight: .medium))
                    .foregroundStyle(tokens.foreground)
                    .frame(maxWidth: .infinity, minHeight: ManicatMetrics.controlHeight.md)
                    .background(tokens.surface, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
                    .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(tokens.border, lineWidth: 1))
                    .opacity(enabled ? 1 : 0.5)
                    .manicatStyle(styles.button)
            }
            .buttonStyle(.plain)
            if let description {
                Text(description).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted)
            }
            ForEach(files) { file in
                HStack(spacing: ManicatMetrics.space.s3) {
                    VStack(alignment: .leading, spacing: 0) {
                        Text(file.name).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.foreground).lineLimit(1).manicatStyle(styles.name)
                        Text(file.error ?? Self.size(file.size)).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(file.error != nil ? tokens.danger : tokens.textMuted)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    Button { files.removeAll { $0.id == file.id } } label: {
                        Text("×").font(.system(size: 18)).foregroundStyle(tokens.textMuted)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Remove \(file.name)")
                }
                .padding(ManicatMetrics.space.s3)
                .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(file.error != nil ? tokens.danger : tokens.border, lineWidth: 1))
                .manicatStyle(styles.item)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func pick() async {
        let chosen = await onPick()
        let stamp = Int(Date().timeIntervalSince1970 * 1000)
        let items = chosen.enumerated().map { index, file in
            ManicatFileUploadItem(id: "f-\(stamp)-\(index)", name: file.name, size: file.size, source: file.source, error: maxSize.flatMap { file.size > $0 ? "Larger than \(Self.size($0))" : nil })
        }
        files = multiple ? files + items : Array(items.prefix(1))
    }

    private static func size(_ bytes: Int) -> String {
        bytes >= 1_048_576 ? String(format: "%.1f MB", Double(bytes) / 1_048_576) : "\(max(1, Int((Double(bytes) / 1024).rounded()))) KB"
    }
}
