import { useMemo, useState } from 'preact/hooks';
import { ClearButton } from '../common/ClearButton';
import { CopyButton } from '../common/CopyButton';
import { DownloadButton } from '../common/DownloadButton';
import { ToolActions } from '../common/ToolActions';
import { ToolNotice } from '../common/ToolNotice';
import {
  cleanWhitespace,
  convertNaming,
  convertTextCase,
  detectHiddenCharacters,
  extractContacts,
  generateLoremIpsum,
  generateRandomString,
  replacePlainText,
} from '../../tools/text-enhance/logic';
import type { NamingMode, TextCaseMode } from '../../tools/text-enhance/types';
import { downloadText } from '../../utils/download';

export type TextEnhancerMode =
  'case' | 'naming' | 'cleanup' | 'find' | 'random' | 'lorem' | 'extract' | 'hidden';

interface TextEnhancerProps {
  mode: TextEnhancerMode;
}

const labels: Record<TextEnhancerMode, string> = {
  case: '大小写转换',
  naming: '命名转换',
  cleanup: '空格与空行清理',
  find: '查找替换',
  random: '随机字符串生成',
  lorem: 'Lorem Ipsum 生成',
  extract: 'URL、邮箱、手机号提取',
  hidden: '隐藏字符检测',
};

const secureRandom = (): number => {
  if (!globalThis.crypto?.getRandomValues) return Math.random();
  const values = new Uint32Array(1);
  globalThis.crypto.getRandomValues(values);
  return values[0] / 2 ** 32;
};

