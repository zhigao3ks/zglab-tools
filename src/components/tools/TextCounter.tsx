import { useEffect, useMemo, useState } from 'preact/hooks';
import { ClearButton } from '../common/ClearButton';
import { CopyButton } from '../common/CopyButton';
import { DownloadButton } from '../common/DownloadButton';
import { ToolActions } from '../common/ToolActions';
import {
  countText,
  createStatisticsReport,
  DEFAULT_READING_SPEEDS,
} from '../../tools/text-counter/logic';
import type { ReadingSpeeds } from '../../tools/text-counter/types';
import { createTimestampedFilename, downloadText } from '../../utils/download';
import { clampNumber, formatInteger, formatReadingMinutes } from '../../utils/text';

const sampleText = `ZGLab Tools 是一个浏览器端轻量工具箱。

All processing happens locally in your browser. 文本不会上传服务器，也不会写入本地存储。😀

Version 1 includes 5 practical tools.`;

export function TextCounter() {
  const [input, setInput] = useState('');
  const [debouncedInput, setDebouncedInput] = useState('');
  const [speeds, setSpeeds] = useState<ReadingSpeeds>(DEFAULT_READING_SPEEDS);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedInput(input), 140);
    return () => window.clearTimeout(timer);
  }, [input]);

  const statistics = useMemo(() => countText(debouncedInput, speeds), [debouncedInput, speeds]);
  const report = useMemo(() => createStatisticsReport(statistics), [statistics]);

  const updateSpeed = (key: keyof ReadingSpeeds, value: string) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return;
    setSpeeds((current) => ({ ...current, [key]: clampNumber(numeric, 1, 2000) }));
  };

  const metrics = [
    ['总字符', formatInteger(statistics.characterCount)],
    ['不含空白', formatInteger(statistics.nonWhitespaceCharacterCount)],
    ['中文字符', formatInteger(statistics.chineseCharacterCount)],
    ['英文字母', formatInteger(statistics.englishLetterCount)],
    ['英文单词', formatInteger(statistics.englishWordCount)],
    ['数字', formatInteger(statistics.digitCount)],
    ['空格/制表符', formatInteger(statistics.spaceCount)],
    ['标点', formatInteger(statistics.punctuationCount)],
    ['总行数', formatInteger(statistics.lineCount)],
    ['非空行', formatInteger(statistics.nonEmptyLineCount)],
    ['段落', formatInteger(statistics.paragraphCount)],
    ['UTF-8 字节', formatInteger(statistics.utf8Bytes)],
  ];

  return (
    <div class="tool-app text-counter-tool">
      <div class="counter-layout">
        <section class="editor-panel counter-input">
          <header>
            <div>
              <span class="panel-label">LIVE INPUT</span>
              <h2>输入文本</h2>
            </div>
            <span>140 ms 防抖统计</span>
          </header>
          <textarea
            value={input}
            onInput={(event) => setInput(event.currentTarget.value)}
            placeholder="输入或粘贴需要统计的文本"
            aria-label="待统计文本"
          />
          <ToolActions>
            <button class="action-button" type="button" onClick={() => setInput(sampleText)}>
              加载示例
            </button>
            <ClearButton onClear={() => setInput('')} disabled={input === ''} />
            <CopyButton text={report} label="复制统计摘要" disabled={input === ''} />
            <DownloadButton
              label="下载 TXT 报告"
              disabled={input === ''}
              onDownload={() =>
                downloadText(report, createTimestampedFilename('text-statistics', 'txt'))
              }
            />
          </ToolActions>
          <div class="reading-settings">
            <label>
              <span>中文阅读速度（字/分钟）</span>
              <input
                type="number"
                min="1"
                max="2000"
                value={speeds.chineseCharactersPerMinute}
                onInput={(event) =>
                  updateSpeed('chineseCharactersPerMinute', event.currentTarget.value)
                }
              />
            </label>
            <label>
              <span>英文阅读速度（词/分钟）</span>
              <input
                type="number"
                min="1"
                max="2000"
                value={speeds.englishWordsPerMinute}
                onInput={(event) => updateSpeed('englishWordsPerMinute', event.currentTarget.value)}
              />
            </label>
          </div>
        </section>

        <section class="counter-results" aria-live="polite">
          <header>
            <span class="panel-label">STATISTICS</span>
            <h2>统计结果</h2>
          </header>
          <dl class="metric-grid">
            {metrics.map(([label, value]) => (
              <div>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <dl class="reading-time-grid">
            <div>
              <dt>中文阅读</dt>
              <dd>{formatReadingMinutes(statistics.chineseReadingMinutes)}</dd>
            </div>
            <div>
              <dt>英文阅读</dt>
              <dd>{formatReadingMinutes(statistics.englishReadingMinutes)}</dd>
            </div>
            <div>
              <dt>综合估算</dt>
              <dd>{formatReadingMinutes(statistics.combinedReadingMinutes)}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
