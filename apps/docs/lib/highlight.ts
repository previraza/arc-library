import { codeToHtml } from "shiki";

/** One pair of themes for the whole site, switched by the class next-themes writes on <html>. */
const themes = { light: "github-light", dark: "github-dark" } as const;

const languages: Record<string, string> = {
  ".css": "css",
  ".js": "js",
  ".jsx": "jsx",
  ".json": "json",
  ".mjs": "js",
  ".ts": "ts",
  ".tsx": "tsx",
};

/** The Shiki language of a file, from its extension. Unknown extensions fall back to plain text. */
export function languageOf(path: string): string {
  const match = /\.[a-z0-9]+$/i.exec(path);
  return match ? (languages[match[0].toLowerCase()] ?? "text") : "text";
}

/**
 * Highlights source on the server, so the item pages ship finished markup instead of a highlighter bundle.
 * An unsupported language degrades to an empty string and the caller renders the raw text.
 */
export async function highlight(code: string, lang: string): Promise<string> {
  if (lang === "text") return "";

  try {
    return await codeToHtml(code, { lang, themes, defaultColor: false });
  } catch {
    return "";
  }
}