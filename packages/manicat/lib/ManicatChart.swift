import SwiftUI

/// Geometry shared by the chart ports: the Swift counterpart of lib/chart.ts. Pure functions that turn data into scales, ticks
/// and SwiftUI `Path`s, and leave drawing to each port.
public enum ManicatChart {
    public enum Curve { case smooth, linear }

    /// Maps a value from a domain to a range, like d3's linear scale.
    public struct Scale {
        public let domain: (Double, Double)
        public let range: (Double, Double)

        public func callAsFunction(_ value: Double) -> Double {
            domain.1 == domain.0 ? (range.0 + range.1) / 2 : range.0 + ((value - domain.0) / (domain.1 - domain.0)) * (range.1 - range.0)
        }
    }

    public static func linearScale(domain: (Double, Double), range: (Double, Double)) -> Scale {
        Scale(domain: domain, range: range)
    }

    /// A tidy upper bound for a data maximum: 1, 2, 2.5, 5 or 10 times a power of ten.
    public static func niceMax(_ max: Double) -> Double {
        if max <= 0 { return 1 }
        let power = pow(10, floor(log10(max)))
        let fraction = max / power
        let step: Double = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10
        return step * power
    }

    /// `count + 1` evenly spaced tick values from 0 to a nice maximum.
    public static func ticks(_ max: Double, count: Int = 4) -> [Double] {
        let top = niceMax(max)
        return (0...count).map { top / Double(count) * Double($0) }
    }

    /// 1,200 reads 1.2K, like the web's compact notation.
    public static func compact(_ value: Double) -> String {
        let size = abs(value)
        let (scale, unit): (Double, String) = size >= 1e9 ? (1e9, "B") : size >= 1e6 ? (1e6, "M") : size >= 1e3 ? (1e3, "K") : (1, "")
        let scaled = (value / scale * 10).rounded() / 10
        return (scaled == scaled.rounded() ? String(Int(scaled)) : String(scaled)) + unit
    }

    /// A straight polyline, or a smooth curve through the points (Catmull-Rom converted to cubic Béziers).
    public static func linePath(_ points: [CGPoint], curve: Curve = .smooth) -> Path {
        var path = Path()
        guard let first = points.first else { return path }
        path.move(to: first)
        if points.count == 1 { return path }
        if curve == .linear {
            for point in points.dropFirst() { path.addLine(to: point) }
            return path
        }
        for index in 0..<(points.count - 1) {
            let p0 = index > 0 ? points[index - 1] : points[index]
            let p1 = points[index]
            let p2 = points[index + 1]
            let p3 = index + 2 < points.count ? points[index + 2] : p2
            let c1 = CGPoint(x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6)
            let c2 = CGPoint(x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6)
            path.addCurve(to: p2, control1: c1, control2: c2)
        }
        return path
    }

    /// The area between a line and the baseline `y0`.
    public static func areaPath(_ points: [CGPoint], baseline y0: CGFloat, curve: Curve = .smooth) -> Path {
        var path = linePath(points, curve: curve)
        guard let first = points.first, let last = points.last else { return path }
        path.addLine(to: CGPoint(x: last.x, y: y0))
        path.addLine(to: CGPoint(x: first.x, y: y0))
        path.closeSubpath()
        return path
    }

    /// A band between an upper and a lower line, for stacked areas.
    public static func bandPath(upper: [CGPoint], lower: [CGPoint], curve: Curve = .smooth) -> Path {
        var path = linePath(upper, curve: curve)
        let back = Array(lower.reversed())
        guard let start = back.first else { return path }
        path.addLine(to: start)
        path.addPath(linePath(back, curve: curve))
        path.closeSubpath()
        return path
    }

    /// A ring segment from `a0` to `a1` radians (0 is 12 o'clock, clockwise).
    public static func arcPath(center: CGPoint, outer: CGFloat, inner: CGFloat, from a0: Double, to a1: Double) -> Path {
        let sweep = min(a1 - a0, Double.pi * 2 - 0.0001)
        let end = a0 + sweep
        func point(_ radius: CGFloat, _ angle: Double) -> CGPoint {
            CGPoint(x: center.x + radius * CGFloat(sin(angle)), y: center.y - radius * CGFloat(cos(angle)))
        }
        // SwiftUI measures arcs from 3 o'clock, so the angles are shifted a quarter turn.
        let quarter = Angle.radians(-Double.pi / 2)
        var path = Path()
        path.move(to: point(outer, a0))
        path.addArc(center: center, radius: outer, startAngle: .radians(a0) + quarter, endAngle: .radians(end) + quarter, clockwise: false)
        path.addLine(to: point(inner, end))
        path.addArc(center: center, radius: inner, startAngle: .radians(end) + quarter, endAngle: .radians(a0) + quarter, clockwise: true)
        path.closeSubpath()
        return path
    }

    /// Squarified treemap: lays `values` out in `rect`, keeping cells close to square. Returns one rect per value, in input order.
    public static func squarify(_ values: [Double], in rect: CGRect) -> [CGRect] {
        let total = values.reduce(0, +)
        if total <= 0 { return values.map { _ in CGRect(x: rect.minX, y: rect.minY, width: 0, height: 0) } }
        var out = [CGRect](repeating: .zero, count: values.count)
        let order = values.enumerated().map { (index: $0.offset, value: $0.element) }.sorted { $0.value > $1.value }
        var free = rect
        var remaining = total
        var row: [(index: Int, value: Double)] = []

        func worst(_ items: [(index: Int, value: Double)], side: Double, scale: Double) -> Double {
            let scaled = items.map { $0.value * scale }
            let sum = scaled.reduce(0, +)
            let largest = scaled.max() ?? 0
            let smallest = scaled.min() ?? 0
            return max(side * side * largest / (sum * sum), sum * sum / (side * side * smallest))
        }

        func place(_ items: [(index: Int, value: Double)], scale: Double) {
            let sum = items.reduce(0) { $0 + $1.value * scale }
            let horizontal = free.width >= free.height
            let thickness = sum / Double(horizontal ? free.height : free.width)
            var offset = 0.0
            for item in items {
                let length = item.value * scale / thickness
                out[item.index] = horizontal
                    ? CGRect(x: free.minX, y: free.minY + offset, width: thickness, height: length)
                    : CGRect(x: free.minX + offset, y: free.minY, width: length, height: thickness)
                offset += length
            }
            free = horizontal
                ? CGRect(x: free.minX + thickness, y: free.minY, width: free.width - thickness, height: free.height)
                : CGRect(x: free.minX, y: free.minY + thickness, width: free.width, height: free.height - thickness)
            remaining -= items.reduce(0) { $0 + $1.value }
        }

        for item in order {
            let scale = Double(free.width * free.height) / remaining
            let side = Double(min(free.width, free.height))
            if row.isEmpty || worst(row + [item], side: side, scale: scale) <= worst(row, side: side, scale: scale) {
                row.append(item)
            } else {
                place(row, scale: scale)
                row = [item]
            }
        }
        if !row.isEmpty { place(row, scale: Double(free.width * free.height) / remaining) }
        return out
    }
}
