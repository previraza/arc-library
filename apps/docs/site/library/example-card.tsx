import type { ReactNode } from "react";
import { CodeBlock } from "@/site/library/code-block";
import { PreviewShell } from "@/site/library/preview-shell";

export type ExampleCardProps = {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  code: string;
  html?: string;
  /** The live, rendered example. */
  children: ReactNode;
  /** Plain surface without the dot grid, for examples that draw their own background. */
  bare?: boolean;
};

/** One example: a title, then the live render and the exact code behind it, ready to paste into an app. */
export function ExampleCard({ id, title, description, fileName, code, html, children, bare }: ExampleCardProps) {
  return (
    <section id={id} className="grid scroll-mt-24 gap-3">
      <div className="grid gap-1">
        <h3 className="text-base font-medium text-fd-foreground">{title}</h3>
        {description && <p className="max-w-2xl text-sm text-fd-muted-foreground">{description}</p>}
      </div>
      <PreviewShell
        label={`${title} preview`}
        bare={bare}
        frameSrc={`/frame/example/${id}`}
        code={<CodeBlock label={fileName} lang="tsx" html={html} code={code} maxHeight={520} />}
      >
        {children}
      </PreviewShell>
    </section>
  );
}
