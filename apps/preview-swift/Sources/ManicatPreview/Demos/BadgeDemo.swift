import SwiftUI

struct BadgeDemo: ManicatDemo {
    static let item = "badge"

    var body: some View {
        HStack(spacing: 8) {
            ManicatBadge("Draft")
            ManicatBadge("Live", tone: .success)
            ManicatBadge("New", tone: .info, small: true)
            ManicatBadge("Review", tone: .warning)
            ManicatBadge("Failed", tone: .danger)
        }
    }
}
