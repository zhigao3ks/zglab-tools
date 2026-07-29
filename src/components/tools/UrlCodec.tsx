import { useState } from 'preact/hooks';
import { ClearButton } from '../common/ClearButton';
import { CopyButton } from '../common/CopyButton';
import { ToolActions } from '../common/ToolActions';
import { ToolNotice } from '../common/ToolNotice';
import { decodeUrlText, encodeUrlText, parseUrl } from '../../tools/url/logic';
import type { ParsedUrl, UrlEncodingMode } from '../../tools/url/types';

const sample = 'https://example.com/search?q=中文 空格&tag=ZGLab&tag=工具#overview';

export function UrlCodec() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<UrlEncodingMode>('component');
  const [parsed, setParsed] = useState<ParsedUrl | null>(null);
  const [error, setError] = useState('');

  const transform = (direction: 'encode' | 'decode') => {
    setError('');
    setParsed(null);
    try {
      setOutput(direction === 'encode' ? encodeUrlText(input, mode) : decodeUrlText(input, mode));
    } catch (cause) {
      setOutput('');
      setError(cause instanceof Error ? cause.message : '处理失败。');
    }
  };

  const inspect = () => {
    setError('');
    try {
      setParsed(parseUrl(input));
      setOutput('');
    } catch (cause) {
      setParsed(null);
      setError(cause instanceof Error ? cause.message : '解析失败。');
    }
  };

  const clear = () => {
    setInput('');
    setOutput('');
    setParsed(null);
    setError('');
  };

  return (
    <div class="tool-app url-tool">
      <div class="tool-toolbar">
        <div class="segmented-control" aria-label="URL 编码范围">
          <span>范围</span>
          <button
            type="button"
            aria-pressed={mode === 'component'}
            onClick={() => setMode('component')}
          >
            encodeURIComponent
          </button>
          <button type="button" aria-pressed={mode === 'uri'} onClick={() => setMode('uri')}>
            encodeURI
          </button>
        </div>
        <span class="keyboard-hint">组件模式会编码 &amp;、=、/ 等查询值中的保留字符</span>
      </div>
      <div class="editor-grid">
        <section class="editor-panel">
          <header>
            <div>
              <span class="panel-label">URL OR TEXT</span>
              <h2>输入</h2>
            </div>
          </header>
          <textarea
            value={input}
            onInput={(event) => setInput(event.currentTarget.value)}
            placeholder="输入 URL、查询参数或普通文本"
            spellcheck={false}
            aria-label="URL 输入"
          />
          <ToolActions>
            <button
              class="action-button action-button-primary"
              type="button"
              onClick={() => transform('encode')}
              disabled={input === ''}
            >
              编码
            </button>
            <button
              class="action-button"
              type="button"
              onClick={() => transform('decode')}
              disabled={input === ''}
            >
              解码
            </button>
            <button
              class="action-button"
              type="button"
              onClick={inspect}
              disabled={input.trim() === ''}
            >
              解析 URL
            </button>
            <button
              class="action-button action-button-quiet"
              type="button"
              onClick={() => setInput(sample)}
            >
              加载示例
            </button>
            <ClearButton
              onClear={clear}
              disabled={input === '' && output === '' && parsed === null}
            />
          </ToolActions>
        </section>
        <section class="editor-panel">
          <header>
            <div>
              <span class="panel-label">TRANSFORMED TEXT</span>
              <h2>编码 / 解码结果</h2>
            </div>
          </header>
          <textarea
            value={output}
            readOnly
            placeholder="编码或解码结果"
            spellcheck={false}
            aria-label="URL 输出"
          />
          <ToolActions>
            <CopyButton text={output} disabled={output === ''} label="复制结果" />
          </ToolActions>
        </section>
      </div>
      {error && <ToolNotice tone="error">{error}</ToolNotice>}
      {parsed && (
        <section class="form-panel url-inspection">
          <header>
            <div>
              <span class="panel-label">QUERY INSPECTOR</span>
              <h2>URL 解析结果</h2>
            </div>
          </header>
          <dl class="result-list">
            <div>
              <dt>完整地址</dt>
              <dd>
                <code>{parsed.href}</code>
              </dd>
            </div>
            <div>
              <dt>协议 / 域名</dt>
              <dd>
                <code>
                  {parsed.protocol} // {parsed.host}
                </code>
              </dd>
            </div>
            <div>
              <dt>路径</dt>
              <dd>
                <code>{parsed.pathname || '/'}</code>
              </dd>
            </div>
            <div>
              <dt>Hash</dt>
              <dd>
                <code>{parsed.hash || '—'}</code>
              </dd>
            </div>
          </dl>
          <div class="query-table">
            <strong>Query 参数（{parsed.parameters.length}）</strong>
            {parsed.parameters.length === 0 ? (
              <p>没有查询参数。</p>
            ) : (
              parsed.parameters.map((parameter, index) => (
                <div>
                  <code>{index + 1}</code>
                  <code>{parameter.key}</code>
                  <code>{parameter.value}</code>
                </div>
              ))
            )}
          </div>
        </section>
      )}
      <ToolNotice>
        解析 URL 需要完整协议；Query 参数会按浏览器 URL 标准自动还原百分号编码。
      </ToolNotice>
    </div>
  );
}