export function TextEnhancer({ mode }: TextEnhancerProps) {
  const [input, setInput] = useState('');
  const [caseMode, setCaseMode] = useState<TextCaseMode>('lower');
  const [namingMode, setNamingMode] = useState<NamingMode>('camel');
  const [trimLines, setTrimLines] = useState(true);
  const [collapseSpaces, setCollapseSpaces] = useState(true);
  const [blankLineLimit, setBlankLineLimit] = useState(1);
  const [search, setSearch] = useState('');
  const [replacement, setReplacement] = useState('');
  const [replaceAll, setReplaceAll] = useState(true);
  const [caseSensitive, setCaseSensitive] = useState(true);
  const [length, setLength] = useState(24);
  const [randomOptions, setRandomOptions] = useState({
    lower: true,
    upper: true,
    digits: true,
    symbols: false,
  });
  const [paragraphs, setParagraphs] = useState(3);
  const [words, setWords] = useState(48);
  const [generated, setGenerated] = useState('');
  const [error, setError] = useState('');

  const computed = useMemo(() => {
    try {
      if (mode === 'case') return convertTextCase(input, caseMode);
      if (mode === 'naming') return convertNaming(input, namingMode);
      if (mode === 'cleanup')
        return cleanWhitespace(input, { trimLines, collapseSpaces, blankLineLimit });
      if (mode === 'find')
        return input === '' || search === ''
          ? ''
          : replacePlainText(input, search, replacement, { all: replaceAll, caseSensitive });
      return '';
    } catch (cause) {
      return cause instanceof Error ? cause.message : '处理失败。';
    }
  }, [
    blankLineLimit,
    caseMode,
    caseSensitive,
    collapseSpaces,
    input,
    mode,
    namingMode,
    replaceAll,
    replacement,
    search,
    trimLines,
  ]);

  const generate = () => {
    setError('');
    try {
      if (mode === 'random') {
        const alphabet = `${randomOptions.lower ? 'abcdefghijklmnopqrstuvwxyz' : ''}${randomOptions.upper ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : ''}${randomOptions.digits ? '0123456789' : ''}${randomOptions.symbols ? '!@#$%^&*_-+=' : ''}`;
        setGenerated(generateRandomString(length, alphabet, secureRandom));
      } else if (mode === 'lorem') setGenerated(generateLoremIpsum(paragraphs, words));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '生成失败。');
    }
  };

  const extractions = mode === 'extract' ? extractContacts(input) : null;
  const hidden = mode === 'hidden' ? detectHiddenCharacters(input) : [];
  const output = mode === 'random' || mode === 'lorem' ? generated : computed;

  if (mode === 'random' || mode === 'lorem') {
    return (
      <div class="tool-app text-enhancer">
        <section class="form-panel">
          <header>
            <div>
              <span class="panel-label">LOCAL GENERATOR</span>
              <h2>{labels[mode]}</h2>
            </div>
          </header>
          {mode === 'random' ? (
            <>
              <div class="field-grid">
                <label class="field">
                  <span>长度（1–10000）</span>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={length}
                    onInput={(event) => setLength(Number(event.currentTarget.value))}
                  />
                </label>
              </div>
              <div class="option-group">
                <span>字符集</span>
                {(['lower', 'upper', 'digits', 'symbols'] as const).map((key) => (
                  <label>
                    <input
                      type="checkbox"
                      checked={randomOptions[key]}
                      onChange={(event) =>
                        setRandomOptions((current) => ({
                          ...current,
                          [key]: event.currentTarget.checked,
                        }))
                      }
                    />
                    {{ lower: '小写字母', upper: '大写字母', digits: '数字', symbols: '符号' }[key]}
                  </label>
                ))}
              </div>
            </>
          ) : (
            <div class="field-grid">
              <label class="field">
                <span>段落数（1–100）</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={paragraphs}
                  onInput={(event) => setParagraphs(Number(event.currentTarget.value))}
                />
              </label>
              <label class="field">
                <span>每段单词数（1–500）</span>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={words}
                  onInput={(event) => setWords(Number(event.currentTarget.value))}
                />
              </label>
            </div>
          )}
          <ToolActions>
            <button class="action-button action-button-primary" type="button" onClick={generate}>
              生成内容
            </button>
          </ToolActions>
        </section>
        <section class="editor-panel">
          <header>
            <div>
              <span class="panel-label">GENERATED OUTPUT</span>
              <h2>结果</h2>
            </div>
          </header>
          <textarea value={output} readOnly placeholder="生成结果" spellcheck={false} />
          <ToolActions>
            <CopyButton text={output} disabled={output === ''} label="复制结果" />
            <DownloadButton
              disabled={output === ''}
              label="下载 TXT"
              onDownload={() => downloadText(output, `zglab-${mode}.txt`)}
            />
            <ClearButton onClear={() => setGenerated('')} disabled={output === ''} />
          </ToolActions>
        </section>
        {error && <ToolNotice tone="error">{error}</ToolNotice>}
        <ToolNotice>
          {mode === 'random'
            ? '随机字符串优先使用浏览器 Web Crypto；生成结果不会保存。'
            : 'Lorem Ipsum 由本地词库生成，可直接复制用于排版占位。'}
        </ToolNotice>
      </div>
    );
  }

  return (
    <div class="tool-app text-enhancer">
      <section class="text-enhancer-options">
        {mode === 'case' && (
          <label class="field">
            <span>转换方式</span>
            <select
              value={caseMode}
              onChange={(event) => setCaseMode(event.currentTarget.value as TextCaseMode)}
            >
              <option value="lower">全部小写</option>
              <option value="upper">全部大写</option>
              <option value="title">标题格式</option>
              <option value="sentence">句首大写</option>
            </select>
          </label>
        )}
        {mode === 'naming' && (
          <label class="field">
            <span>目标命名</span>
            <select
              value={namingMode}
              onChange={(event) => setNamingMode(event.currentTarget.value as NamingMode)}
            >
              <option value="camel">camelCase</option>
              <option value="pascal">PascalCase</option>
              <option value="snake">snake_case</option>
              <option value="kebab">kebab-case</option>
              <option value="constant">CONSTANT_CASE</option>
              <option value="dot">dot.case</option>
            </select>
          </label>
        )}
        {mode === 'cleanup' && (
          <>
            <div class="option-group">
              <span>清理规则</span>
              <label>
                <input
                  type="checkbox"
                  checked={trimLines}
                  onChange={(event) => setTrimLines(event.currentTarget.checked)}
                />
                移除每行首尾空白
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={collapseSpaces}
                  onChange={(event) => setCollapseSpaces(event.currentTarget.checked)}
                />
                合并连续空格
              </label>
            </div>
            <label class="field">
              <span>最多保留连续空行</span>
              <input
                type="number"
                min="0"
                max="20"
                value={blankLineLimit}
                onInput={(event) => setBlankLineLimit(Number(event.currentTarget.value))}
              />
            </label>
          </>
        )}
        {mode === 'find' && (
          <>
            <label class="field">
              <span>查找</span>
              <input value={search} onInput={(event) => setSearch(event.currentTarget.value)} />
            </label>
            <label class="field">
              <span>替换为</span>
              <input
                value={replacement}
                onInput={(event) => setReplacement(event.currentTarget.value)}
              />
            </label>
            <div class="option-group">
              <label>
                <input
                  type="checkbox"
                  checked={replaceAll}
                  onChange={(event) => setReplaceAll(event.currentTarget.checked)}
                />
                替换全部
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={caseSensitive}
                  onChange={(event) => setCaseSensitive(event.currentTarget.checked)}
                />
                大小写敏感
              </label>
            </div>
          </>
        )}
      </section>
      <div class="editor-grid">
        <section class="editor-panel">
          <header>
            <div>
              <span class="panel-label">INPUT</span>
              <h2>输入文本</h2>
            </div>
            <span>{input.length.toLocaleString('zh-CN')} 字符</span>
          </header>
          <textarea
            value={input}
            onInput={(event) => setInput(event.currentTarget.value)}
            placeholder={
              mode === 'hidden' ? '粘贴文本以检测零宽空格、BOM 等不可见字符' : '输入或粘贴文本'
            }
            spellcheck={false}
          />
          <ToolActions>
            <ClearButton onClear={() => setInput('')} disabled={input === ''} />
          </ToolActions>
        </section>
        <section class="editor-panel">
          <header>
            <div>
              <span class="panel-label">OUTPUT</span>
              <h2>
                {mode === 'extract' ? '提取结果' : mode === 'hidden' ? '检测结果' : '处理结果'}
              </h2>
            </div>
          </header>
          {mode === 'extract' ? (
            <div class="extraction-results">
              {(['urls', 'emails', 'phones'] as const).map((key) => (
                <article>
                  <strong>
                    {{ urls: 'URL', emails: '邮箱', phones: '手机号' }[key]}（
                    {extractions?.[key].length ?? 0}）
                  </strong>
                  <pre>{extractions?.[key].join('\n') || '—'}</pre>
                </article>
              ))}
            </div>
          ) : mode === 'hidden' ? (
            <div class="hidden-results">
              {hidden.length === 0 ? (
                <p class="empty-copy">没有检测到所支持的隐藏字符。</p>
              ) : (
                hidden.map((item) => (
                  <div>
                    <code>{item.index}</code>
                    <span>{item.visible}</span>
                    <strong>{item.label}</strong>
                    <code>{item.codePoint}</code>
                  </div>
                ))
              )}
            </div>
          ) : (
            <textarea value={output} readOnly placeholder="处理结果" spellcheck={false} />
          )}
          {mode !== 'extract' && mode !== 'hidden' && (
            <ToolActions>
              <CopyButton text={output} disabled={output === ''} label="复制结果" />
              <DownloadButton
                disabled={output === ''}
                label="下载 TXT"
                onDownload={() => downloadText(output, `zglab-${mode}.txt`)}
              />
            </ToolActions>
          )}
        </section>
      </div>
      <ToolNotice>
        {mode === 'hidden'
          ? '检测当前支持的零宽字符、不换行空格、BOM、制表符与回车符。'
          : mode === 'extract'
            ? 'URL、邮箱和中国大陆手机号从当前输入中本地提取并去重。'
            : '输入文本只在浏览器当前页面中处理，不会上传或写入本地存储。'}
      </ToolNotice>
    </div>
  );
}
