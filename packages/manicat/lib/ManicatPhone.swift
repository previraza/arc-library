import Foundation

/// Framework-neutral phone number logic for the Swift phone-input: the same table of about fifty countries, patterns and
/// helpers as `lib/phone.ts`, so a number formats and validates the same way in every framework.
public struct ManicatPhoneCountry: Identifiable, Equatable {
    /// ISO 3166-1 alpha-2 code, such as "US".
    public let iso: String
    public let name: String
    /// Country calling code without the plus, such as "44".
    public let dial: String
    /// National formats from shortest to longest. `#` is a digit, anything else is a separator.
    public let patterns: [String]
    /// A realistic national number, used for the placeholder.
    public let example: String
    /// A national number people may type before the number itself, such as "0" in "07911 123456".
    public let trunk: String
    /// Area codes that pick this country when several share a calling code, such as Canada inside +1.
    public let areaCodes: [String]?

    public var id: String { iso }

    public init(iso: String, name: String, dial: String, patterns: [String], example: String, trunk: String = "0", areaCodes: [String]? = nil) {
        self.iso = iso
        self.name = name
        self.dial = dial
        self.patterns = patterns
        self.example = example
        self.trunk = trunk
        self.areaCodes = areaCodes
    }

    /// Regional indicator letters. Platforms without flag glyphs show the two letters, which still read.
    public var flag: String {
        String(String.UnicodeScalarView(iso.uppercased().unicodeScalars.compactMap { UnicodeScalar(0x1f1e6 + $0.value - 65) }))
    }
}

public enum ManicatPhoneStatus { case empty, incomplete, valid, tooLong }

