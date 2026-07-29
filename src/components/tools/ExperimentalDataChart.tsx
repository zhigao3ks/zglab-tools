import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { DownloadButton } from '../common/DownloadButton';
import { ToolActions } from '../common/ToolActions';
import { ToolNotice } from '../common/ToolNotice';
import { createChartSeries, numericColumns, parseDataTable } from '../../tools/data-chart/logic';
import type { ChartSeries, ChartType } from '../../tools/data-chart/types';
import { downloadBlob } from '../../utils/download';

const sample = `time,control,experiment
0,1.2,1.4
1,1.8,2.1
2,2.6,3.3
3,3.1,4.2
4,3.7,5.0`;

const drawChart = (
  canvas: HTMLCanvasElement,
  series: ChartSeries,
  type: ChartType,
  xLabel: string,
  yLabel: string,
): void => {
  const width = 960;
  const height = 560;
  const left = 82;
  const right = 30;
  const top = 34;
  const bottom = 72;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return;
  context.fillStyle = '#f4f0e6';
  context.fillRect(0, 0, width, height);
  const xSpan = series.xMax === series.xMin ? 1 : series.xMax - series.xMin;
  const yMin = type === 'bar' ? Math.min(0, series.yMin) : series.yMin;
  const yMax = type === 'bar' ? Math.max(0, series.yMax) : series.yMax;
  const ySpan = yMax === yMin ? 1 : yMax - yMin;
  const toX = (value: number): number =>
    left + ((value - series.xMin) / xSpan) * (width - left - right);
  const toY = (value: number): number =>
    height - bottom - ((value - yMin) / ySpan) * (height - top - bottom);
  context.strokeStyle = '#b8afa0';
  context.lineWidth = 1;
  context.font = '13px ui-monospace, monospace';
  context.fillStyle = '#4e5358';
  for (let index = 0; index <= 5; index += 1) {
    const ratio = index / 5;
    const y = top + ratio * (height - top - bottom);
    const value = yMax - ratio * ySpan;
    context.beginPath();
    context.moveTo(left, y);
    context.lineTo(width - right, y);
    context.stroke();
    context.fillText(value.toPrecision(4), 10, y + 4);
  }
  context.strokeStyle = '#172027';
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(left, top);
  context.lineTo(left, height - bottom);
  context.lineTo(width - right, height - bottom);
  context.stroke();
  context.fillStyle = '#172027';
  context.fillText(xLabel, width / 2 - 24, height - 22);
  context.save();
  context.translate(20, height / 2 + 24);
  context.rotate(-Math.PI / 2);
  context.fillText(yLabel, 0, 0);
  context.restore();
  context.strokeStyle = '#e14a34';
  context.fillStyle = '#e14a34';
  context.lineWidth = 3;
  if (type === 'bar') {
    const baseline = toY(0);
    const barWidth = Math.max(4, ((width - left - right) / series.points.length) * 0.65);
    for (const point of series.points)
      context.fillRect(
        toX(point.x) - barWidth / 2,
        toY(point.y),
        barWidth,
        baseline - toY(point.y),
      );
  } else {
    if (type === 'line') {
      context.beginPath();
      series.points.forEach((point, index) =>
        index === 0
          ? context.moveTo(toX(point.x), toY(point.y))
          : context.lineTo(toX(point.x), toY(point.y)),
      );
      context.stroke();
    }
    for (const point of series.points) {
      context.beginPath();
      context.arc(toX(point.x), toY(point.y), 5, 0, Math.PI * 2);
      context.fill();
    }
  }
};

