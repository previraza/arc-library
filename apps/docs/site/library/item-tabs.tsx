"use client";

import { useState } from "react";
import { Terminal } from "lucide-react";
import { CopyCommand } from "@/site/library/install-command";
import type { ApiTable, PropRow } from "@/lib/props";

type SourceFile = { path: string; target: string; type: string; source?: string };

export type ItemTabsProps = {
  command: string;
  registryUrl: string;
  /** The raw shadcn registry payload, shown so an install can be done by hand. */
  registryJson: string;
  files: SourceFile[];
  api?: ApiTable;
  dependencies: { name: string; title: string }[];
};

const tabs = ["Install", "Source", "API", "Registry"] as const;
type Tab = (typeof tabs)[number];

export function ItemTabs(props: ItemTabsProps) {
  const [tab, setTab] = useState<Tab>("Install");

  return (
    <div className="flex flex-col overflow-hidden rounded-[var(--radius-surface)] border border-fd-border bg-fd-card">
      <div role="tablist" aria-label="Item reference" className="flex border-b border-fd-border">
        {tabs.map((name) => (
          <button
            key={name}
            role="tab"
            type="button"
            aria-selected={tab === name}
            onClick={() => setTab(name)}
            className="relative px-4 py-2.5 text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground aria-selected:text-fd-foreground"
          >
            {name}
            {tab === name && <span className="absolute inset-x-3 bottom-0 h-0.5 bg-fd-primary" />}
          </button>
        ))}
      </div>

      <div className="p-4">
        {tab === "Install" && <InstallPane {...props} />}
        {tab === "Source" && <SourcePane files={props.files} />}
        {tab === "API" && <ApiPane api={props.api} />}
        {tab === "Registry" && <RegistryPane json={props.registryJson} url={props.registryUrl} />}
      </div>
    </div>
  );
}

function InstallPane({ command, dependencies, registryJson }: Omit<ItemTabsProps, "files" | "api">) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-fd-muted-foreground">
          <Terminal className="size-3.5" /> shadcn CLI
        </p>
        <CopyCommand command={command} />
      </div>

      {dependencies.length > 0 && (
        <div className="grid gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-fd-muted-foreground">
            Also installs ({dependencies.length})
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {dependencies.map((dependency) => (
              <li
                key={dependency.name}
                className="rounded-[var(--radius-pill)] border border-fd-border bg-fd-background px-2.5 py-0.5 font-mono text-xs text-fd-foreground"
                title={dependency.title}
              >
                {dependency.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      <details className="group grid gap-2">
        <summary className="cursor-pointer list-none text-xs font-medium uppercase tracking-wide text-fd-muted-foreground transition-colors hover:text-fd-foreground">
          Manual install
          <span className="ml-1.5 text-fd-muted-foreground/70 group-open:hidden">(+)</span>
          <span className="ml-1.5 hidden text-fd-muted-foreground/70 group-open:inline">(–)</span>
        </summary>
        <div className="overflow-hidden rounded-[var(--radius-surface)] border border-fd-border bg-fd-background">
          <Code text={registryJson} label="registry.json" />
        </div>
      </details>
    </div>
  );
}

function SourcePane({ files }: { files: SourceFile[] }) {
  const withSource = files.filter((file) => file.source);

  if (withSource.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-fd-muted-foreground">
        Source preview unavailable for this item.
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      {withSource.map((file) => (
        <div key={file.path} className="grid gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate font-mono text-xs text-fd-muted-foreground">{file.target}</span>
            <span className="shrink-0 rounded-[var(--radius-pill)] border border-fd-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-fd-muted-foreground">
              {file.type.replace("registry:", "")}
            </span>
          </div>
          <div className="overflow-hidden rounded-[var(--radius-surface)] border border-fd-border bg-fd-background">
            <Code text={file.source!} label={file.path} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ApiPane({ api }: { api?: ApiTable }) {
  if (!api || (api.props.length === 0 && !api.exports?.length)) {
    return (
      <p className="py-6 text-center text-sm text-fd-muted-foreground">No public props recorded for this item yet.</p>
    );
  }

  return (
    <div className="grid gap-3">
      <div>
        <p className="font-mono text-sm font-medium text-fd-foreground">{api.name}</p>
        {api.description && <p className="mt-1 text-sm text-fd-muted-foreground">{api.description}</p>}
        {api.extendsList && api.extendsList.length > 0 && (
          <p className="mt-1 text-xs text-fd-muted-foreground">Extends {api.extendsList.join(", ")}</p>
        )}
      </div>

      {api.props.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-fd-border text-xs uppercase tracking-wide text-fd-muted-foreground">
                <th className="py-2 pr-4 font-medium">Prop</th>
                <th className="py-2 pr-4 font-medium">Type</th>
                <th className="py-2 pr-4 font-medium">Default</th>
                <th className="py-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {api.props.map((prop) => (
                <PropRowView key={`${api.name}.${prop.name}`} prop={prop} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {api.exports && api.exports.length > 0 && api.props.length === 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {api.exports.map((name) => (
            <li key={name} className="rounded-[var(--radius-pill)] border border-fd-border bg-fd-background px-2.5 py-0.5 font-mono text-xs">
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PropRowView({ prop }: { prop: PropRow }) {
  return (
    <tr className="border-b border-fd-border/60 align-top last:border-0">
      <td className="py-2.5 pr-4 font-mono text-xs text-fd-foreground">
        {prop.name}
        {prop.required && <span className="ml-1 text-fd-destructive">*</span>}
      </td>
      <td className="py-2.5 pr-4 font-mono text-xs text-fd-primary">{prop.type}</td>
      <td className="py-2.5 pr-4 font-mono text-xs text-fd-muted-foreground">{prop.defaultValue ?? "—"}</td>
      <td className="py-2.5 text-xs text-fd-muted-foreground">{prop.description ?? ""}</td>
    </tr>
  );
}

function RegistryPane({ json, url }: { json: string; url: string }) {
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-fd-muted-foreground">
          registry item payload
        </p>
        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className="truncate font-mono text-xs text-fd-primary hover:underline"
        >
          {url}
        </a>
      </div>
      <div className="max-h-96 overflow-hidden rounded-[var(--radius-surface)] border border-fd-border bg-fd-background">
        <Code text={json} label="registry.json" />
      </div>
    </div>
  );
}

function Code({ text, label }: { text: string; label?: string }) {
  return (
    <div className="overflow-auto">
      {label && (
        <div className="sticky top-0 z-10 border-b border-fd-border bg-fd-background px-3 py-1.5 font-mono text-[11px] text-fd-muted-foreground">
          {label}
        </div>
      )}
      <pre className="min-w-full p-3 font-mono text-xs leading-relaxed text-fd-foreground">
        <code>{text}</code>
      </pre>
    </div>
  );
}