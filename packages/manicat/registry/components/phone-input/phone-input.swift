import SwiftUI

public struct ManicatPhoneDetails {
    public let country: ManicatPhoneCountry
    public let formatted: String
    public let status: ManicatPhoneStatus
    public var valid: Bool { status == .valid }
}

/// Mirrors phone-input.tsx / phone-input.rn.tsx / phone-input.vue: a country picker plus a number that formats as you type and reports
/// E.164. Typing "+44…" or pasting an international number switches the country. The number logic lives in `lib/ManicatPhone.swift`.
public struct ManicatPhoneInput: View {
    public struct Styles {
        public var label: ManicatStyle = { $0 }
        public var shell: ManicatStyle = { $0 }
        public var flag: ManicatStyle = { $0 }
        public var input: ManicatStyle = { $0 }
        public var list: ManicatStyle = { $0 }
        public var option: ManicatStyle = { $0 }
        public var hint: ManicatStyle = { $0 }
        public init() {}
    }

    @Environment(\.manicat) private var tokens
    @Environment(\.isEnabled) private var enabled
    @FocusState private var focused: Bool
    @State private var iso: String
    @State private var digits: String
    @State private var open = false
    @State private var query = ""
    @State private var touched = false

    private let label: String
    private let value: Binding<String>?
    private let pool: [ManicatPhoneCountry]
    private let preferredCountries: [String]
    private let description: String?
    private let error: String?
    private let validate: Bool
    private let styles: Styles
    private let onValueChange: ((String, ManicatPhoneDetails) -> Void)?
    private let onCountryChange: ((String) -> Void)?

    /// `value` is the number in E.164, such as "+14155550132".
    public init(_ label: String, value: Binding<String>? = nil, defaultValue: String = "", defaultCountry: String = "US", countries: [String]? = nil, preferredCountries: [String] = ["US", "CA", "GB"], description: String? = nil, error: String? = nil, validate: Bool = true, styles: Styles = Styles(), onValueChange: ((String, ManicatPhoneDetails) -> Void)? = nil, onCountryChange: ((String) -> Void)? = nil) {
        let pool = countries.map { list in ManicatPhone.countries.filter { list.contains($0.iso) } } ?? ManicatPhone.countries
        let start = ManicatPhone.parse(value?.wrappedValue ?? defaultValue, pool: pool)
        self.label = label
        self.value = value
        self.pool = pool
        self.preferredCountries = preferredCountries
        self.description = description
        self.error = error
        self.validate = validate
        self.styles = styles
        self.onValueChange = onValueChange
        self.onCountryChange = onCountryChange
        self._iso = State(wrappedValue: start?.country.iso ?? defaultCountry)
        self._digits = State(wrappedValue: start?.national ?? "")
    }

    private var country: ManicatPhoneCountry { pool.first { $0.iso == iso } ?? pool[0] }

    public var body: some View {
        let status = ManicatPhone.status(country, digits)
        let message = error ?? (validate && touched && status != .empty && status != .valid ? (status == .tooLong ? "This number is too long." : "This number looks incomplete.") : nil)

        VStack(alignment: .leading, spacing: ManicatMetrics.space.s2) {
            Text(label).font(.system(size: ManicatMetrics.textSm, weight: .medium)).foregroundStyle(tokens.foreground).manicatStyle(styles.label)
            HStack(spacing: 0) {
                Button { open = true } label: {
                    HStack(spacing: 6) {
                        Text(country.flag).font(.system(size: 18))
                        Text("+\(country.dial)").font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.textSecondary)
                    }
                    .padding(.horizontal, ManicatMetrics.space.s3)
                    .frame(maxHeight: .infinity)
                    .overlay(alignment: .trailing) { Rectangle().fill(tokens.border).frame(width: 1) }
                    .contentShape(Rectangle())
                    .manicatStyle(styles.flag)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Country, \(country.name) +\(country.dial)")
                TextField("", text: Binding(get: { ManicatPhone.formatNational(country, digits) }, set: edit), prompt: Text(country.example).foregroundColor(tokens.textMuted))
                    .textFieldStyle(.plain)
                    .focused($focused)
                    .font(.system(size: ManicatMetrics.textSm).monospacedDigit())
                    .foregroundStyle(tokens.foreground)
                    .padding(.horizontal, ManicatMetrics.space.s3)
                    .onChange(of: focused) { _, now in if !now { touched = true } }
                    .accessibilityLabel(label)
                    .manicatStyle(styles.input)
                if status == .valid { Text("✓").font(.system(size: 16)).foregroundStyle(tokens.success).padding(.trailing, 12) }
            }
            .frame(minHeight: ManicatMetrics.controlHeight.md)
            .background(tokens.surface, in: RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl))
            .overlay(RoundedRectangle(cornerRadius: ManicatMetrics.radiusControl).stroke(message != nil ? tokens.danger : focused ? tokens.foreground : tokens.borderStrong, lineWidth: 1))
            .manicatStyle(styles.shell)
            if let message {
                Text(message).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.danger).manicatStyle(styles.hint)
            } else if let description {
                Text(description).font(.system(size: ManicatMetrics.textXs)).foregroundStyle(tokens.textMuted).manicatStyle(styles.hint)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .opacity(enabled ? 1 : 0.5)
        .onChange(of: value?.wrappedValue ?? "") { _, outside in adopt(outside) }
        .sheet(isPresented: $open) { picker.presentationDetents([.medium, .large]) }
    }

