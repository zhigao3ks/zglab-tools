import { useRef, useState } from 'preact/hooks';
import { ClearButton } from '../common/ClearButton';
import { CopyButton } from '../common/CopyButton';
import { DownloadButton } from '../common/DownloadButton';
import { ToolActions } from '../common/ToolActions';
import { ToolNotice } from '../common/ToolNotice';
import {
  base64ToBytes,
  bytesToBase64,
  decodeBase64ToText,
  encodeTextToBase64,
  formatBase64,
} from '../../tools/base64/logic';
import type { Base64Operation } from '../../tools/base64/types';
import { downloadBlob, downloadText } from '../../utils/download';

const sample = 'ZGLab Tools：中文、Emoji 😀 和普通文本都会在本地转换。';

export function Base64Codec() {
  const [operation, setOperation] = useState<Base64Operation>('encode');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [decodedBytes, setDecodedBytes] = useState<Uint8Array | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const run = () => {
    setError('');
    setMessage('');
    try {
      if (operation === 'encode') {
        setOutput(encodeTextToBase64(input));
        setDecodedBytes(null);
        setMessage('文本已编码为 Base64。');
      } else {
        const result = decodeBase64ToText(input);
        setOutput(result.text);
        setDecodedBytes(result.bytes);
        setMessage('Base64 已解码为 UTF-8 文本。');
      }
    } catch (cause) {
      setOutput('');
      if (operation === 'decode') {
        try {
          setDecodedBytes(base64ToBytes(input));
          setError(
            `${cause instanceof Error ? cause.message : '该内容无法显示为文本。'} 已保留本地二进制下载。`,
          );
          return;
        } catch {
          // The primary error is clearer for malformed Base64 input.
        }
      }
      setDecodedBytes(null);
      setError(cause instanceof Error ? cause.message : '处理失败。');
    }
  };

  const loadFile = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    setMessage('');
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      setOperation('encode');
      setOutput(bytesToBase64(bytes));
      setDecodedBytes(null);
      setMessage(
        `已在本地读取“${file.name}”（${bytes.length.toLocaleString('zh-CN')} 字节）并完成 Base64 编码。`,
      );
    } catch {
      setError('无法读取所选文件。');
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const clear = () => {
    setInput('');
    setOutput('');
    setDecodedBytes(null);
    setMessage('');
    setError('');
  };

  return (
    <div class="tool-app codec-tool">
      <div class="tool-toolbar">
        <div class="segmented-control" aria-label="Base64 操作">
          <span>操作</span>
          <button
            type="button"
            aria-pressed={operation === 'encode'}
            onClick={() => setOperation('encode')}
          >
            文本编码
          </button>
          <button
            type="button"
            aria-pressed={operation === 'decode'}
            onClick={() => setOperation('decode')}
          >
            文本解码
          </button>
        </div>
        <input
          ref={fileInput}
          class="visually-hidden"
          type="file"
          onChange={(event) => void loadFile(event.currentTarget.files?.[0])}
        />
        <button class="action-button" type="button" onClick={() => fileInput.current?.click()}>
          选择文件并编码
        </button>
      </div>

      <div class="editor-grid">
        <section class="editor-panel">
          <header>
            <div>
              <span class="panel-label">
                {operation === 'encode' ? 'UTF-8 TEXT' : 'BASE64 INPUT'}
              </span>
              <h2>{operation === 'encode' ? '输入文本' : '输入 Base64'}</h2>
            </div>
            <span>{input.length.toLocaleString('zh-CN')} 字符</span>
          </header>
          <textarea
            value={input}
            onInput={(event) => setInput(event.currentTarget.value)}
            placeholder={
              operation === 'encode'
                ? '输入或粘贴文本（支持中文与 Emoji）'
                : '粘贴 Base64 或 Base64URL 内容'
            }
            spellcheck={false}
            aria-label={operation === 'encode' ? '待编码文本' : '待解码 Base64'}
          />
          <ToolActions>
            <button
              class="action-button action-button-primary"
              type="button"
              onClick={run}
              disabled={input === ''}
            >
              {operation === 'encode' ? '编码为 Base64' : '解码为文本'}
            </button>
            <button
              class="action-button action-button-quiet"
              type="button"
              onClick={() => setInput(sample)}
            >
              加载示例
            </button>
            <ClearButton onClear={clear} disabled={input === '' && output === ''} />
          </ToolActions>
        </section>

        <section class="editor-panel">
          <header>
            <div>
              <span class="panel-label">LOCAL OUTPUT</span>
              <h2>转换结果</h2>
            </div>
            <span>{output.length.toLocaleString('zh-CN')} 字符</span>
          </header>
          <textarea
            value={output}
            readOnly
            placeholder="结果将在这里显示"
            spellcheck={false}
            aria-label="Base64 转换结果"
          />
          <ToolActions>
            <CopyButton text={output} disabled={output === ''} label="复制结果" />
            {operation === 'encode' && (
              <button
                class="action-button"
                type="button"
                onClick={() => setOutput(formatBase64(output))}
                disabled={output === ''}
              >
                每行 76 字符
              </button>
            )}
            <DownloadButton
              disabled={output === ''}
              label="下载 TXT"
              onDownload={() =>
                downloadText(
                  output,
                  operation === 'encode' ? 'zglab-base64.txt' : 'zglab-decoded.txt',
                )
              }
            />
            {decodedBytes && (
              <DownloadButton
                label="下载二进制"
                onDownload={() => {
                  const bytes = decodedBytes.buffer.slice(
                    decodedBytes.byteOffset,
                    decodedBytes.byteOffset + decodedBytes.byteLength,
                  ) as ArrayBuffer;
                  downloadBlob(new Blob([bytes]), 'zglab-decoded.bin');
                }}
              />
            )}
          </ToolActions>
        </section>
      </div>
      {message && <ToolNotice tone="success">{message}</ToolNotice>}
      {error && <ToolNotice tone="error">{error}</ToolNotice>}
      <ToolNotice>
        文件读取、文本编码和解码均在浏览器本地完成。Base64 解码为非 UTF-8
        文件时，可使用“下载二进制”。
      </ToolNotice>
    </div>
  );
}