public enum ManicatPhone {
    public static let countries: [ManicatPhoneCountry] = [
        ManicatPhoneCountry(iso: "US", name: "United States", dial: "1", patterns: ["(###) ###-####"], example: "2015550123", trunk: "1"),
        ManicatPhoneCountry(iso: "CA", name: "Canada", dial: "1", patterns: ["(###) ###-####"], example: "5065550123", trunk: "1", areaCodes: ["204", "226", "236", "249", "250", "263", "289", "306", "343", "354", "365", "367", "368", "382", "387", "403", "416", "418", "428", "431", "437", "438", "450", "468", "474", "506", "514", "519", "548", "579", "581", "584", "587", "604", "613", "639", "647", "672", "683", "705", "709", "742", "753", "778", "780", "782", "807", "819", "825", "867", "873", "879", "902", "905"]),
        ManicatPhoneCountry(iso: "MX", name: "Mexico", dial: "52", patterns: ["## #### ####"], example: "2221234567", trunk: ""),
        ManicatPhoneCountry(iso: "BR", name: "Brazil", dial: "55", patterns: ["(##) ####-####", "(##) #####-####"], example: "11961234567", trunk: "0"),
        ManicatPhoneCountry(iso: "AR", name: "Argentina", dial: "54", patterns: ["## ####-####"], example: "1123456789", trunk: "0"),
        ManicatPhoneCountry(iso: "CO", name: "Colombia", dial: "57", patterns: ["### ### ####"], example: "3211234567", trunk: ""),
        ManicatPhoneCountry(iso: "CL", name: "Chile", dial: "56", patterns: ["# #### ####"], example: "221234567", trunk: ""),
        ManicatPhoneCountry(iso: "PE", name: "Peru", dial: "51", patterns: ["### ### ###"], example: "912345678", trunk: "0"),
        ManicatPhoneCountry(iso: "GB", name: "United Kingdom", dial: "44", patterns: ["#### ######"], example: "7400123456", trunk: "0"),
        ManicatPhoneCountry(iso: "IE", name: "Ireland", dial: "353", patterns: ["## ### ####"], example: "850123456", trunk: "0"),
        ManicatPhoneCountry(iso: "FR", name: "France", dial: "33", patterns: ["# ## ## ## ##"], example: "612345678", trunk: "0"),
        ManicatPhoneCountry(iso: "DE", name: "Germany", dial: "49", patterns: ["### #######", "### ########"], example: "15123456789", trunk: "0"),
        ManicatPhoneCountry(iso: "ES", name: "Spain", dial: "34", patterns: ["### ## ## ##"], example: "612345678", trunk: ""),
        ManicatPhoneCountry(iso: "IT", name: "Italy", dial: "39", patterns: ["### ### ###", "### ### ####"], example: "3123456789", trunk: ""),
        ManicatPhoneCountry(iso: "PT", name: "Portugal", dial: "351", patterns: ["### ### ###"], example: "912345678", trunk: ""),
        ManicatPhoneCountry(iso: "NL", name: "Netherlands", dial: "31", patterns: ["# ########"], example: "612345678", trunk: "0"),
        ManicatPhoneCountry(iso: "BE", name: "Belgium", dial: "32", patterns: ["### ## ## ##"], example: "470123456", trunk: "0"),
        ManicatPhoneCountry(iso: "CH", name: "Switzerland", dial: "41", patterns: ["## ### ## ##"], example: "781234567", trunk: "0"),
        ManicatPhoneCountry(iso: "AT", name: "Austria", dial: "43", patterns: ["### #######", "### ########"], example: "6641234567", trunk: "0"),
        ManicatPhoneCountry(iso: "SE", name: "Sweden", dial: "46", patterns: ["## ### ## ##"], example: "701234567", trunk: "0"),
        ManicatPhoneCountry(iso: "NO", name: "Norway", dial: "47", patterns: ["### ## ###"], example: "40612345", trunk: ""),
        ManicatPhoneCountry(iso: "DK", name: "Denmark", dial: "45", patterns: ["## ## ## ##"], example: "32123456", trunk: ""),
        ManicatPhoneCountry(iso: "FI", name: "Finland", dial: "358", patterns: ["## ### ####", "## ### #####"], example: "412345678", trunk: "0"),
        ManicatPhoneCountry(iso: "PL", name: "Poland", dial: "48", patterns: ["### ### ###"], example: "512345678", trunk: ""),
        ManicatPhoneCountry(iso: "CZ", name: "Czechia", dial: "420", patterns: ["### ### ###"], example: "601123456", trunk: ""),
        ManicatPhoneCountry(iso: "GR", name: "Greece", dial: "30", patterns: ["### ### ####"], example: "6912345678", trunk: ""),
        ManicatPhoneCountry(iso: "UA", name: "Ukraine", dial: "380", patterns: ["## ### ## ##"], example: "501234567", trunk: "0"),
        ManicatPhoneCountry(iso: "TR", name: "Turkey", dial: "90", patterns: ["### ### ## ##"], example: "5012345678", trunk: "0"),
        ManicatPhoneCountry(iso: "IL", name: "Israel", dial: "972", patterns: ["##-###-####"], example: "502345678", trunk: "0"),
        ManicatPhoneCountry(iso: "AE", name: "United Arab Emirates", dial: "971", patterns: ["## ### ####"], example: "501234567", trunk: "0"),
        ManicatPhoneCountry(iso: "SA", name: "Saudi Arabia", dial: "966", patterns: ["## ### ####"], example: "512345678", trunk: "0"),
        ManicatPhoneCountry(iso: "EG", name: "Egypt", dial: "20", patterns: ["### ### ####"], example: "1001234567", trunk: "0"),
        ManicatPhoneCountry(iso: "NG", name: "Nigeria", dial: "234", patterns: ["### ### ####"], example: "8021234567", trunk: "0"),
        ManicatPhoneCountry(iso: "KE", name: "Kenya", dial: "254", patterns: ["### ######"], example: "712123456", trunk: "0"),
        ManicatPhoneCountry(iso: "ZA", name: "South Africa", dial: "27", patterns: ["## ### ####"], example: "711234567", trunk: "0"),
        ManicatPhoneCountry(iso: "IN", name: "India", dial: "91", patterns: ["#####-#####"], example: "8123456789", trunk: "0"),
        ManicatPhoneCountry(iso: "PK", name: "Pakistan", dial: "92", patterns: ["### #######"], example: "3012345678", trunk: "0"),
        ManicatPhoneCountry(iso: "CN", name: "China", dial: "86", patterns: ["### #### ####"], example: "13123456789", trunk: "0"),
        ManicatPhoneCountry(iso: "JP", name: "Japan", dial: "81", patterns: ["##-####-####"], example: "9012345678", trunk: "0"),
        ManicatPhoneCountry(iso: "KR", name: "South Korea", dial: "82", patterns: ["##-###-####", "##-####-####"], example: "1020000000", trunk: "0"),
        ManicatPhoneCountry(iso: "TW", name: "Taiwan", dial: "886", patterns: ["### ### ###"], example: "912345678", trunk: "0"),
        ManicatPhoneCountry(iso: "HK", name: "Hong Kong", dial: "852", patterns: ["#### ####"], example: "51234567", trunk: ""),
        ManicatPhoneCountry(iso: "SG", name: "Singapore", dial: "65", patterns: ["#### ####"], example: "81234567", trunk: ""),
        ManicatPhoneCountry(iso: "PH", name: "Philippines", dial: "63", patterns: ["### ### ####"], example: "9051234567", trunk: "0"),
        ManicatPhoneCountry(iso: "ID", name: "Indonesia", dial: "62", patterns: ["###-###-####", "###-####-####", "###-####-#####"], example: "81234567890", trunk: "0"),
        ManicatPhoneCountry(iso: "TH", name: "Thailand", dial: "66", patterns: ["## ### ####"], example: "812345678", trunk: "0"),
        ManicatPhoneCountry(iso: "VN", name: "Vietnam", dial: "84", patterns: ["## ### ## ##"], example: "912345678", trunk: "0"),
        ManicatPhoneCountry(iso: "AU", name: "Australia", dial: "61", patterns: ["### ### ###"], example: "412345678", trunk: "0"),
        ManicatPhoneCountry(iso: "NZ", name: "New Zealand", dial: "64", patterns: ["# ### ####", "## ### ####", "## #### ####"], example: "211234567", trunk: "0"),
    ]

