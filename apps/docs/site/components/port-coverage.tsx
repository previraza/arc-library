import Link from "next/link";
import { getPorts } from "@/lib/frameworks";
import { getComponentNames, getItem } from "@/lib/registry";

/** The components that have a port, found on disk like the framework switcher finds them, so the list never goes stale. */
export function PortCoverage() {
  const rows = getComponentNames()
    .map((name) => getItem(name))
    .filter((item) => item !== undefined)
    .map((item) => ({ item, ports: getPorts(item) }))
    .filter((row) => row.ports.length > 0);

  if (rows.length === 0) return <p>No ports yet.</p>;

  return (
    <div className="my-4 overflow-x-auto">
      <table>
        <thead>
          <tr>
            <th>Component</th>
            <th>React</th>
            <th>React Native</th>
            <th>Vue</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ item, ports }) => (
            <tr key={item.name}>
              <td>
                <Link href={`/components/${item.name}`}>{item.title}</Link>
              </td>
              <td>✓</td>
              <td>{ports.some((port) => port.framework.id === "react-native") ? "✓" : "–"}</td>
              <td>{ports.some((port) => port.framework.id === "vue") ? "✓" : "–"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-sm text-fd-muted-foreground">
        {rows.length} of {getComponentNames().length} components have a port.
      </p>
    </div>
  );
}
