import type { FaqItem } from '../types/common';

export interface ToolPageContent {
  id: string;
  instructions: string[];
  faq: FaqItem[];
}

const imageFaq: FaqItem[] = [
  { question: '图片会上传吗？', answer: '不会。图片仅由当前浏览器读取、Canvas 处理和导出。' },
  {
    question: '支持哪些格式？',
    answer: '可读取常见 PNG、JPG、WebP、GIF、BMP；动画 GIF 会按当前帧处理。',
  },
];

const textFaq: FaqItem[] = [
  { question: '输入会保存吗？', answer: '不会。输入只保存在当前页面状态，刷新后即消失。' },
  { question: '是否需要联网？', answer: '不需要。核心处理不请求服务器或第三方服务。' },
];

const designFaq: FaqItem[] = [
  {
    question: '生成的 CSS 可以直接使用吗？',
    answer: '可以。复制结果即可粘贴到样式文件或浏览器开发工具中。',
  },
  { question: '颜色数据会上传吗？', answer: '不会。换算与预览只在当前浏览器运行。' },
];

export const toolPageContents: ToolPageContent[] = [
  {
    id: 'image-compressor',
    instructions: [
      '选择本地图片并设置输出格式和质量。',
      '在 Canvas 中压缩，查看输出预览和文件体积变化。',
      '下载压缩后的图片。',
    ],
    faq: imageFaq,
  },
  {
    id: 'image-resizer',
    instructions: [
      '选择本地图片。',
      '输入目标宽高，可保持原始比例。',
      '生成预览后下载调整尺寸的文件。',
    ],
    faq: imageFaq,
  },
  {
    id: 'image-converter',
    instructions: ['选择本地图片。', '指定 PNG、JPG 或 WebP 输出和质量。', '预览并下载转换结果。'],
    faq: imageFaq,
  },
  {
    id: 'image-cropper',
    instructions: [
      '选择图片并读取其原始像素尺寸。',
      '输入左侧、顶部、宽度和高度范围。',
      '导出裁剪后的 PNG。',
    ],
    faq: imageFaq,
  },
  {
    id: 'image-rounded-corners',
    instructions: ['选择本地图片。', '通过滑块设置圆角半径。', '导出带透明圆角的 PNG。'],
    faq: imageFaq,
  },
  {
    id: 'image-base64',
    instructions: ['选择本地图片。', '转换为 Data URL Base64 字符串。', '复制或下载文本结果。'],
    faq: imageFaq,
  },
  {
    id: 'ico-generator',
    instructions: [
      '选择本地图片。',
      '选择 ICO 尺寸，工具会居中裁切为正方形。',
      '下载 PNG 图层封装的 ICO 文件。',
    ],
    faq: imageFaq,
  },
  {
    id: 'image-color-picker',
    instructions: [
      '选择本地图片。',
      '点击图片任意像素。',
      '复制对应的 HEX 色值，并查看 RGB、HSL。',
    ],
    faq: imageFaq,
  },
  {
    id: 'text-case-converter',
    instructions: ['粘贴文本。', '选择小写、大写、标题格式或句首大写。', '复制或下载处理结果。'],
    faq: textFaq,
  },
  {
    id: 'naming-converter',
    instructions: ['输入变量、接口或文件名。', '选择目标命名格式。', '复制转换后的命名。'],
    faq: textFaq,
  },
  {
    id: 'whitespace-cleaner',
    instructions: ['输入文本。', '选择空格、行首尾空白和空行的清理规则。', '复制或下载清理结果。'],
    faq: textFaq,
  },
  {
    id: 'find-replace',
    instructions: [
      '输入原始文本。',
      '填写普通文本查找与替换内容。',
      '选择替换全部或大小写敏感，查看结果。',
    ],
    faq: textFaq,
  },
  {
    id: 'random-string-generator',
    instructions: ['设置长度和字符集。', '生成随机字符串。', '复制或下载结果。'],
    faq: textFaq,
  },
  {
    id: 'lorem-ipsum-generator',
    instructions: ['设置段落数和每段单词数。', '本地生成占位文本。', '复制或下载结果。'],
    faq: textFaq,
  },
  {
    id: 'contact-extractor',
    instructions: [
      '粘贴包含 URL、邮箱或手机号的文本。',
      '工具本地匹配并去重。',
      '按类别查看提取结果。',
    ],
    faq: textFaq,
  },
  {
    id: 'hidden-character-detector',
    instructions: [
      '粘贴可疑文本。',
      '工具会定位受支持的不可见字符。',
      '根据索引和码点检查或清理原文本。',
    ],
    faq: textFaq,
  },
  {
    id: 'color-converter',
    instructions: [
      '输入 HEX，或调整 RGB、HSL 数值。',
      '实时查看颜色和三种表示法。',
      '复制需要的色值。',
    ],
    faq: designFaq,
  },
  {
    id: 'color-picker',
    instructions: [
      '打开系统原生颜色面板，或输入 HEX。',
      '微调 RGB 或 HSL。',
      '复制 HEX 或 CSS 色值。',
    ],
    faq: designFaq,
  },
  {
    id: 'gradient-generator',
    instructions: ['选择两个颜色。', '调整线性渐变角度。', '复制生成的 background CSS。'],
    faq: designFaq,
  },
  {
    id: 'css-shadow-generator',
    instructions: [
      '调整阴影偏移、模糊、扩展和颜色。',
      '选择外阴影或内阴影。',
      '复制 box-shadow CSS。',
    ],
    faq: designFaq,
  },
  {
    id: 'css-radius-generator',
    instructions: ['分别调整四个角的半径。', '查看实时圆角预览。', '复制 border-radius CSS。'],
    faq: designFaq,
  },
  {
    id: 'rem-px-converter',
    instructions: ['输入像素值和项目根字号。', '实时查看等价 rem。', '复制计算结果。'],
    faq: designFaq,
  },
  {
    id: 'screen-ratio-calculator',
    instructions: [
      '输入屏幕、画布或视频宽高。',
      '查看最简比例、小数比例和方向。',
      '可继续修改数值进行比较。',
    ],
    faq: designFaq,
  },
  {
    id: 'token-estimator',
    instructions: [
      '粘贴提示词、文章、代码或中英混合文本。',
      '查看三种本地估算模型的 Token 区间参考。',
      '根据实际使用的模型编码器预留余量。',
    ],
    faq: textFaq,
  },
  {
    id: 'doi-reference-tool',
    instructions: [
      '输入 DOI，检查其通用语法并获得规范化值。',
      '填写作者、标题、期刊、年份等结构化字段。',
      '选择 GB/T 7714、APA 7 或 BibTeX 并复制输出。',
    ],
    faq: [
      {
        question: '工具会查询 DOI 元数据吗？',
        answer: '不会。工具不请求 Crossref 等外部服务，只检查 DOI 语法并格式化你提供的字段。',
      },
      {
        question: '输出能直接用于投稿吗？',
        answer: '可作为本地初稿；投稿前仍应对照目标期刊的参考文献细则复核。',
      },
    ],
  },
  {
    id: 'experimental-data-chart',
    instructions: [
      '粘贴带表头的 CSV 或 TSV 实验数据。',
      '选择 X/Y 数值列与折线、散点或柱状图。',
      '查看本地 Canvas 图表并下载 PNG。',
    ],
    faq: [
      {
        question: '数据会上传吗？',
        answer: '不会。CSV/TSV 解析、绘图和导出均在当前浏览器中完成。',
      },
      {
        question: '支持多组曲线吗？',
        answer: '当前版本聚焦单组 X/Y 快速探索；可切换任意两个数值列。',
      },
    ],
  },
];
