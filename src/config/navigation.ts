import { availableTools } from './tools';

export const primaryNavigation = [
  { label: '工具首页', href: '/' },
  { label: '隐私说明', href: '/privacy/' },
] as const;

export const toolNavigation = availableTools.map((tool) => ({
  label: tool.name,
  href: tool.route,
  icon: tool.icon,
}));
