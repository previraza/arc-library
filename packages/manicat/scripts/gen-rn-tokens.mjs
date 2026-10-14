/**
 * Generates the React Native colour tokens from registry/foundation.css, so the native values are the web values: every `oklch()` is
 * converted to sRGB and every `var()` chain is resolved, for the light and dark themes and for each accent.
 *
 *   node scripts/gen-rn-tokens.mjs
 *
 * It rewrites the region between the `<generated>` markers of lib/rn-tokens.ts.
 */
import { readFileSync, writeFileSync } from "node:fs";

const css = readFileSync(new URL("../registry/foundation.css", import.meta.url), "utf8");

/** The declarations of every rule whose selector is exactly `selector`, merged in order. */
function declarations(selector) {
  const out = {};
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  for (const match of css.matchAll(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`, "g"))) {
    for (const line of match[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[line[1]] = line[2].trim();
  }
  return out;
}

const light = declarations(":root");
const dark = { ...light, ...declarations(':root[data-theme="dark"]') };
const accents = ["neutral", "violet", "blue", "green", "amber", "orange", "coral", "rose"];

const gamma = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
function oklch(l, c, h, alpha = 1) {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_, -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_, -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_];
  return [...rgb.map((v) => Math.round(Math.min(1, Math.max(0, gamma(v))) * 255)), alpha];
}

function toColor(value) {
  value = value.trim();
  let m;
  if ((m = value.match(/^#([0-9a-f]{3,8})$/i))) {
    const hex = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)).concat(hex.length === 8 ? parseInt(hex.slice(6), 16) / 255 : 1);
  }
  if ((m = value.match(/^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)$/))) return oklch(m[2] ? Number(m[1]) / 100 : Number(m[1]), Number(m[3]), Number(m[4]), m[5] ? Number(m[5]) : 1);
  if ((m = value.match(/^rgb\(\s*(\d+)\s+(\d+)\s+(\d+)(?:\s*\/\s*([\d.]+))?\s*\)$/))) return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] ? Number(m[4]) : 1];
  throw new Error(`Cannot convert ${value}`);
}
const format = ([r, g, b, a]) => (a < 1 ? `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(3))})` : `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`);

function resolve(vars, name, depth = 0) {
  const value = vars[name];
  if (value === undefined || depth > 8) throw new Error(`Unresolved ${name}`);
  const ref = value.match(/^var\((--[\w-]+)\)$/);
  return ref ? resolve(vars, ref[1], depth + 1) : value;
}
const color = (vars, name) => format(toColor(resolve(vars, name)));

const map = {
  background: "--background", surface: "--surface", surfaceRaised: "--surface-raised", surfaceMuted: "--surface-muted", foreground: "--foreground",
  textSecondary: "--text-secondary", textMuted: "--text-muted", border: "--border", borderSubtle: "--border-subtle", borderStrong: "--border-strong",
  accent: "--accent", accentStrong: "--accent-strong", accentSubtle: "--accent-subtle", accentForeground: "--accent-foreground",
  success: "--success", warning: "--warning", danger: "--danger",
  controlOn: "--control-on", controlGlyph: "--control-glyph", controlTrack: "--control-track", controlThumb: "--control-thumb", controlThumbOn: "--control-thumb-on", controlFill: "--control-fill",
};
const series = ["--series-1", "--series-2", "--series-3", "--series-4"];

function theme(vars) {
  const lines = Object.entries(map).map(([key, name]) => `  ${key}: "${color(vars, name)}",`);
  lines.push(`  series: [${series.map((name) => `"${color(vars, name)}"`).join(", ")}],`);
  return lines.join("\n");
}

/** One accent's overrides for a theme, as the tokens it changes. */
function accent(vars, name, dark) {
  const prefix = dark ? `:root[data-theme="dark"][data-accent="${name}"]` : `:root[data-accent="${name}"]`;
  const own = { ...vars, ...declarations(`:root[data-accent="${name}"]`), ...(dark ? declarations(prefix) : {}) };
  const keys = { accent: "--accent", accentStrong: "--accent-strong", accentSubtle: "--accent-subtle", accentForeground: "--accent-foreground", controlOn: "--control-on", controlGlyph: "--control-glyph", controlThumbOn: "--control-thumb-on", controlFill: "--control-fill" };
  // Accent-foreground defaults to the background, which an accent block may leave alone.
  return Object.entries(keys).map(([key, cssName]) => `${key}: "${color({ ...own, "--accent-foreground": own["--accent-foreground"] ?? vars["--accent-foreground"] }, cssName)}"`).join(", ");
}

const radii = ["--radius-control", "--radius-panel", "--radius-surface"].map((n) => parseFloat(light[n]) * 16);
const generated = `// <generated> by scripts/gen-rn-tokens.mjs from registry/foundation.css. Do not edit by hand.
export const lightTokens: ManicatTokens = {
${theme(light)}
};

export const darkTokens: ManicatTokens = {
${theme(dark)}
};

