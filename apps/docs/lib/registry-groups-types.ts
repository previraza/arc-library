export interface ComponentGroup {
  title: string;
  items: string[];
}

export interface ComponentCategory {
  title: string;
  groups: ComponentGroup[];
}

export type ComponentGroups = ComponentCategory[];
export type BlockGroups = ComponentGroup[];