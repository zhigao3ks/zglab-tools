import { useEffect, useMemo, useState } from 'preact/hooks';
import { CopyButton } from '../common/CopyButton';
import { ToolNotice } from '../common/ToolNotice';
import {
  datePartsToDate,
  FALLBACK_TIME_ZONES,
  getSupportedTimeZones,
  timestampToDate,
} from '../../tools/timestamp/logic';
import type { TimestampConversion, TimestampUnit } from '../../tools/timestamp/types';

interface DateConversionOutput {
  seconds: number;
  milliseconds: number;
  iso: string;
}

const toDateInput = (date: Date): string => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
};

const toTimeInput = (date: Date): string => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(11, 19);
};

export function TimestampConverter() {
  const [now, setNow] = useState<Date | null>(null);
  const [paused, setPaused] = useState(false);
  const [timestampInput, setTimestampInput] = useState('');
  const [unit, setUnit] = useState<TimestampUnit>('auto');
  const [selectedZone, setSelectedZone] = useState('UTC');
  const [timeZones, setTimeZones] = useState<string[]>([...FALLBACK_TIME_ZONES]);
  const [timestampResult, setTimestampResult] = useState<TimestampConversion | null>(null);
  const [timestampError, setTimestampError] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [dateZone, setDateZone] = useState('local');
  const [dateResult, setDateResult] = useState<DateConversionOutput | null>(null);
  const [dateError, setDateError] = useState('');

  useEffect(() => {
    const current = new Date();
    setNow(current);
    setDateInput(toDateInput(current));
    setTimeInput(toTimeInput(current));
    const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    setSelectedZone(browserZone);
    setTimeZones(getSupportedTimeZones());
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, [paused]);

  const currentValues = useMemo(() => {
    if (!now) return null;
    return {
      seconds: Math.trunc(now.getTime() / 1000),
      milliseconds: now.getTime(),
      local: now.toLocaleString('zh-CN', { hour12: false }),
      utc: now.toUTCString(),
    };
  }, [now]);

  const convertTimestamp = () => {
    const result = timestampToDate(timestampInput, unit, selectedZone);
    if (result.ok) {
      setTimestampResult(result.value);
      setTimestampError('');
    } else {
      setTimestampResult(null);
      setTimestampError(result.error);
    }
  };

  const convertDate = () => {
    const result = datePartsToDate({ date: dateInput, time: timeInput, timeZone: dateZone });
    if (result.ok) {
      setDateResult({
        seconds: Math.trunc(result.date.getTime() / 1000),
        milliseconds: result.date.getTime(),
        iso: result.date.toISOString(),
      });
      setDateError('');
    } else {
      setDateResult(null);
      setDateError(result.error);
    }
  };

  return (
    <div class="tool-app timestamp-tool">
      <section class="current-time-panel">
        <div class="panel-heading-inline">
          <div>
            <span class="panel-label">LIVE CLOCK</span>
            <h2>当前时间</h2>
          </div>
          <button class="action-button" type="button" onClick={() => setPaused((value) => !value)}>
            {paused ? '恢复更新' : '暂停更新'}
          </button>
        </div>
        {currentValues ? (
          <div class="current-time-grid" aria-live="polite">
            <div>
              <span>Unix 秒</span>
              <code>{currentValues.seconds}</code>
              <CopyButton text={String(currentValues.seconds)} label="复制" />
            </div>
            <div>
              <span>Unix 毫秒</span>
              <code>{currentValues.milliseconds}</code>
              <CopyButton text={String(currentValues.milliseconds)} label="复制" />
            </div>
            <div>
              <span>浏览器本地时间</span>
              <code>{currentValues.local}</code>
              <CopyButton text={currentValues.local} label="复制" />
            </div>
            <div>
              <span>UTC</span>
              <code>{currentValues.utc}</code>
              <CopyButton text={currentValues.utc} label="复制" />
            </div>
          </div>
        ) : (
          <p class="loading-line">正在读取浏览器系统时间…</p>
        )}
      </section>

      <div class="timestamp-converter-grid">
        <section class="form-panel">
          <header>
            <span class="panel-label">TIMESTAMP → DATE</span>
            <h2>时间戳转日期</h2>
          </header>
          <div class="field-grid">
            <label class="field field-wide">
              <span>时间戳</span>
              <input
                type="text"
                inputMode="decimal"
                value={timestampInput}
                onInput={(event) => setTimestampInput(event.currentTarget.value)}
                placeholder="例如 1700000000 或 1700000000000"
              />
            </label>
            <label class="field">
              <span>单位</span>
              <select
                value={unit}
                onChange={(event) => setUnit(event.currentTarget.value as TimestampUnit)}
              >
                <option value="auto">自动识别</option>
                <option value="seconds">秒</option>
                <option value="milliseconds">毫秒</option>
              </select>
            </label>
            <label class="field">
              <span>指定时区</span>
              <select
                value={selectedZone}
                onChange={(event) => setSelectedZone(event.currentTarget.value)}
              >
                {timeZones.map((zone) => (
                  <option value={zone}>{zone}</option>
                ))}
              </select>
            </label>
          </div>
          <button
            class="action-button action-button-primary"
            type="button"
            onClick={convertTimestamp}
            disabled={timestampInput.trim() === ''}
          >
            转换时间戳
          </button>
          {timestampError && <ToolNotice tone="error">{timestampError}</ToolNotice>}
          {timestampResult && (
            <dl class="result-list">
              <div>
                <dt>识别单位</dt>
                <dd>{timestampResult.detectedUnit === 'seconds' ? '秒' : '毫秒'}</dd>
              </div>
              <div>
                <dt>ISO 8601</dt>
                <dd>
                  <code>{timestampResult.iso}</code>
                  <CopyButton text={timestampResult.iso} />
                </dd>
              </div>
              <div>
                <dt>UTC</dt>
                <dd>
                  <code>{timestampResult.utc}</code>
                  <CopyButton text={timestampResult.utc} />
                </dd>
              </div>
              <div>
                <dt>浏览器本地时间</dt>
                <dd>
                  <code>{timestampResult.local}</code>
                  <CopyButton text={timestampResult.local} />
                </dd>
              </div>
              <div>
                <dt>{selectedZone}</dt>
                <dd>
                  <code>{timestampResult.zoned}</code>
                  <CopyButton text={timestampResult.zoned} />
                </dd>
              </div>
              <div>
                <dt>相对当前时间</dt>
                <dd>{timestampResult.relative}</dd>
              </div>
            </dl>
          )}
        </section>

        <section class="form-panel">
          <header>
            <span class="panel-label">DATE → TIMESTAMP</span>
            <h2>日期转时间戳</h2>
          </header>
          <div class="field-grid">
            <label class="field">
              <span>日期</span>
              <input
                type="date"
                value={dateInput}
                onInput={(event) => setDateInput(event.currentTarget.value)}
              />
            </label>
            <label class="field">
              <span>时间</span>
              <input
                type="time"
                step="1"
                value={timeInput}
                onInput={(event) => setTimeInput(event.currentTarget.value)}
              />
            </label>
            <label class="field field-wide">
              <span>输入时间所属时区</span>
              <select value={dateZone} onChange={(event) => setDateZone(event.currentTarget.value)}>
                <option value="local">浏览器本地时区</option>
                <option value="UTC">UTC</option>
                {timeZones
                  .filter((zone) => zone !== 'UTC')
                  .map((zone) => (
                    <option value={zone}>{zone}</option>
                  ))}
              </select>
            </label>
          </div>
          <button
            class="action-button action-button-primary"
            type="button"
            onClick={convertDate}
            disabled={!dateInput || !timeInput}
          >
            转换日期
          </button>
          {dateError && <ToolNotice tone="error">{dateError}</ToolNotice>}
          {dateResult && (
            <dl class="result-list">
              <div>
                <dt>Unix 秒</dt>
                <dd>
                  <code>{dateResult.seconds}</code>
                  <CopyButton text={String(dateResult.seconds)} />
                </dd>
              </div>
              <div>
                <dt>Unix 毫秒</dt>
                <dd>
                  <code>{dateResult.milliseconds}</code>
                  <CopyButton text={String(dateResult.milliseconds)} />
                </dd>
              </div>
              <div>
                <dt>ISO 8601</dt>
                <dd>
                  <code>{dateResult.iso}</code>
                  <CopyButton text={dateResult.iso} />
                </dd>
              </div>
            </dl>
          )}
        </section>
      </div>
      <ToolNotice>
        自动识别将绝对值大于等于 100,000,000,000 的输入视为毫秒；早期时间或歧义数据请手动选择单位。
      </ToolNotice>
    </div>
  );
}
