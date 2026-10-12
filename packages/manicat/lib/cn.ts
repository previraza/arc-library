/** Joins class names, dropping the empty ones, so callers can pass boolean flags and optional strings. */
export function cn(...classes: ReadonlyArray<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}