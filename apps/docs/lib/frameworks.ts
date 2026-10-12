/** Every framework a Manicat UI component may ship for. An item lists the ones it actually has in `meta.frameworks`; React is the default. */
export const frameworks = [
  { id: "react", label: "React" },
  { id: "react-native", label: "React Native" },
  { id: "vue", label: "Vue" },
  { id: "svelte", label: "Svelte" },
  { id: "swift", label: "Swift" },
] as const;

export type FrameworkId = (typeof frameworks)[number]["id"];

/** The frameworks available for an item, in display order. */
export function frameworksOf(meta?: { frameworks?: string[] }): { id: FrameworkId; label: string }[] {
  const wanted = meta?.frameworks?.length ? meta.frameworks : ["react"];
  return frameworks.filter((framework) => wanted.includes(framework.id));
}