export function ExperimentalDataChart() {
  const [input, setInput] = useState(sample);
  const [xColumn, setXColumn] = useState('time');
  const [yColumn, setYColumn] = useState('experiment');
  const [type, setType] = useState<ChartType>('line');
  const canvas = useRef<HTMLCanvasElement>(null);
  const parsed = useMemo(() => {
    try {
      return { table: parseDataTable(input), error: '' };
    } catch (cause) {
      return { table: null, error: cause instanceof Error ? cause.message : '数据解析失败。' };
    }
  }, [input]);
  const columns = parsed.table ? numericColumns(parsed.table) : [];
  const selectedX = columns.includes(xColumn) ? xColumn : (columns[0] ?? '');
  const selectedY = columns.includes(yColumn) ? yColumn : (columns[1] ?? columns[0] ?? '');
  const series = useMemo(() => {
    try {
      return {
        value:
          parsed.table && selectedX && selectedY
            ? createChartSeries(parsed.table, selectedX, selectedY)
            : null,
        error: '',
      };
    } catch (cause) {
      return { value: null, error: cause instanceof Error ? cause.message : '图表生成失败。' };
    }
  }, [parsed.table, selectedX, selectedY]);

  useEffect(() => {
    if (canvas.current && series.value)
      drawChart(canvas.current, series.value, type, selectedX, selectedY);
  }, [selectedX, selectedY, series.value, type]);

  return (
    <div class="tool-app chart-tool">
      <div class="chart-layout">
        <section class="editor-panel">
          <header>
            <div>
              <span class="panel-label">CSV / TSV INPUT</span>
              <h2>实验数据</h2>
            </div>
            <span>{parsed.table?.rows.length ?? 0} 行</span>
          </header>
          <textarea
            value={input}
            onInput={(event) => setInput(event.currentTarget.value)}
            placeholder="第一行为表头，后续为数据；支持 CSV 或 TSV"
            spellcheck={false}
          />
          <ToolActions>
            <button
              class="action-button action-button-quiet"
              type="button"
              onClick={() => setInput(sample)}
            >
              加载示例
            </button>
          </ToolActions>
        </section>
        <section class="form-panel chart-settings">
          <header>
            <div>
              <span class="panel-label">PLOT SETTINGS</span>
              <h2>图表设置</h2>
            </div>
          </header>
          <label class="field">
            <span>X 轴数值列</span>
            <select value={selectedX} onChange={(event) => setXColumn(event.currentTarget.value)}>
              {columns.map((column) => (
                <option value={column}>{column}</option>
              ))}
            </select>
          </label>
          <label class="field">
            <span>Y 轴数值列</span>
            <select value={selectedY} onChange={(event) => setYColumn(event.currentTarget.value)}>
              {columns.map((column) => (
                <option value={column}>{column}</option>
              ))}
            </select>
          </label>
          <label class="field">
            <span>图表类型</span>
            <select
              value={type}
              onChange={(event) => setType(event.currentTarget.value as ChartType)}
            >
              <option value="line">折线图</option>
              <option value="scatter">散点图</option>
              <option value="bar">柱状图</option>
            </select>
          </label>
          <p>图表只绘制所选的两个数值列；无效数据行会自动忽略。</p>
        </section>
      </div>
      {parsed.error || series.error ? (
        <ToolNotice tone="error">{parsed.error || series.error}</ToolNotice>
      ) : (
        series.value && (
          <section class="chart-canvas-panel">
            <canvas ref={canvas} aria-label="实验数据图表" />
            <ToolActions>
              <DownloadButton
                label="下载 PNG"
                onDownload={() => {
                  const chartCanvas = canvas.current;
                  if (!chartCanvas) throw new Error('图表尚未绘制完成。');
                  return new Promise<void>((resolve, reject) =>
                    chartCanvas.toBlob((blob) => {
                      if (blob) {
                        downloadBlob(blob, 'zglab-experimental-chart.png');
                        resolve();
                      } else reject(new Error('导出失败'));
                    }, 'image/png'),
                  );
                }}
              />
            </ToolActions>
          </section>
        )
      )}
      <ToolNotice>
        数据解析、绘图和 PNG 导出全部在浏览器本地进行。当前轻量图表用于快速探索单组 X/Y
        实验数据，不替代统计分析或正式论文绘图软件。
      </ToolNotice>
    </div>
  );
}
