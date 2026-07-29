import { useMemo, useState } from 'preact/hooks';
import { ClearButton } from '../common/ClearButton';
import { CopyButton } from '../common/CopyButton';
import { ToolActions } from '../common/ToolActions';
import { ToolNotice } from '../common/ToolNotice';
import { runRegex } from '../../tools/regex/logic';
import type { RegexResult } from '../../tools/regex/types';

const templates = [
  { label: '邮箱', pattern: '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}', flags: 'gi' },
  { label: '中国手机号', pattern: '1[3-9]\\d{9}', flags: 'g' },
  { label: '数字分组', pattern: '(\\d+)-(\\d+)', flags: 'g' },
] as const;

export function RegexTester() {
  const [pattern, setPattern] = useState('(\\w+)-(\\d+)');
  const [flags, setFlags] = useState('g');
  const [input, setInput] = useState('item-2 and tool-7');
  const [replacement, setReplacement] = useState('$2:$1');
  const { result, error } = useMemo<{ result: RegexResult | null; error: string }>(() => {
    try {
      return { result: runRegex(pattern, flags, input, replacement), error: '' };
    } catch (cause) {
      return { result: null, error: cause instanceof Error ? cause.message : '正则表达式无效。' };
    }
  }, [flags, input, pattern, replacement]);

  const clear = () => {
    setPattern('');
    setFlags('g');
    setInput('');
    setReplacement('');
  };

  return (
    <div class="tool-app regex-tool">
      <div class="regex-top-grid">
        <label class="field">
          <span>正则表达式</span>
          <input
            value={pattern}
            onInput={(event) => setPattern(event.currentTarget.value)}
            placeholder="例如 (\\w+)-(\\d+)"
            spellcheck={false}
          />
        </label>
        <label class="field">
          <span>标志</span>
          <input
            value={flags}
            onInput={(event) => setFlags(event.currentTarget.value)}
            placeholder="gim"
            spellcheck={false}
          />
        </label>
        <label class="field">
          <span>替换为</span>
          <input
            value={replacement}
            onInput={(event) => setReplacement(event.currentTarget.value)}
            placeholder="支持 $1、$&、$&lt;name&gt;"
            spellcheck={false}
          />
        </label>
      </div>
      <div class="regex-template-bar" aria-label="常用正则模板">
        <span>常用模板</span>
        {templates.map((template) => (
          <button
            type="button"
            onClick={() => {
              setPattern(template.pattern);
              setFlags(template.flags);
            }}
          >
            {template.label}
          </button>
        ))}
      </div>
      <div class="editor-grid">
        <section class="editor-panel">
          <header>
            <div>
              <span class="panel-label">TEST TEXT</span>
              <h2>待匹配文本</h2>
            </div>
            <span>{input.length.toLocaleString('zh-CN')} 字符</span>
          </header>
          <textarea
            value={input}
            onInput={(event) => setInput(event.currentTarget.value)}
            placeholder="输入测试文本"
            spellcheck={false}
            aria-label="正则测试文本"
          />
          <ToolActions>
            <ClearButton
              onClear={clear}
              disabled={pattern === '' && input === '' && replacement === ''}
            />
          </ToolActions>
        </section>
        <section class="editor-panel">
          <header>
            <div>
              <span class="panel-label">REPLACE RESULT</span>
              <h2>替换结果</h2>
            </div>
            <span>{result?.matches.length ?? 0} 个匹配</span>
          </header>
          <textarea
            value={result?.replaced ?? ''}
            readOnly
            placeholder="替换结果会实时显示"
            spellcheck={false}
            aria-label="正则替换结果"
          />
          <ToolActions>
            <CopyButton text={result?.replaced ?? ''} disabled={!result} label="复制替换结果" />
          </ToolActions>
        </section>
      </div>
      {error ? (
        <ToolNotice tone="error">{error}</ToolNotice>
      ) : (
        <ToolNotice tone="success">
          {result?.matches.length ?? 0} 个匹配，替换使用 JavaScript String.replace 的标准语法。
        </ToolNotice>
      )}
      {result && (
        <section class="form-panel regex-matches">
          <header>
            <div>
              <span class="panel-label">MATCH GROUPS</span>
              <h2>匹配与分组</h2>
            </div>
          </header>
          {result.matches.length === 0 ? (
            <p class="empty-copy">没有匹配项。</p>
          ) : (
            result.matches.map((match, index) => (
              <article>
                <strong>
                  #{index + 1} · index {match.index}
                </strong>
                <code>{match.value || '（零长度匹配）'}</code>
                {match.groups.length > 0 && (
                  <p>
                    {match.groups
                      .map((group, groupIndex) => `$${groupIndex + 1}: ${group ?? 'undefined'}`)
                      .join(' · ')}
                  </p>
                )}
                {Object.keys(match.namedGroups).length > 0 && (
                  <p>
                    {Object.entries(match.namedGroups)
                      .map(([name, value]) => `$<${name}>: ${value ?? 'undefined'}`)
                      .join(' · ')}
                  </p>
                )}
              </article>
            ))
          )}
        </section>
      )}
      <ToolNotice tone="warning">
        复杂、灾难性回溯的正则可能占用浏览器主线程。请避免在超长文本上运行不受限的嵌套量词。
      </ToolNotice>
    </div>
  );
}
