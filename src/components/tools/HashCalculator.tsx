import { useRef, useState } from 'preact/hooks';
import { ClearButton } from '../common/ClearButton';
import { CopyButton } from '../common/CopyButton';
import { ToolActions } from '../common/ToolActions';
import { ToolNotice } from '../common/ToolNotice';
import { calculateHash, calculateTextHashes } from '../../tools/hash/logic';
import type { HashAlgorithm, HashResult } from '../../tools/hash/types';

const algorithms: HashAlgorithm[] = ['MD5', 'SHA-1', 'SHA-256', 'SHA-512'];

export function HashCalculator() {
  const [input, setInput] = useState('');
  const [selected, setSelected] = useState<HashAlgorithm[]>(algorithms);
  const [results, setResults] = useState<HashResult[]>([]);
  const [fileName, setFileName] = useState('');
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const toggleAlgorithm = (algorithm: HashAlgorithm) => {
    setSelected((current) =>
      current.includes(algorithm)
        ? current.filter((item) => item !== algorithm)
        : [...current, algorithm],
    );
  };

  const run = async () => {
    if (busy || selected.length === 0) return;
    setBusy(true);
    setError('');
    try {
      const next = fileBytes
        ? await Promise.all(
            selected.map(async (algorithm) => ({
              algorithm,
              value: await calculateHash(fileBytes, algorithm),
            })),
          )
        : await calculateTextHashes(input, selected);
      setResults(next);
    } catch (cause) {
      setResults([]);
      setError(cause instanceof Error ? cause.message : '哈希计算失败。');
    } finally {
      setBusy(false);
    }
  };

  const loadFile = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    try {
      setFileBytes(new Uint8Array(await file.arrayBuffer()));
      setFileName(file.name);
      setResults([]);
    } catch {
      setError('无法读取所选文件。');
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const clear = () => {
    setInput('');
    setFileBytes(null);
    setFileName('');
    setResults([]);
    setError('');
  };

  return (
    <div class="tool-app hash-tool">
      <section class="form-panel">
        <header>
          <div>
            <span class="panel-label">WEB CRYPTO · LOCAL ONLY</span>
            <h2>哈希输入</h2>
          </div>
        </header>
        <textarea
          value={input}
          onInput={(event) => {
            setInput(event.currentTarget.value);
            setFileBytes(null);
            setFileName('');
          }}
          placeholder="输入要计算哈希的文本；或选择本地文件"
          spellcheck={false}
          aria-label="哈希文本输入"
        />
        <input
          ref={fileInput}
          class="visually-hidden"
          type="file"
          onChange={(event) => void loadFile(event.currentTarget.files?.[0])}
        />
        <div class="hash-options">
          <div class="option-group">
            <span>算法</span>
            {algorithms.map((algorithm) => (
              <label>
                <input
                  type="checkbox"
                  checked={selected.includes(algorithm)}
                  onChange={() => toggleAlgorithm(algorithm)}
                />
                {algorithm}
              </label>
            ))}
          </div>
          <div class="file-summary">
            {fileBytes
              ? `文件输入：${fileName} · ${fileBytes.length.toLocaleString('zh-CN')} 字节`
              : '当前使用文本输入（UTF-8）'}
          </div>
        </div>
        <ToolActions>
          <button
            class="action-button action-button-primary"
            type="button"
            onClick={() => void run()}
            disabled={busy || selected.length === 0 || (!fileBytes && input === '')}
          >
            {busy ? '计算中…' : '计算哈希'}
          </button>
          <button
            class="action-button"
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={busy}
          >
            选择文件
          </button>
          <ClearButton
            onClear={clear}
            disabled={busy || (input === '' && !fileBytes && results.length === 0)}
          />
        </ToolActions>
      </section>
      {error && <ToolNotice tone="error">{error}</ToolNotice>}
      {selected.length === 0 && <ToolNotice tone="warning">请至少选择一种哈希算法。</ToolNotice>}
      {results.length > 0 && (
        <section class="form-panel hash-results">
          <header>
            <div>
              <span class="panel-label">HASH OUTPUT</span>
              <h2>计算结果</h2>
            </div>
          </header>
          <dl class="result-list">
            {results.map((result) => (
              <div>
                <dt>{result.algorithm}</dt>
                <dd>
                  <code>{result.value}</code>
                  <CopyButton text={result.value} label="复制" />
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      <ToolNotice>
        MD5 由本地实现计算；SHA 系列使用浏览器 Web Crypto。哈希只能用于完整性比对，MD5 与 SHA-1
        不适合密码或安全签名。
      </ToolNotice>
    </div>
  );
}
