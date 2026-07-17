import { useState } from 'preact/hooks';
import { ClearButton } from '../common/ClearButton';
import { CopyButton } from '../common/CopyButton';
import { DownloadButton } from '../common/DownloadButton';
import { ToolActions } from '../common/ToolActions';
import { ToolNotice } from '../common/ToolNotice';
import { getJsonDownloadContent, isLargeJsonInput } from '../../tools/json/logic';
import { processJsonInWorker } from '../../tools/json/worker-client';
import type { JsonMetadata, JsonOutputMode, JsonParseIssue } from '../../tools/json/types';
import { createTimestampedFilename, downloadText } from '../../utils/download';

const sampleJson = `{
  "project": "ZGLab Tools",
  "privacy": {
    "upload": false,
    "storage": "current page only"
  },
  "tools": ["JSON", "Timestamp", "Text", "QR Code"],
  "unicode": "中文与 Emoji 😀"
}`;

export function JsonFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [indent, setIndent] = useState<2 | 4>(2);
  const [sortKeys, setSortKeys] = useState(false);
  const [metadata, setMetadata] = useState<JsonMetadata | null>(null);
  const [issue, setIssue] = useState<JsonParseIssue | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (mode: JsonOutputMode) => {
    if (busy || input.trim() === '') return;
    setBusy(true);
    setMessage('');
    try {
      const result = await processJsonInWorker(input, { mode, indent, sortKeys });
      if (result.ok) {
        setOutput(result.output);
        setMetadata(result.metadata);
        setIssue(null);
        setMessage(
          mode === 'minify'
            ? 'JSON 已压缩。'
            : mode === 'validate'
              ? 'JSON 校验通过。'
              : 'JSON 已格式化。',
        );
      } else {
        setIssue(result.issue);
        setMetadata(null);
        setMessage('');
      }
    } catch (error) {
      setIssue({
        message: error instanceof Error ? error.message : 'JSON 后台处理失败。',
        position: null,
        line: null,
        column: null,
        context: '',
        pointerOffset: 0,
      });
      setMetadata(null);
      setMessage('');
    } finally {
      setBusy(false);
    }
  };

  const clear = () => {
    setInput('');
    setOutput('');
    setMetadata(null);
    setIssue(null);
    setMessage('');
  };

  const handleKeyboard = (event: KeyboardEvent) => {
    if (!(event.ctrlKey || event.metaKey)) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      void run('format');
    } else if (event.shiftKey && event.key.toLocaleLowerCase() === 'm') {
      event.preventDefault();
      void run('minify');
    }
  };

  return (
    <div class="tool-app json-tool" onKeyDown={handleKeyboard}>
      <div class="tool-toolbar">
        <div class="segmented-control" aria-label="JSON 缩进">
          <span>缩进</span>
          <button type="button" aria-pressed={indent === 2} onClick={() => setIndent(2)}>
            2 空格
          </button>
          <button type="button" aria-pressed={indent === 4} onClick={() => setIndent(4)}>
            4 空格
          </button>
        </div>
        <label class="toggle-control">
          <input
            type="checkbox"
            checked={sortKeys}
            onChange={(event) => setSortKeys(event.currentTarget.checked)}
          />
          <span>递归按键名排序</span>
        </label>
        <span class="keyboard-hint">⌘/Ctrl + Enter 格式化</span>
      </div>

      {isLargeJsonInput(input) && (
        <ToolNotice tone="warning" title="大输入提示">
          输入已经超过 1 MB，处理可能占用较多浏览器资源。工具不会阻止你继续。
        </ToolNotice>
      )}

      <div class="editor-grid">
        <section class="editor-panel">
          <header>
            <div>
              <span class="panel-label">INPUT</span>
              <h2>JSON 输入</h2>
            </div>
            <span>{input.length.toLocaleString('zh-CN')} 字符</span>
          </header>
          <textarea
            value={input}
            onInput={(event) => setInput(event.currentTarget.value)}
            placeholder='粘贴 JSON，例如 {"name":"ZGLab"}'
            spellcheck={false}
            aria-label="JSON 输入"
          />
          <ToolActions>
            <button
              class="action-button action-button-primary"
              type="button"
              onClick={() => void run('format')}
              disabled={busy || input.trim() === ''}
            >
              {busy ? '处理中…' : '格式化'}
            </button>
            <button
              class="action-button"
              type="button"
              onClick={() => void run('minify')}
              disabled={busy || input.trim() === ''}
            >
              压缩
            </button>
            <button
              class="action-button"
              type="button"
              onClick={() => void run('validate')}
              disabled={busy || input.trim() === ''}
            >
              校验
            </button>
            <button
              class="action-button action-button-quiet"
              type="button"
              onClick={() => setInput(sampleJson)}
              disabled={busy}
            >
              加载示例
            </button>
            <ClearButton onClear={clear} disabled={busy || (input === '' && output === '')} />
          </ToolActions>
        </section>

        <section class="editor-panel">
          <header>
            <div>
              <span class="panel-label">OUTPUT</span>
              <h2>处理结果</h2>
            </div>
            <span>{output.length.toLocaleString('zh-CN')} 字符</span>
          </header>
          <textarea
            value={output}
            readOnly
            placeholder="格式化、压缩或校验后的结果显示在这里"
            spellcheck={false}
            aria-label="JSON 输出"
          />
          <ToolActions>
            <CopyButton text={output} disabled={output === ''} label="复制输出" />
            <DownloadButton
              disabled={output === ''}
              label="下载 JSON"
              onDownload={() =>
                downloadText(
                  getJsonDownloadContent(output),
                  createTimestampedFilename('json', 'json'),
                  'application/json;charset=utf-8',
                )
              }
            />
          </ToolActions>
        </section>
      </div>

      {message && <ToolNotice tone="success">{message}</ToolNotice>}
      {issue && (
        <div class="json-error" role="alert">
          <strong>JSON 解析失败</strong>
          <p>{issue.message}</p>
          {(issue.line !== null || issue.column !== null) && (
            <p>
              位置：第 {issue.line ?? '?'} 行，第 {issue.column ?? '?'} 列
            </p>
          )}
          {issue.context && (
            <pre>
              <code>{issue.context}</code>
              {'\n'}
              <span>{' '.repeat(issue.pointerOffset)}^</span>
            </pre>
          )}
        </div>
      )}

      {metadata && (
        <dl class="metadata-strip">
          <div>
            <dt>JSON 类型</dt>
            <dd>{metadata.type}</dd>
          </div>
          <div>
            <dt>顶层数量</dt>
            <dd>{metadata.topLevelSize ?? '—'}</dd>
          </div>
          <div>
            <dt>输入字符</dt>
            <dd>{metadata.inputCharacters.toLocaleString('zh-CN')}</dd>
          </div>
          <div>
            <dt>输出字符</dt>
            <dd>{metadata.outputCharacters.toLocaleString('zh-CN')}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}
