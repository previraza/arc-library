import SwiftUI

@main
struct ManicatPreviewApp: App {
    var body: some Scene {
        WindowGroup("Manicat UI · Swift viewer") { ViewerView() }
    }
}

struct ViewerView: View {
    @State private var selection: String? = generatedDemos.first?.item
    @State private var dark = false

    var body: some View {
        NavigationSplitView {
            List(generatedDemos, id: \.item, selection: $selection) { demo in Text(demo.item) }
                .navigationTitle("Swift ports · \(generatedDemos.count)")
        } detail: {
            if let demo = generatedDemos.first(where: { $0.item == selection }) {
                ScrollView {
                    demo.make()
                        .frame(maxWidth: .infinity, minHeight: 240)
                        .padding(24)
                        .background(Color(hex: dark ? "#2b2b2b" : "#ffffff"))
                        .clipShape(RoundedRectangle(cornerRadius: 24))
                        .overlay(RoundedRectangle(cornerRadius: 24).stroke(.quaternary))
                        .padding(24)
                }
                .toolbar { Toggle("Dark", isOn: $dark) }
                .navigationTitle(demo.item)
            } else {
                Text("No Swift port yet").foregroundStyle(.secondary)
            }
        }
        .preferredColorScheme(dark ? .dark : .light)
    }
}
