import { useState } from 'preact/hooks';
import { ClearButton } from '../common/ClearButton';
import { CopyButton } from '../common/CopyButton';
import { DownloadButton } from '../common/DownloadButton';
import { ToolActions } from '../common/ToolActions';
import { ToolNotice } from '../common/ToolNotice';
import { DEFAULT_LINE_OPTIONS, processLines } from '../../tools/line-processor/logic';
import type {
  DedupeMode,
  EmptyLineMode,
  LineOrder,
  LineProcessorOptions,
  LineProcessorStats,
} from '../../tools/line-processor/types';
import { createTimestampedFilename, downloadText } from '../../utils/download';

const sampleLines = `item10
 item2
item1
ZGLab
zglab

42
7
42`;

const emptyStats: LineProcessorStats = {
  inputLines: 0,
  outputLines: 0,
  duplicateLinesRemoved: 0,
  emptyLinesRemoved: 0,
  inputCharacters: 0,
  outputCharacters: 0,
};

export function TextLineProcessor() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [options, setOptions] = useState<LineProcessorOptions>(DEFAULT_LINE_OPTIONS);
  const [stats, setStats] = useState<LineProcessorStats>(emptyStats);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const updateOption = <Key extends keyof LineProcessorOptions>(
    key: Key,
    value: LineProcessorOptions[Key],
  ) => setOptions((current) => ({ ...current, [key]: value }));

  const run = async () => {
    if (busy || input === '') return;
    setBusy(true);
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    const result = processLines(input, options);
    setOutput(result.output);
    setStats(result.stats);
    setMessage('处理完成。');
    setBusy(false);
  };

  const clear = () => {
    setInput('');
    setOutput('');
    setStats(emptyStats);
    setMessage('');
  };

  const swap = () => {
    setInput(output);
    setOutput(input);
    setMessage('已交换输入和输出。');
  };

  return (
    <div class="tool-app line-tool">
      <section class="line-options">
        <div class="option-group">
          <span>预处理</span>
          <label>
            <input
              type="checkbox"
              checked={options.trimLines}
              onChange={(event) => updateOption('trimLines', event.currentTarget.checked)}
            />
            Trim 每行
          </label>
          <label>
            <input
              type="checkbox"
              checked={options.normalizeForDedupe}
              onChange={(event) => updateOption('normalizeForDedupe', event.currentTarget.checked)}
            />
            NFKC 标准化后判重
          </label>
          <label>
            <input
              type="checkbox"
              checked={options.caseSensitive}
              onChange={(event) => updateOption('caseSensitive', event.currentTarget.checked)}
            />
            大小写敏感
          </label>
        </div>
        <label class="field">
          <span>空行处理</span>
          <select
            value={options.emptyLineMode}
            onChange={(event) =>
              updateOption('emptyLineMode', event.currentTarget.value as EmptyLineMode)
            }
          >
            <option value="preserve">保留全部空行</option>
            <option value="remove">删除空行</option>
            <option value="merge">合并连续空行</option>
          </select>
        </label>
        <label class="field">
          <span>重复行</span>
          <select
            value={options.dedupeMode}
            onChange={(event) =>
              updateOption('dedupeMode', event.currentTarget.value as DedupeMode)
            }
          >
            <option value="none">不去重</option>
            <option value="first">保留第一次</option>
            <option value="last">保留最后一次</option>
          </select>
        </label>
        <label class="field">
          <span>排序方式</span>
          <select
            value={options.order}
            onChange={(event) => updateOption('order', event.currentTarget.value as LineOrder)}
          >
            <option value="keep">保持原始顺序</option>
            <option value="asc">字典序升序</option>
            <option value="desc">字典序降序</option>
            <option value="natural">自然排序</option>
            <option value="numeric">数字排序</option>
            <option value="random">随机打乱</option>
            <option value="reverse">反转行顺序</option>
          </select>
        </label>
      </section>

      <div class="line-editor-grid">
        <section class="editor-panel">
          <header>
            <div>
              <span class="panel-label">INPUT LINES</span>
              <h2>输入</h2>
            </div>
            <span>{stats.inputLines} 行</span>
          </header>
          <textarea
            value={input}
            onInput={(event) => setInput(event.currentTarget.value)}
            placeholder="每行一条内容"
            spellcheck={false}
            aria-label="待处理文本行"
          />
        </section>
        <section class="editor-panel">
          <header>
            <div>
              <span class="panel-label">OUTPUT LINES</span>
              <h2>输出</h2>
            </div>
            <span>{stats.outputLines} 行</span>
          </header>
          <textarea
            value={output}
            readOnly
            placeholder="处理结果"
            spellcheck={false}
            aria-label="处理后的文本行"
          />
        </section>
      </div>

      <ToolActions className="line-actions">
        <button
          class="action-button action-button-primary"
          type="button"
          onClick={() => void run()}
          disabled={busy || input === ''}
        >
          {busy ? '处理中…' : '开始处理'}
        </button>
        <button class="action-button" type="button" onClick={swap} disabled={busy || output === ''}>
          交换输入输出
        </button>
        <CopyButton text={output} label="复制输出" disabled={output === ''} />
        <DownloadButton
          label="下载 TXT"
          disabled={output === ''}
          onDownload={() =>
            downloadText(
              output.endsWith('\n') ? output : `${output}\n`,
              createTimestampedFilename('processed-lines', 'txt'),
            )
          }
        />
        <button
          class="action-button action-button-quiet"
          type="button"
          onClick={() => setInput(sampleLines)}
          disabled={busy}
        >
          加载示例
        </button>
        <ClearButton onClear={clear} disabled={busy || (input === '' && output === '')} />
      </ToolActions>

      {message && <ToolNotice tone="success">{message}</ToolNotice>}
      <dl class="metadata-strip line-stats">
        <div>
          <dt>输入行</dt>
          <dd>{stats.inputLines}</dd>
        </div>
        <div>
          <dt>输出行</dt>
          <dd>{stats.outputLines}</dd>
        </div>
        <div>
          <dt>删除重复</dt>
          <dd>{stats.duplicateLinesRemoved}</dd>
        </div>
        <div>
          <dt>删除空行</dt>
          <dd>{stats.emptyLinesRemoved}</dd>
        </div>
        <div>
          <dt>字符变化</dt>
          <dd>
            {stats.inputCharacters} → {stats.outputCharacters}
          </dd>
        </div>
      </dl>
      <ToolNotice>
        固定流程：标准化换行 → Trim → 空行处理 → 去重 → 排序、打乱或反转 →
        合并输出。数字排序会保留并自然排序非数字行。
      </ToolNotice>
    </div>
  );
}