    private var picker: some View {
        let needle = query.trimmingCharacters(in: .whitespaces).lowercased().replacingOccurrences(of: "^\\+", with: "", options: .regularExpression)
        let matches = pool.filter { needle.isEmpty || $0.name.lowercased().contains(needle) || $0.dial.hasPrefix(needle) || $0.iso.lowercased() == needle }
        let suggested = needle.isEmpty ? pool.filter { preferredCountries.contains($0.iso) } : []

        return VStack(spacing: 0) {
            TextField("", text: $query, prompt: Text("Search country or +code").foregroundColor(tokens.textMuted))
                .textFieldStyle(.plain)
                .font(.system(size: ManicatMetrics.textSm))
                .foregroundStyle(tokens.foreground)
                .padding(.horizontal, ManicatMetrics.space.s4)
                .frame(minHeight: ManicatMetrics.controlHeight.lg)
                .overlay(alignment: .bottom) { Rectangle().fill(tokens.border).frame(height: 1) }
                .accessibilityLabel("Search country")
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    if !suggested.isEmpty {
                        group("Suggested")
                        ForEach(suggested) { option($0) }
                    }
                    group(needle.isEmpty ? "All countries" : "Results")
                    ForEach(matches) { option($0) }
                    if matches.isEmpty { Text("No country matches.").font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.textMuted).padding(ManicatMetrics.space.s4) }
                }
            }
        }
        .background(tokens.surface)
        .manicatStyle(styles.list)
    }

    private func group(_ title: String) -> some View {
        Text(title).font(.system(size: ManicatMetrics.textXs, weight: .medium)).foregroundStyle(tokens.textMuted).padding(.horizontal, ManicatMetrics.space.s4).padding(.top, ManicatMetrics.space.s3).padding(.bottom, 4)
    }

    private func option(_ entry: ManicatPhoneCountry) -> some View {
        Button {
            iso = entry.iso
            digits = ManicatPhone.capDigits(entry, digits)
            onCountryChange?(entry.iso)
            open = false
            query = ""
            emit(entry, digits)
        } label: {
            HStack(spacing: ManicatMetrics.space.s3) {
                Text(entry.flag).font(.system(size: 18))
                Text(entry.name).font(.system(size: ManicatMetrics.textSm)).foregroundStyle(tokens.foreground).frame(maxWidth: .infinity, alignment: .leading)
                Text("+\(entry.dial)").font(.system(size: ManicatMetrics.textXs).monospacedDigit()).foregroundStyle(tokens.textMuted)
            }
            .padding(.horizontal, ManicatMetrics.space.s4)
            .frame(minHeight: ManicatMetrics.controlHeight.md)
            .background(entry.iso == iso ? tokens.surfaceMuted : .clear)
            .contentShape(Rectangle())
            .manicatStyle(styles.option)
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(entry.iso == iso ? .isSelected : [])
    }

    private func emit(_ entry: ManicatPhoneCountry, _ national: String) {
        let e164 = ManicatPhone.toE164(entry, national)
        if let value, value.wrappedValue != e164 { value.wrappedValue = e164 }
        onValueChange?(e164, ManicatPhoneDetails(country: entry, formatted: ManicatPhone.formatNational(entry, national), status: ManicatPhone.status(entry, national)))
    }

    private func edit(_ text: String) {
        if text.trimmingCharacters(in: .whitespaces).hasPrefix("+") {
            if let parsed = ManicatPhone.parse(text, pool: pool) {
                if parsed.country.iso != iso { onCountryChange?(parsed.country.iso) }
                iso = parsed.country.iso
                digits = parsed.national
                emit(parsed.country, parsed.national)
                return
            }
            if text.trimmingCharacters(in: .whitespaces) == "+" {
                open = true
                return
            }
        }
        let next = ManicatPhone.capDigits(country, ManicatPhone.onlyDigits(text))
        digits = next
        emit(country, next)
    }

    /// A bound value that changed from outside replaces what was typed.
    private func adopt(_ outside: String) {
        guard let parsed = ManicatPhone.parse(outside, pool: pool), ManicatPhone.toE164(parsed.country, parsed.national) != ManicatPhone.toE164(country, digits) else { return }
        iso = parsed.country.iso
        digits = parsed.national
    }
}
