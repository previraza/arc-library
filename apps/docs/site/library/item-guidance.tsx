import type { ReactNode } from "react";
import { decisionIds, type GuidanceSection } from "@/lib/guidance";

/** Inline `code` is the only inline markup the snapshot uses. */
function inline(text: string): ReactNode[] {
  return text.split(/(`[^`]+`)/g).map((part, index) =>
    part.startsWith("`") && part.endsWith("`") ? (
      <code key={index} className="rounded bg-fd-muted px-1 py-0.5 font-mono text-[0.85em] text-fd-foreground">
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    ),
  );
}

/** Renders the three shapes the guidance snapshot contains: bullet lists, a table, and paragraphs. */
function Markdown({ source }: { source: string }) {
  const lines = source.split("\n");
  const blocks: ReactNode[] = [];

  for (let index = 0; index < lines.length; ) {
    const line = lines[index];
    if (line.startsWith("|")) {
      const rows: string[][] = [];
      while (index < lines.length && lines[index].startsWith("|")) {
        const cells = lines[index].split("|").slice(1, -1).map((cell) => cell.trim());
        if (!cells.every((cell) => /^-+$/.test(cell))) rows.push(cells);
        index += 1;
      }
      const [head, ...body] = rows;
      blocks.push(
        <div key={blocks.length} className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-fd-border text-xs uppercase tracking-wide text-fd-muted-foreground">
                {head.map((cell) => (
                  <th key={cell} className="py-2 pr-4 font-medium">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-fd-border/60 align-top last:border-0">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className={cellIndex === 0 ? "py-2.5 pr-4 font-mono text-xs text-fd-foreground" : "py-2.5 text-fd-muted-foreground"}>
                      {inline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
    } else if (line.startsWith("- ")) {
      const items: string[] = [];
      while (index < lines.length && lines[index].startsWith("- ")) {
        items.push(lines[index].slice(2));
        index += 1;
      }
      blocks.push(
        <ul key={blocks.length} className="grid list-disc gap-1.5 pl-5 text-sm text-fd-muted-foreground marker:text-fd-muted-foreground/60">
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{inline(item)}</li>
          ))}
        </ul>,
      );
    } else if (line.trim()) {
      blocks.push(
        <p key={blocks.length} className="text-sm text-fd-muted-foreground">
          {inline(line)}
        </p>,
      );
      index += 1;
    } else {
      index += 1;
    }
  }

  return <div className="grid gap-3">{blocks}</div>;
}

/** "When to use" and "When not to use", side by side right under the preview. */
export function ItemDecision({ sections }: { sections: GuidanceSection[] }) {
  const decision = sections.filter((section) => (decisionIds as readonly string[]).includes(section.id));
  if (decision.length === 0) return null;

  return (
    <section id="when-to-use" className="grid scroll-mt-24 gap-4 sm:grid-cols-2">
      {decision.map((section) => (
        <div key={section.id} className="grid content-start gap-3 rounded-[var(--radius-panel)] border border-fd-border bg-fd-card p-5">
          <h2 className="text-sm font-medium text-fd-foreground">{section.title}</h2>
          <Markdown source={section.markdown} />
        </div>
      ))}
    </section>
  );
}

/** Keyboard, accessibility, motion, responsive behavior, performance and notes for AI. */
export function ItemDetails({ sections }: { sections: GuidanceSection[] }) {
  const details = sections.filter((section) => !(decisionIds as readonly string[]).includes(section.id));

  return (
    <>
      {details.map((section) => (
        <section key={section.id} id={section.id} className="grid scroll-mt-24 gap-3">
          <h2 className="text-lg font-medium tracking-(--tracking-display) text-fd-foreground">{section.title}</h2>
          <Markdown source={section.markdown} />
        </section>
      ))}
    </>
  );
}
