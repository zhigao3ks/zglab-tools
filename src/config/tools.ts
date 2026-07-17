import type { ToolCategory, ToolDefinition, ToolStatus } from '../types/tool';

export const categoryLabels: Record<ToolCategory, string> = {
  format: '格式转换',
  time: '时间处理',
  text: '文本处理',
  generator: '内容生成',
};

export const statusLabels: Record<ToolStatus, string> = {
  online: 'Online',
  beta: 'Beta',
  planned: 'Planned',
  disabled: 'Disabled',
};

export const tools: ToolDefinition[] = [
  {
    id: 'json-formatter',
    name: 'JSON 格式化器',
    shortName: 'JSON',
    description: '格式化、压缩、校验 JSON，并定位常见语法错误。',
    route: '/json-formatter/',
    category: 'format',
    status: 'online',
    featured: true,
    order: 1,
    keywords: ['JSON', 'format', 'minify', 'validate', '格式化', '压缩', '校验'],
    icon: '/icons/json.svg',
    privacyMode: 'local-only',
    visible: true,
  },
  {
    id: 'timestamp-converter',
    name: '时间戳转换器',
    shortName: 'Timestamp',
    description: '在 Unix 时间戳、日期、UTC、本地时间和指定时区之间转换。',
    route: '/timestamp-converter/',
    category: 'time',
    status: 'online',
    featured: true,
    order: 2,
    keywords: ['timestamp', 'Unix', 'UTC', 'timezone', '时间戳', '时区', '日期'],
    icon: '/icons/timestamp.svg',
    privacyMode: 'local-only',
    visible: true,
  },
  {
    id: 'text-counter',
    name: '文本统计器',
    shortName: 'Counter',
    description: '统计可见字符、中文、英文单词、段落、字节数和阅读时间。',
    route: '/text-counter/',
    category: 'text',
    status: 'online',
    featured: false,
    order: 3,
    keywords: ['text', 'word count', 'character', '字符统计', '字数', '阅读时间'],
    icon: '/icons/text-counter.svg',
    privacyMode: 'local-only',
    visible: true,
  },
  {
    id: 'text-line-processor',
    name: '文本去重与排序',
    shortName: 'Lines',
    description: '按行去重、清理空白，并进行自然、数字或字典序排序。',
    route: '/text-line-processor/',
    category: 'text',
    status: 'online',
    featured: false,
    order: 4,
    keywords: ['lines', 'deduplicate', 'sort', '文本去重', '自然排序', '数字排序'],
    icon: '/icons/line-processor.svg',
    privacyMode: 'local-only',
    visible: true,
  },
  {
    id: 'qr-code-generator',
    name: '二维码生成器',
    shortName: 'QR Code',
    description: '在浏览器本地生成文本、URL、邮箱、电话和 Wi-Fi 二维码。',
    route: '/qr-code-generator/',
    category: 'generator',
    status: 'online',
    featured: true,
    order: 5,
    keywords: ['QR code', 'qrcode', 'PNG', 'SVG', '二维码', 'Wi-Fi', 'URL'],
    icon: '/icons/qrcode.svg',
    privacyMode: 'local-only',
    visible: true,
  },
];

export const visibleTools = tools.filter((tool) => tool.visible).sort((a, b) => a.order - b.order);

export const availableTools = visibleTools.filter(
  (tool) => tool.status === 'online' || tool.status === 'beta',
);

export const getToolById = (id: string): ToolDefinition => {
  const tool = tools.find((item) => item.id === id);
  if (!tool) throw new Error(`Unknown tool: ${id}`);
  return tool;
};

export const getRelatedTools = (id: string, limit = 3): ToolDefinition[] => {
  const current = getToolById(id);
  return availableTools
    .filter((tool) => tool.id !== id)
    .sort((a, b) => {
      const categoryDelta =
        Number(b.category === current.category) - Number(a.category === current.category);
      return categoryDelta || a.order - b.order;
    })
    .slice(0, limit);
};
