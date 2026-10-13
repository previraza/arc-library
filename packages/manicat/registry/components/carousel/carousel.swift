import SwiftUI

/// Mirrors carousel.tsx / carousel.rn.tsx / carousel.vue: slides that snap into place with the next one peeking in, and dots below.
public struct ManicatCarousel<Data: RandomAccessCollection, Slide: View>: View where Data.Element: Identifiable {
    public struct Styles {
        public var slide: ManicatStyle = { $0 }
        public var dots: ManicatStyle = { $0 }
        public var dot: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens

    private let slides: Data
    private let label: String
    @Binding private var index: Int
    private let slideSize: CGFloat
    private let slideLabel: (Int, Int) -> String
    private let styles: Styles
    private let content: (Data.Element) -> Slide

    public init(_ slides: Data, label: String, index: Binding<Int>, slideSize: CGFloat = 0.72, slideLabel: @escaping (Int, Int) -> String = { "Slide \($0 + 1) of \($1)" }, styles: Styles = Styles(), @ViewBuilder slide: @escaping (Data.Element) -> Slide) {
        self.slides = slides
        self.label = label
        self._index = index
        self.slideSize = slideSize
        self.slideLabel = slideLabel
        self.styles = styles
        self.content = slide
    }

    public var body: some View {
        let items = Array(slides)

        VStack(spacing: ManicatMetrics.space.s3) {
            ScrollViewReader { proxy in
                GeometryReader { geometry in
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            ForEach(Array(items.enumerated()), id: \.element.id) { at, item in
                                content(item)
                                    .frame(width: geometry.size.width * slideSize)
                                    .manicatStyle(styles.slide)
                                    .id(at)
                                    .accessibilityLabel(slideLabel(at, items.count))
                                    .onTapGesture { go(at, proxy) }
                            }
                        }
                        .padding(.trailing, geometry.size.width * (1 - slideSize))
                    }
                    .onChange(of: index) { _, next in withAnimation(.easeOut(duration: 0.3)) { proxy.scrollTo(next, anchor: .leading) } }
                }
            }
            HStack(spacing: 8) {
                ForEach(0..<items.count, id: \.self) { at in
                    Button { index = at } label: {
                        Circle().fill(at == index ? tokens.foreground : tokens.borderStrong).frame(width: 8, height: 8).manicatStyle(styles.dot)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(slideLabel(at, items.count))
                    .accessibilityAddTraits(at == index ? .isSelected : [])
                }
            }
            .manicatStyle(styles.dots)
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
    }

    private func go(_ at: Int, _ proxy: ScrollViewProxy) {
        index = at
        withAnimation(.easeOut(duration: 0.3)) { proxy.scrollTo(at, anchor: .leading) }
    }
}
