import { useState } from 'preact/hooks';
import { ClearButton } from '../common/ClearButton';
import { CopyButton } from '../common/CopyButton';
import { DownloadButton } from '../common/DownloadButton';
import { ToolActions } from '../common/ToolActions';
import { ToolNotice } from '../common/ToolNotice';
import { deduplicateUuids, generateUuidBatch } from '../../tools/uuid/logic';
import { downloadText } from '../../utils/download';

export function UuidGenerator() {
  const [count, setCount] = useState(10);
  const [output, setOutput] = useState('');
  const [dedupeInput, setDedupeInput] = useState('');
  const [dedupeOutput, setDedupeOutput] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const generate = () => {
    setError('');
    try {
      const values = generateUuidBatch(count);
      setOutput(values.join('\n'));
      setMessage(`已生成 ${values.length} 个 UUID v4。`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '生成失败。');
    }
  };

  const dedupe = () => {
    const result = deduplicateUuids(dedupeInput);
    setDedupeOutput(result.values.join('\n'));
    setError(result.invalid.length ? `跳过 ${result.invalid.length} 行非 UUID v4 内容。` : '');
    setMessage(`去重完成：保留 ${result.values.length} 个，移除 ${result.removed} 个重复项。`);
  };

  return (
    <div class="tool-app uuid-tool">
      <section class="form-panel">
        <header>
          <div>
            <span class="panel-label">CRYPTOGRAPHIC RANDOM</span>
            <h2>批量生成 UUID v4</h2>
          </div>
        </header>
        <div class="field-grid uuid-controls">
          <label class="field">
            <span>生成数量（1–10000）</span>
            <input
              type="number"
              min="1"
              max="10000"
              value={count}
              onInput={(event) => setCount(Number(event.currentTarget.value))}
            />
          </label>
          <div class="field">
            <span>随机来源</span>
            <output class="readonly-field">Web Crypto · getRandomValues</output>
          </div>
        </div>
        <textarea
          value={output}
          readOnly
          placeholder="生成的 UUID 每行一个"
          spellcheck={false}
          aria-label="批量 UUID 输出"
        />
        <ToolActions>
          <button class="action-button action-button-primary" type="button" onClick={generate}>
            生成 UUID
          </button>
          <CopyButton text={output} disabled={output === ''} label="复制全部" />
          <DownloadButton
            disabled={output === ''}
            label="下载 TXT"
            onDownload={() => downloadText(`${output}\n`, 'zglab-uuids.txt')}
          />
          <ClearButton onClear={() => setOutput('')} disabled={output === ''} />
        </ToolActions>
      </section>
      <section class="editor-grid">
        <section class="editor-panel">
          <header>
            <div>
              <span class="panel-label">PASTE UUID V4</span>
              <h2>去重输入</h2>
            </div>
          </header>
          <textarea
            value={dedupeInput}
            onInput={(event) => setDedupeInput(event.currentTarget.value)}
            placeholder="每行一个 UUID v4，大小写会统一为小写"
            spellcheck={false}
            aria-label="UUID 去重输入"
          />
          <ToolActions>
            <button
              class="action-button action-button-primary"
              type="button"
              onClick={dedupe}
              disabled={dedupeInput.trim() === ''}
            >
              去重 UUID
            </button>
          </ToolActions>
        </section>
        <section class="editor-panel">
          <header>
            <div>
              <span class="panel-label">UNIQUE UUID V4</span>
              <h2>去重结果</h2>
            </div>
          </header>
          <textarea
            value={dedupeOutput}
            readOnly
            placeholder="合法且唯一的 UUID 会显示在这里"
            spellcheck={false}
            aria-label="UUID 去重结果"
          />
          <ToolActions>
            <CopyButton text={dedupeOutput} disabled={dedupeOutput === ''} label="复制结果" />
            <ClearButton
              onClear={() => {
                setDedupeInput('');
                setDedupeOutput('');
              }}
              disabled={dedupeInput === '' && dedupeOutput === ''}
            />
          </ToolActions>
        </section>
      </section>
      {message && <ToolNotice tone="success">{message}</ToolNotice>}
      {error && <ToolNotice tone="warning">{error}</ToolNotice>}
      <ToolNotice>
        UUID 使用浏览器 Web Crypto 的安全随机数生成；不会上传、记录或复用任何标识符。
      </ToolNotice>
    </div>
  );
}
