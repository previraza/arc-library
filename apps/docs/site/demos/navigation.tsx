"use client";

import { useState } from "react";
import { Folder, FileText } from "lucide-react";

import { Breadcrumb } from "manicat/registry/components/breadcrumb/breadcrumb";
import { Pagination } from "manicat/registry/components/pagination/pagination";
import { TreeView } from "manicat/registry/components/tree-view/tree-view";

export function BreadcrumbDemo() {
  return (
    <Breadcrumb
      items={[
        { label: "Settings", href: "#" },
        { label: "Billing", href: "#" },
        { label: "Teams" },
      ]}
    />
  );
}

export function PaginationDemo() {
  const [page, setPage] = useState(3);

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <Pagination page={page} pageCount={12} onPageChange={setPage} />
      <p className="text-xs text-fd-muted-foreground">Page {page} of 12</p>
    </div>
  );
}

const treeNodes = [
  {
    id: "src",
    label: "src",
    icon: <Folder className="size-4" />,
    children: [
      { id: "app", label: "app", icon: <Folder className="size-4" /> },
      {
        id: "lib",
        label: "lib",
        icon: <Folder className="size-4" />,
        children: [
          { id: "cn", label: "cn.ts", icon: <FileText className="size-4" /> },
          { id: "registry", label: "registry.ts", icon: <FileText className="size-4" /> },
        ],
      },
      { id: "site", label: "site", icon: <Folder className="size-4" /> },
    ],
  },
  {
    id: "packages",
    label: "packages",
    icon: <Folder className="size-4" />,
    children: [{ id: "manicat", label: "manicat", icon: <Folder className="size-4" /> }],
  },
];

export function TreeViewDemo() {
  return <TreeView nodes={treeNodes} defaultExpandedIds={["src", "lib"]} aria-label="Project files" />;
}