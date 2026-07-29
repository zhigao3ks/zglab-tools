import { useMemo, useState } from 'preact/hooks';
import { ClearButton } from '../common/ClearButton';
import { CopyButton } from '../common/CopyButton';
import { ToolActions } from '../common/ToolActions';
import { ToolNotice } from '../common/ToolNotice';
import { parseJwt, prettyJson } from '../../tools/jwt/logic';
import type { ParsedJwt } from '../../tools/jwt/types';

const sample =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ6Z2xhYiIsIm5hbWUiOiJaR0xhYiBUb29scyIsImV4cCI6NDEwMjQ0NDgwMH0.signature';

export function JwtDecoder() {
  const [input, setInput] = useState('');
  const { parsed, error } = useMemo<{ parsed: ParsedJwt | null; error: string }>(() => {
    if (input.trim() === '') return { parsed: null, error: '' };
    try {
      return { parsed: parseJwt(input), error: '' };
    } catch (cause) {
      return { parsed: null, error: cause instanceof Error ? cause.message : 'JWT 解析失败。' };
    }
  }, [input]);

  const expiration = parsed?.expiration;
  const expirationText =
    !expiration || expiration.status === 'not-set'
      ? '未提供 exp'
      : expiration.status === 'expired'
        ? `已过期 · ${expiration.iso}`
        : `有效至 · ${expiration.iso}`;

  return (
    <div class="tool-app jwt-tool">
      <section class="editor-panel">
        <header>
          <div>
            <span class="panel-label">JSON WEB TOKEN</span>
            <h2>JWT 输入</h2>
          </div>
          <span>仅本地解析</span>
        </header>
        <textarea
          value={input}
          onInput={(event) => setInput(event.currentTarget.value)}
          placeholder="粘贴 Header.Payload.Signature 格式的 JWT"
          spellcheck={false}
          aria-label="JWT 输入"
        />
        <ToolActions>
          <button
            class="action-button action-button-quiet"
            type="button"
            onClick={() => setInput(sample)}
          >
            加载示例
          </button>
          <CopyButton text={input} disabled={input === ''} label="复制 Token" />
          <ClearButton onClear={() => setInput('')} disabled={input === ''} />
        </ToolActions>
      </section>
      {error && <ToolNotice tone="error">{error}</ToolNotice>}
      {parsed && (
        <>
          <dl class="metadata-strip jwt-status">
            <div>
              <dt>算法</dt>
              <dd>{typeof parsed.header.alg === 'string' ? parsed.header.alg : '—'}</dd>
            </div>
            <div>
              <dt>类型</dt>
              <dd>{typeof parsed.header.typ === 'string' ? parsed.header.typ : '—'}</dd>
            </div>
            <div>
              <dt>过期状态</dt>
              <dd data-status={expiration?.status}>{expirationText}</dd>
            </div>
          </dl>
          <div class="editor-grid">
            <section class="editor-panel">
              <header>
                <div>
                  <span class="panel-label">HEADER</span>
                  <h2>Header</h2>
                </div>
              </header>
              <textarea
                value={prettyJson(parsed.header)}
                readOnly
                spellcheck={false}
                aria-label="JWT Header"
              />
              <ToolActions>
                <CopyButton text={prettyJson(parsed.header)} label="复制 Header" />
              </ToolActions>
            </section>
            <section class="editor-panel">
              <header>
                <div>
                  <span class="panel-label">PAYLOAD</span>
                  <h2>Payload</h2>
                </div>
              </header>
              <textarea
                value={prettyJson(parsed.payload)}
                readOnly
                spellcheck={false}
                aria-label="JWT Payload"
              />
              <ToolActions>
                <CopyButton text={prettyJson(parsed.payload)} label="复制 Payload" />
              </ToolActions>
            </section>
          </div>
          <section class="form-panel jwt-signature">
            <span class="panel-label">SIGNATURE</span>
            <code>{parsed.signature}</code>
          </section>
        </>
      )}
      <ToolNotice tone="warning">
        此工具只解码 Header 与
        Payload，无法验证签名、可信来源或权限。不要把真实生产令牌分享给不可信的人。
      </ToolNotice>
    </div>
  );
}
