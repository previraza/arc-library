// swift-tools-version: 5.9
import PackageDescription

// The viewer for the Swift ports of Manicat UI. `Sources/Ports` is a symlink to packages/manicat/registry and `Sources/Lib` to
// packages/manicat/lib, so every `*.swift` port and the shared tokens are compiled as they are, with no copy to keep in sync.
// Open this folder in Xcode (File > Open) or run `swift run ManicatPreview` on macOS.
let package = Package(
    name: "ManicatPreview",
    platforms: [.macOS(.v14), .iOS(.v17)],
    targets: [
        .executableTarget(
            name: "ManicatPreview",
            path: "Sources",
            exclude: ["Ports/foundation.css", "Ports/motion-tokens.ts"],
            sources: ["Ports", "Lib", "ManicatPreview"]
        )
    ]
)
