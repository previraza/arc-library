import type { ReactNode } from "react";
import { CodeBlock } from "@/site/library/code-block";
import { FrameworkPreview } from "@/site/library/framework-preview";
import { PreviewShell } from "@/site/library/preview-shell";
import type { UsagePanel } from "@/site/library/usage-panels";

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
  /** The same example for the other frameworks it is written for. */
  ports?: UsagePanel[];
};

/** One example: a title, then the live render and the exact code behind it, ready to paste into an app. */
export function ExampleCard({ id, title, description, fileName, code, html, children, bare, ports = [] }: ExampleCardProps) {
  return (
    <section id={id} className="grid scroll-mt-24 gap-3">
      <div className="grid gap-1">
        <h3 className="text-base font-medium text-fd-foreground">{title}</h3>
        {description && <p className="max-w-2xl text-sm text-fd-muted-foreground">{description}</p>}
      </div>
      <FrameworkPreview name={`example:${id}`} options={[{ id: "react", label: "React" }, ...ports]} codes={ports}>
        <PreviewShell
          label={`${title} preview`}
          bare={bare}
          frameSrc={`/frame/example/${id}`}
          code={<CodeBlock label={fileName} lang="tsx" html={html} code={code} maxHeight={520} />}
        >
          {children}
        </PreviewShell>
      </FrameworkPreview>
    </section>
  );
}
