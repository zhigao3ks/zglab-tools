import { useMemo, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { ClearButton } from '../common/ClearButton';
import { CopyButton } from '../common/CopyButton';
import { ToolActions } from '../common/ToolActions';
import { ToolNotice } from '../common/ToolNotice';
import { parseMarkdown } from '../../tools/markdown/logic';
import type { MarkdownBlock, MarkdownInline } from '../../tools/markdown/types';

const sample = `# ZGLab Tools

**本地优先**的浏览器工具箱，支持 *实时预览*。

- 不上传正文
- 不需要账户
- 支持 \`code\` 与 [ZGLab](https://zglab.fun)

> Markdown 会在当前页面安全渲染。

\`\`\`ts
const localOnly = true;
\`\`\``;

function InlineContent({ tokens }: { tokens: MarkdownInline[] }): ComponentChildren {
  return tokens.map((token, index) => {
    if (token.type === 'text') return <span key={index}>{token.value}</span>;
    if (token.type === 'code') return <code key={index}>{token.value}</code>;
    if (token.type === 'strong')
      return (
        <strong key={index}>
          <InlineContent tokens={token.children} />
        </strong>
      );
    if (token.type === 'emphasis')
      return (
        <em key={index}>
          <InlineContent tokens={token.children} />
        </em>
      );
    return (
      <a
        key={index}
        href={token.href}
        target={token.href.startsWith('http') ? '_blank' : undefined}
        rel={token.href.startsWith('http') ? 'noreferrer' : undefined}
      >
        <InlineContent tokens={token.children} />
      </a>
    );
  });
}

function Heading({ level, children }: { level: number; children: ComponentChildren }) {
  if (level === 1) return <h1>{children}</h1>;
  if (level === 2) return <h2>{children}</h2>;
  if (level === 3) return <h3>{children}</h3>;
  if (level === 4) return <h4>{children}</h4>;
  if (level === 5) return <h5>{children}</h5>;
  return <h6>{children}</h6>;
}

function BlockContent({ block }: { block: MarkdownBlock }) {
  if (block.type === 'heading')
    return (
      <Heading level={block.level}>
        <InlineContent tokens={block.children} />
      </Heading>
    );
  if (block.type === 'paragraph')
    return (
      <p>
        <InlineContent tokens={block.children} />
      </p>
    );
  if (block.type === 'blockquote')
    return (
      <blockquote>
        <InlineContent tokens={block.children} />
      </blockquote>
    );
  if (block.type === 'code')
    return (
      <pre>
        <code data-language={block.language || undefined}>{block.value}</code>
      </pre>
    );
  if (block.type === 'rule') return <hr />;
  const items = block.items.map((item, index) => (
    <li key={index}>
      <InlineContent tokens={item} />
    </li>
  ));
  return block.ordered ? <ol start={block.start}>{items}</ol> : <ul>{items}</ul>;
}

export function MarkdownPreview() {
  const [input, setInput] = useState('');
  const blocks = useMemo(() => parseMarkdown(input), [input]);

  return (
    <div class="tool-app markdown-tool">
      <div class="markdown-layout">
        <section class="editor-panel">
          <header>
            <div>
              <span class="panel-label">MARKDOWN INPUT</span>
              <h2>左侧编辑</h2>
            </div>
            <span>{input.length.toLocaleString('zh-CN')} 字符</span>
          </header>
          <textarea
            value={input}
            onInput={(event) => setInput(event.currentTarget.value)}
            placeholder="# 开始编写 Markdown"
            spellcheck={false}
            aria-label="Markdown 编辑器"
          />
          <ToolActions>
            <button
              class="action-button action-button-quiet"
              type="button"
              onClick={() => setInput(sample)}
            >
              加载示例
            </button>
            <CopyButton text={input} disabled={input === ''} label="复制 Markdown" />
            <ClearButton onClear={() => setInput('')} disabled={input === ''} />
          </ToolActions>
        </section>
        <section class="editor-panel markdown-preview-panel">
          <header>
            <div>
              <span class="panel-label">SAFE LIVE PREVIEW</span>
              <h2>右侧实时预览</h2>
            </div>
            <span>{blocks.length} 个区块</span>
          </header>
          <article class="markdown-preview" aria-label="Markdown 预览">
            {blocks.length === 0 ? (
              <p class="empty-copy">开始输入 Markdown，预览会即时显示在这里。</p>
            ) : (
              blocks.map((block, index) => <BlockContent key={index} block={block} />)
            )}
          </article>
        </section>
      </div>
      <ToolNotice>
        支持标题、段落、引用、有序/无序列表、代码块、粗体、斜体、行内代码和安全链接。原始 HTML
        会作为普通文本显示，不会执行。
      </ToolNotice>
    </div>
  );
}