/** The accent presets of foundation.css: the tokens each one changes, per theme. Spread one over the base tokens to rebrand. */
export const accents = {
${accents.map((name) => `  ${name}: { light: { ${accent(light, name, false)} }, dark: { ${accent(dark, name, true)} } },`).join("\n")}
} as const satisfies Record<string, { light: Partial<ManicatTokens>; dark: Partial<ManicatTokens> }>;

/** Radii from foundation.css, in density-independent pixels. */
export const radii = { control: ${radii[0]}, panel: ${radii[1]}, surface: ${radii[2]}, pill: 9999 } as const;
// </generated>`;

const target = new URL("../lib/rn-tokens.ts", import.meta.url);
let source = readFileSync(target, "utf8");
if (source.includes("// <generated>")) source = source.replace(/\/\/ <generated>[\s\S]*\/\/ <\/generated>/, generated);
else source = source.replace(/export const lightTokens[\s\S]*?\n};\n\nexport const darkTokens[\s\S]*?\n};/, generated);
writeFileSync(target, source);
console.log("rn-tokens.ts regenerated");

// The SwiftUI tokens carry the same values, so the three platforms never drift.
const hex = (vars, name) => {
  const [r, g, b, a] = toColor(resolve(vars, name));
  const text = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  return a < 1 ? `Color(hex: "${text}", opacity: ${Number(a.toFixed(3))})` : `Color(hex: "${text}")`;
};
const swiftTheme = (vars) => {
  const c = (key) => `${key}: ${hex(vars, map[key])}`;
  return `        ${["background", "surface", "surfaceRaised", "surfaceMuted"].map(c).join(", ")},
        ${["foreground", "textSecondary", "textMuted"].map(c).join(", ")},
        ${["border", "borderSubtle", "borderStrong"].map(c).join(", ")},
        ${["accent", "accentStrong", "accentSubtle", "accentForeground"].map(c).join(", ")},
        ${["success", "warning", "danger"].map(c).join(", ")},
        ${["controlOn", "controlGlyph", "controlFill", "controlTrack", "controlThumb", "controlThumbOn"].map(c).join(", ")},
        series: [${series.map((name) => hex(vars, name)).join(", ")}]`;
};
const swiftTarget = new URL("../lib/ManicatTokens.swift", import.meta.url);
let swift = readFileSync(swiftTarget, "utf8");
swift = swift.replace(/ {4}public let background[\s\S]*? {4}public let controlOn, controlTrack, controlThumb, controlThumbOn: Color\n/, `    public let background, surface, surfaceRaised, surfaceMuted, foreground, textSecondary, textMuted: Color
    public let border, borderSubtle, borderStrong: Color
    public let accent, accentStrong, accentSubtle, accentForeground: Color
    public let success, warning, danger: Color
    public let controlOn, controlGlyph, controlFill, controlTrack, controlThumb, controlThumbOn: Color
`);
swift = swift.replace(/ {4}public static let light = ManicatTokens\([\s\S]*?\n {4}\)\n/, `    public static let light = ManicatTokens(\n${swiftTheme(light)}\n    )\n`);
swift = swift.replace(/ {4}public static let dark = ManicatTokens\([\s\S]*?\n {4}\)\n/, `    public static let dark = ManicatTokens(\n${swiftTheme(dark)}\n    )\n`);
const accentKeys = { accent: "--accent", accentStrong: "--accent-strong", accentSubtle: "--accent-subtle", accentForeground: "--accent-foreground", controlOn: "--control-on", controlGlyph: "--control-glyph", controlThumbOn: "--control-thumb-on", controlFill: "--control-fill" };
const swiftAccent = (vars, name, isDark) => {
  const own = { ...vars, ...declarations(`:root[data-accent="${name}"]`), ...(isDark ? declarations(`:root[data-theme="dark"][data-accent="${name}"]`) : {}) };
  own["--accent-foreground"] ??= vars["--accent-foreground"];
  return `[${Object.entries(accentKeys).map(([key, cssName]) => `"${key}": ${hex(own, cssName)}`).join(", ")}]`;
};
const accentBlock = `// <accents>
/// The accent presets of foundation.css, as the colours each one changes per theme. Generated by scripts/gen-rn-tokens.mjs.
public enum ManicatAccents {
    public static let presets: [String: (light: [String: Color], dark: [String: Color])] = [
${accents.map((name) => `        "${name}": (light: ${swiftAccent(light, name, false)}, dark: ${swiftAccent(dark, name, true)}),`).join("\n")}
    ]
}
// </accents>`;
swift = swift.includes("// <accents>") ? swift.replace(/\/\/ <accents>[\s\S]*\/\/ <\/accents>/, accentBlock) : swift.replace("/// Shape and rhythm shared by every component, in points.", `${accentBlock}\n\n/// Shape and rhythm shared by every component, in points.`);
writeFileSync(swiftTarget, swift);
console.log("ManicatTokens.swift regenerated");
