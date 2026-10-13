/**
 * Compiles every Vue port the way the bundler will. `vue-tsc` checks types but not what the SFC compiler rejects, such as
 * `defineProps` defaults that point at a variable declared inside `<script setup>`, so a port could pass the type check and
 * still fail to build in a real project.
 */
import { parse, compileScript, compileTemplate } from "vue/compiler-sfc";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = new URL("../registry/", import.meta.url).pathname;
const errors = [];
let count = 0;

for (const kind of ["components", "blocks"]) {
  for (const name of await readdir(path.join(root, kind))) {
    const file = path.join(root, kind, name, `${name}.vue`);
    const source = await readFile(file, "utf8").catch(() => null);
    if (source === null) continue;
    count += 1;
    try {
      const { descriptor, errors: parseErrors } = parse(source, { filename: file });
      if (parseErrors.length) throw parseErrors[0];
      const script = compileScript(descriptor, { id: name });
      const template = compileTemplate({ source: descriptor.template?.content ?? "", filename: file, id: name, compilerOptions: { bindingMetadata: script.bindings } });
      if (template.errors.length) throw template.errors[0];
    } catch (error) {
      errors.push(`${kind}/${name}: ${String(error.message ?? error).split("\n")[0]}`);
    }
  }
}

if (errors.length) {
  console.error(`Vue compile check failed:\n${errors.map(error => `  - ${error}`).join("\n")}`);
  process.exit(1);
}
console.log(`Vue compile: ${count} ports compile.`);
