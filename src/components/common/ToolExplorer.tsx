import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { categoryLabels, statusLabels } from '../../config/tools';
import type { ToolCategory, ToolDefinition } from '../../types/tool';
import { recordRecentTool } from '../../utils/storage';
import { EmptyState } from './EmptyState';

interface ToolExplorerProps {
  tools: ToolDefinition[];
}

type CategoryFilter = 'all' | ToolCategory;

const categoryOrder: CategoryFilter[] = ['all', 'format', 'time', 'text', 'image', 'generator'];

export function ToolExplorer({ tools }: ToolExplorerProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const searchInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      searchInput.current?.focus();
    };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return tools.filter((tool) => {
      if (category !== 'all' && tool.category !== category) return false;
      if (!normalizedQuery) return true;
      const searchText = [
        tool.name,
        tool.shortName,
        tool.description,
        categoryLabels[tool.category],
        tool.category,
        ...tool.keywords,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase();
      return searchText.includes(normalizedQuery);
    });
  }, [category, query, tools]);

  return (
    <div class="tool-explorer">
      <div class="tool-search-panel">
        <label class="tool-search">
          <span>搜索工具</span>
          <input
            ref={searchInput}
            type="search"
            value={query}
            onInput={(event) => setQuery(event.currentTarget.value)}
            placeholder="搜索名称、功能或关键词，例如 JSON、UTC、去重"
            autoComplete="off"
          />
          <kbd>/</kbd>
        </label>
        <div class="category-filters" aria-label="工具分类">
          {categoryOrder.map((item) => (
            <button
              type="button"
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
            >
              {item === 'all' ? '全部工具' : categoryLabels[item]}
            </button>
          ))}
        </div>
      </div>

      <p class="result-count" aria-live="polite">
        找到 <strong>{results.length}</strong> 个工具
      </p>

      {results.length === 0 ? (
        <EmptyState
          title="没有匹配的工具"
          description="尝试缩短关键词、切换分类，或搜索 JSON、时间、文本、二维码。"
        />
      ) : (
        <div class="tool-card-grid">
          {results.map((tool, index) => {
            const available = tool.status === 'online' || tool.status === 'beta';
            const content = (
              <>
                <div class="tool-card-heading">
                  <span class="tool-card-index">{String(index + 1).padStart(2, '0')}</span>
                  <img src={tool.icon} alt="" width="42" height="42" />
                  <span class="tool-status" data-status={tool.status}>
                    {statusLabels[tool.status]}
                  </span>
                </div>
                <div>
                  <p class="tool-category">{categoryLabels[tool.category]}</p>
                  <h3>{tool.name}</h3>
                  <p>{tool.description}</p>
                </div>
                <div class="tool-card-footer">
                  <span>Local only</span>
                  <span>{available ? '打开工具 →' : '暂未开放'}</span>
                </div>
              </>
            );

            return available ? (
              <a
                class={`tool-card ${tool.featured ? 'tool-card-featured' : ''}`}
                href={tool.route}
                onClick={() => recordRecentTool(tool.id)}
              >
                {content}
              </a>
            ) : (
              <article class="tool-card tool-card-disabled" aria-disabled="true">
                {content}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