    public static func country(_ iso: String) -> ManicatPhoneCountry? { countries.first { $0.iso == iso } }

    static func capacity(_ pattern: String) -> Int { pattern.filter { $0 == "#" }.count }
    static func lengths(_ entry: ManicatPhoneCountry) -> [Int] { entry.patterns.map(capacity) }

    public static func onlyDigits(_ text: String) -> String { text.filter { $0.isASCII && $0.isNumber } }

    /// A typed trunk prefix earns its own room; without one the longest valid length is the cap.
    public static func capDigits(_ entry: ManicatPhoneCountry, _ digits: String) -> String {
        String(digits.prefix(splitTrunk(entry, digits).trunk.count + (lengths(entry).max() ?? 0)))
    }

    public static func splitTrunk(_ entry: ManicatPhoneCountry, _ digits: String) -> (trunk: String, rest: String) {
        !entry.trunk.isEmpty && digits.hasPrefix(entry.trunk) ? (entry.trunk, String(digits.dropFirst(entry.trunk.count))) : ("", digits)
    }

    /// Separators only print while digits follow, so a half typed number never ends in a dangling ") " or "-".
    static func applyPattern(_ digits: String, _ pattern: String) -> String {
        let chars = Array(digits)
        var out = "", index = 0
        for char in pattern {
            if index >= chars.count { break }
            if char == "#" {
                out.append(chars[index])
                index += 1
            } else {
                out.append(char)
            }
        }
        return out + String(chars[index...])
    }

    static func pattern(for entry: ManicatPhoneCountry, length: Int) -> String {
        entry.patterns.first { capacity($0) >= length } ?? entry.patterns[entry.patterns.count - 1]
    }

    /// Formats national digits as typed, keeping a typed trunk prefix: "07911123456" in the UK reads "07911 123456".
    public static func formatNational(_ entry: ManicatPhoneCountry, _ digits: String) -> String {
        let (trunk, rest) = splitTrunk(entry, digits)
        let chosen = pattern(for: entry, length: rest.count)
        let body = applyPattern(rest, chosen)
        if trunk.isEmpty { return body }
        if rest.isEmpty { return trunk }
        return trunk + (chosen.hasPrefix("#") ? "" : " ") + body
    }

    public static func status(_ entry: ManicatPhoneCountry, _ digits: String) -> ManicatPhoneStatus {
        let length = splitTrunk(entry, digits).rest.count
        let all = lengths(entry)
        if length == 0 { return .empty }
        if all.contains(length) { return .valid }
        return length > (all.max() ?? 0) ? .tooLong : .incomplete
    }

    public static func toE164(_ entry: ManicatPhoneCountry, _ digits: String) -> String {
        let rest = splitTrunk(entry, digits).rest
        return rest.isEmpty ? "" : "+\(entry.dial)\(rest)"
    }

    /// Reads "+44 (0)7911 123456", "0044 7911…", or "+14165550123" into a country and national digits. Longest calling code wins.
    public static func parse(_ input: String, pool: [ManicatPhoneCountry] = ManicatPhone.countries) -> (country: ManicatPhoneCountry, national: String)? {
        let trimmed = input.trimmingCharacters(in: .whitespaces)
        var digits = onlyDigits(trimmed)
        if !trimmed.hasPrefix("+") {
            guard trimmed.hasPrefix("00") else { return nil }
            digits = String(digits.dropFirst(2))
        }
        for size in [3, 2, 1] {
            let dial = String(digits.prefix(size))
            let matches = pool.filter { $0.dial == dial }
            if matches.isEmpty { continue }
            var rest = String(digits.dropFirst(size))
            let entry = matches.first { item in item.areaCodes?.contains { rest.hasPrefix($0) } ?? false } ?? matches.first { $0.areaCodes == nil } ?? matches[0]
            // "+44 (0)7911…" carries a trunk zero it should not; drop it when the rest is still a full number without it.
            if !entry.trunk.isEmpty, rest.hasPrefix(entry.trunk), rest.count - entry.trunk.count >= (lengths(entry).min() ?? 0) { rest = String(rest.dropFirst(entry.trunk.count)) }
            return (entry, capDigits(entry, rest))
        }
        return nil
    }

    /// Formats an E.164 number for display, such as "+44 7400 123456". Returns the input when it cannot be read.
    public static func format(_ e164: String) -> String {
        guard let parsed = parse(e164) else { return e164 }
        return "+\(parsed.country.dial) \(formatNational(parsed.country, parsed.national))"
    }
}
