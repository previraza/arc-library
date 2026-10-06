import { readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import type { RegistryItem } from "@/lib/registry";
import { arcRoot } from "@/lib/arc-root";

export { arcRoot };

export type PropRow = {
  name: string;
  type: string;
  defaultValue?: string;
  description?: string;
  required?: boolean;
};

export type ApiTable = {
  /** Name of the props interface, for example ButtonProps. */
  name: string;
  description?: string;
  props: PropRow[];
  /** Documented props coming from a spread of React's own attributes. */
  extendsList?: string[];
  /** Every exported binding, used when the item has no props interface to document. */
  exports?: string[];
};

const cache = new Map<string, ApiTable | undefined>();

/** The .tsx file of an item, when the component lives in a single file. */
function getSourceFile(item: RegistryItem): string | undefined {
  const file = item.files.find((entry) => entry.type === "registry:component" && entry.path.endsWith(".tsx"));
  if (!file) return;
  try {
    return readFileSync(join(arcRoot, file.path), "utf8");
  } catch {
    return;
  }
}

/** Keeps the original source text of a node, which the printer would rewrite into a fresh syntax tree. */
function print(node: ts.Node): string {
  return tidy(node.getText());
}

/** Collapses a multi line union into one line: `"a" | "b"`. */
function tidy(type: string): string {
  return type
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*\|\s*/g, " | ")
    .replace(/([\[<])\s+/g, "$1")
    .replace(/\s+([\]>])/g, "$1")
    .trim();
}

function descriptionOf(node: ts.Node): string | undefined {
  const comment = (node as ts.Node & { jsDoc?: ts.JSDoc[] }).jsDoc?.at(-1);
  const text = comment && typeof comment.comment === "string" ? comment.comment : undefined;
  return text?.replace(/^\n/, "").trim() || undefined;
}

/**
 * Defaults are read from the destructured props of the component function, which is where the registry keeps
 * them: `({ variant = "primary", size = "md" })`.
 */
function readDefaults(source: ts.SourceFile): Map<string, string> {
  const defaults = new Map<string, string>();
  const visit = (node: ts.Node) => {
    if (
      ts.isParameter(node) &&
      node.name &&
      ts.isObjectBindingPattern(node.name) &&
      (ts.isIdentifier(node.name) || node.initializer === undefined)
    ) {
      for (const element of node.name.elements) {
        const name = element.name && ts.isIdentifier(element.name) ? element.name.text : undefined;
        if (!name || !element.initializer) continue;
        if (ts.isStringLiteral(element.initializer) || ts.isNumericLiteral(element.initializer)) {
          defaults.set(name, JSON.stringify(element.initializer.text));
        } else if (element.initializer.kind === ts.SyntaxKind.TrueKeyword) {
          defaults.set(name, "true");
        } else if (element.initializer.kind === ts.SyntaxKind.FalseKeyword) {
          defaults.set(name, "false");
        } else if (ts.isArrayLiteralExpression(element.initializer)) {
          defaults.set(name, print(element.initializer));
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return defaults;
}

/**
 * Parses the exported types of an item: the props interface, the variant unions it points at, and the defaults
 * from the component signature. Everything on the item page's API reference comes from here, so the table can
 * never drift from the source.
 */
export function getApiTable(item: RegistryItem): ApiTable | undefined {
  if (cache.has(item.name)) return cache.get(item.name);

  const source = getSourceFile(item);
  if (!source) {
    cache.set(item.name, undefined);
    return;
  }

  const file = ts.createSourceFile(`${item.name}.tsx`, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const defaults = readDefaults(file);

  const interfaces = new Map<string, ts.InterfaceDeclaration>();
  const aliases = new Map<string, ts.TypeAliasDeclaration>();
  const exported = new Set<string>();

  for (const statement of file.statements) {
    const isExported = (statement as ts.Statement & { modifiers?: ts.Modifier[] }).modifiers?.some(
      (modifier: ts.Modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    );
    if (isExported && ts.isInterfaceDeclaration(statement)) interfaces.set(statement.name.text, statement);
    if (isExported && ts.isTypeAliasDeclaration(statement)) aliases.set(statement.name.text, statement);
    if (isExported && ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) exported.add(declaration.name.text);
      }
    }
    if (isExported && ts.isFunctionDeclaration(statement) && statement.name) {
      exported.add(statement.name.text);
    }
  }

  // The props interface is the one named after the item, or the only one exported.
  const preferred = [
    `${pascal(item.name)}Props`,
    ...[...interfaces.keys()].filter((name) => name.endsWith("Props")),
  ];
  const propsName = preferred.find((name) => interfaces.has(name) && exported.has(name.replace(/Props$/, "")));
  const declaration = propsName ? interfaces.get(propsName) : undefined;
  if (!declaration) {
    // Items built straight on a Radix primitive type their props inline, so there is no table to read.
    // The exported bindings are still worth listing.
    const table: ApiTable = { name: "", props: [], exports: [...exported] };
    cache.set(item.name, table);
    return table;
  }

  // String literal unions are shown inline, so `variant?: ButtonVariant` reads as the values a reader can pass.
  const resolve = (type: ts.TypeNode): string => {
    if (ts.isTypeReferenceNode(type) && ts.isIdentifier(type.typeName)) {
      const alias = aliases.get(type.typeName.text);
      if (alias && !alias.typeParameters && ts.isUnionTypeNode(alias.type)) {
        return alias.type.types.map((member) => print(member)).join(" | ");
      }
    }
    return print(type);
  };

  const props: PropRow[] = [];
  const extendsList: string[] = [];
  for (const member of declaration.heritageClauses ?? []) {
    for (const type of member.types) extendsList.push(print(type));
  }
  for (const member of declaration.members) {
    if (!ts.isPropertySignature(member) || !member.name) continue;
    const optional = member.questionToken !== undefined;
    const type = member.type ? resolve(member.type) : undefined;
    const name = member.name.getText(file).replace(/^["']|["']$/g, "");
    props.push({
      name,
      type: type ?? "unknown",
      defaultValue: defaults.get(name),
      description: descriptionOf(member) ?? descriptionOf(member.name),
      required: !optional ? true : undefined,
    });
  }
  props.push({
    name: "...props",
    type: extendsList.length ? extendsList.join(", ") : "HTMLAttributes",
    description: "Forwarded to the underlying element.",
  });

  const table: ApiTable = {
    name: propsName!,
    description: descriptionOf(declaration) ?? descriptionOf(declaration.name),
    props,
    extendsList,
  };
  cache.set(item.name, table);
  return table;
}

function pascal(value: string): string {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/** Every file of an item, ready to render as a list or a manual install tab. */
export function getItemFiles(item: RegistryItem): { path: string; target: string; type: string }[] {
  return item.files.map((file) => ({ path: file.path, target: file.target, type: file.type }));
}

export function readSource(path: string): string | undefined {
  try {
    return readFileSync(join(arcRoot, path), "utf8");
  } catch {
    return;
  }
}