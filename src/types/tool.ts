export type ToolStatus = 'online' | 'beta' | 'planned' | 'disabled';

export type ToolCategory = 'format' | 'time' | 'text' | 'generator';

export interface ToolDefinition {
  id: string;
  name: string;
  shortName?: string;
  description: string;
  route: string;
  category: ToolCategory;
  status: ToolStatus;
  featured: boolean;
  order: number;
  keywords: string[];
  icon: string;
  privacyMode: 'local-only';
  visible: boolean;
}
