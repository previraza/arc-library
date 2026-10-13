import SwiftUI

public struct ManicatStep: Identifiable {
    public let id: String
    public let label: String
    public let description: String?
    public let error: String?

    public init(id: String, label: String, description: String? = nil, error: String? = nil) {
        self.id = id
        self.label = label
        self.description = description
        self.error = error
    }
}

public enum ManicatStepStatus { case complete, current, upcoming, error }

/// Mirrors stepper.tsx / stepper.rn.tsx / stepper.vue: a vertical list of steps joined by a rail. Pass `onSelect` to let completed
/// and current steps be pressed.
public struct ManicatStepper: View {
    public enum Details { case all, current }

    public struct Styles {
        public var step: ManicatStyle = { $0 }
        public var marker: ManicatStyle = { $0 }
        public var markerText: ManicatStyle = { $0 }
        public var label: ManicatStyle = { $0 }
        public var description: ManicatStyle = { $0 }
        public var line: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens

    private let steps: [ManicatStep]
    private let current: Int
    private let details: Details
    private let label: String
    private let onSelect: ((Int) -> Void)?
    private let styles: Styles

    public init(steps: [ManicatStep], current: Int, details: Details = .all, label: String = "Progress", styles: Styles = Styles(), onSelect: ((Int) -> Void)? = nil) {
        self.steps = steps
        self.current = current
        self.details = details
        self.label = label
        self.styles = styles
        self.onSelect = onSelect
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(Array(steps.enumerated()), id: \.element.id) { index, step in
                let status = statusOf(step, index)
                let color = markerColor(status)
                let filled = status == .complete || status == .error
                let selectable = onSelect != nil && (status == .complete || status == .current)

                Button { onSelect?(index) } label: {
                    HStack(alignment: .top, spacing: ManicatMetrics.space.s3) {
                        VStack(spacing: 0) {
                            Text(status == .complete ? "✓" : status == .error ? "!" : "\(index + 1)")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundStyle(filled ? tokens.controlThumbOn : color)
                                .manicatStyle(styles.markerText)
                                .frame(width: 26, height: 26)
                                .background(filled ? color : tokens.surface, in: Circle())
                                .overlay(Circle().stroke(color, lineWidth: 1.5))
                                .manicatStyle(styles.marker)
                            if index < steps.count - 1 {
                                RoundedRectangle(cornerRadius: 1)
                                    .fill(index < current ? tokens.controlOn : tokens.border)
                                    .frame(width: 2)
                                    .padding(.vertical, 4)
                                    .manicatStyle(styles.line)
                            }
                        }
                        VStack(alignment: .leading, spacing: 2) {
                            Text(step.label)
                                .font(.system(size: ManicatMetrics.textSm, weight: .medium))
                                .foregroundStyle(status == .upcoming ? tokens.textMuted : tokens.foreground)
                                .manicatStyle(styles.label)
                            if (details == .all || status == .current || status == .error), let text = step.error ?? step.description {
                                Text(text)
                                    .font(.system(size: ManicatMetrics.textXs))
                                    .foregroundStyle(status == .error ? tokens.danger : tokens.textSecondary)
                                    .manicatStyle(styles.description)
                            }
                        }
                        .padding(.top, 3)
                        .padding(.bottom, ManicatMetrics.space.s3)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .frame(minHeight: 52, alignment: .top)
                    .contentShape(Rectangle())
                    .manicatStyle(styles.step)
                }
                .buttonStyle(.plain)
                .disabled(!selectable)
                .accessibilityLabel("\(step.label), \(statusName(status))")
                .accessibilityAddTraits(status == .current ? .isSelected : [])
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
    }

    private func statusOf(_ step: ManicatStep, _ index: Int) -> ManicatStepStatus {
        step.error != nil ? .error : index < current ? .complete : index == current ? .current : .upcoming
    }

    private func markerColor(_ status: ManicatStepStatus) -> Color {
        switch status { case .error: return tokens.danger; case .complete: return tokens.controlOn; case .current: return tokens.foreground; case .upcoming: return tokens.borderStrong }
    }

    private func statusName(_ status: ManicatStepStatus) -> String {
        switch status { case .error: return "error"; case .complete: return "complete"; case .current: return "current"; case .upcoming: return "upcoming" }
    }
}
