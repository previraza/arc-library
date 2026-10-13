import { readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { highlight } from "@/lib/highlight";

const siteRoot = join(process.cwd(), "site");

export type ExampleSource = {
  /** Export name in the examples file, e.g. MorphSelectTimezoneExample. */
  exportName: string;
  /** Human title, from the `@title` tag of the JSDoc (falls back to the export name). */
  title: string;
  description?: string;
  /** Copy-paste ready source: imports rewritten to the install path, helpers inlined. */
  code: string;
  html: string;
};

/** Tokens a consumer has, mapped from the `fd-` utilities the docs site itself uses. */
const tokenOf: Record<string, string> = {
  "muted-foreground": "--text-muted",
  foreground: "--foreground",
  border: "--border",
  card: "--surface",
  background: "--background",
  muted: "--surface-muted",
  primary: "--foreground",
  destructive: "--danger",
};

function portable(code: string): string {
  return code
    .replace(/manicat\/registry\/components\//g, "@/components/manicat/")
    .replace(/\b(text|bg|border|ring|fill|stroke)-fd-([a-z-]+?)(\/\d+)?(?=["'\s`\]])/g, (whole, prefix, name, alpha = "") => {
      const token = tokenOf[name];
      if (!token) return whole;
      return prefix === "bg" ? `bg-(${token})${alpha}` : `${prefix}-(color:${token})${alpha}`;
    });
}

const cache = new Map<string, Map<string, Omit<ExampleSource, "html">>>();

function parse(file: string, suffix: "Demo" | "Example") {
  const key = `${file}:${suffix}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const text = readFileSync(join(siteRoot, file), "utf8");
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  const imports: { text: string; names: string[] }[] = [];
  const decls = new Map<string, ts.Statement>();
  const targets: ts.FunctionDeclaration[] = [];

  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement)) {
      const clause = statement.importClause;
      const names: string[] = [];
      if (clause?.name) names.push(clause.name.text);
      if (clause?.namedBindings) {
        if (ts.isNamespaceImport(clause.namedBindings)) names.push(clause.namedBindings.name.text);
        else clause.namedBindings.elements.forEach((element) => names.push(element.name.text));
      }
      imports.push({ text: statement.getText(), names });
    } else if (ts.isFunctionDeclaration(statement) && statement.name) {
      const exported = statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
      if (exported && statement.name.text.endsWith(suffix)) targets.push(statement);
      else decls.set(statement.name.text, statement);
    } else if (ts.isVariableStatement(statement)) {
      for (const d of statement.declarationList.declarations) if (ts.isIdentifier(d.name)) decls.set(d.name.text, statement);
    } else if (ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement)) {
      decls.set(statement.name.text, statement);
    }
  }

  const identifiersOf = (node: ts.Node) => {
    const found = new Set<string>();
    const visit = (n: ts.Node) => {
      if (ts.isIdentifier(n)) found.add(n.text);
      ts.forEachChild(n, visit);
    };
    visit(node);
    return found;
  };

  const result = new Map<string, Omit<ExampleSource, "html">>();

  for (const target of targets) {
    const exportName = target.name!.text;
    const helpers = new Map<string, ts.Statement>();
    const usedImports = new Set<string>();
    const queue: ts.Node[] = [target];

    while (queue.length) {
      for (const id of identifiersOf(queue.pop()!)) {
        const decl = decls.get(id);
        if (decl && !helpers.has(id)) {
          helpers.set(id, decl);
          queue.push(decl);
        }
        usedImports.add(id);
      }
    }

    const importLines = imports
      .filter((entry) => entry.names.some((name) => usedImports.has(name)))
      .map((entry) => entry.text);

    // A helper statement can declare several names; print it once.
    const helperText = [...new Set([...helpers.values()])]
      .sort((a, b) => a.pos - b.pos)
      .map((statement) => statement.getText());

    const doc = (target as ts.Node & { jsDoc?: ts.JSDoc[] }).jsDoc?.at(-1);
    const comment = doc && typeof doc.comment === "string" ? doc.comment : undefined;
    const title = doc?.tags?.find((tag) => tag.tagName.text === "title")?.comment;
    const body = target.getText().replace(/^export\s+/, "");
    const renamed = suffix === "Demo" ? body.replace(new RegExp(`${exportName}\\b`), `${exportName.slice(0, -4)}Example`) : body;

    const code = portable(['"use client";', "", importLines.join("\n"), "", ...helperText.flatMap((t) => [t, ""]), `export ${renamed}`]
      .join("\n")
      .replace(/\n{3,}/g, "\n\n"));

    result.set(exportName, {
      exportName,
      title: typeof title === "string" ? title : exportName.replace(new RegExp(`${suffix}$`), "").replace(/([a-z])([A-Z])/g, "$1 $2"),
      description: comment?.trim(),
      code: code.trimEnd() + "\n",
    });
  }

  cache.set(key, result);
  return result;
}

async function finish(entry: Omit<ExampleSource, "html">): Promise<ExampleSource> {
  return { ...entry, html: await highlight(entry.code, "tsx") };
}

/** The copyable source of a demo (the main preview of an item). */
export async function getDemoSource(file: string, exportName: string): Promise<ExampleSource | undefined> {
  const entry = parse(file, "Demo").get(exportName);
  return entry && finish(entry);
}

/** The sources of the given example exports of a file, in the order requested. */
export async function getExampleSources(file: string, exportNames: string[]): Promise<ExampleSource[]> {
  const all = parse(file, "Example");
  const entries = exportNames.map((name) => all.get(name)).filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  return Promise.all(entries.map(finish));
}

/**
 * The hand-written usage snippet of an item for a non-React framework: `content/usage/<item>.<framework>.txt`.
 * Drop the file in and the Usage section picks it up for that framework's tab.
 */
export function readUsage(itemName: string, frameworkId: string): string | undefined {
  try {
    return readFileSync(join(process.cwd(), "content", "usage", `${itemName}.${frameworkId}.txt`), "utf8").trimEnd() + "\n";
  } catch {
    return;
  }
}

/**
 * The same example written for another framework: `content/examples/<ExportName>.<framework>.txt`. The viewer of that framework
 * renders it, so the Examples section can show every example in every framework it is ported to.
 */
export function readExample(exportName: string, frameworkId: string): string | undefined {
  try {
    return readFileSync(join(process.cwd(), "content", "examples", `${exportName}.${frameworkId}.txt`), "utf8").trimEnd() + "\n";
  } catch {
    return;
  }
}
