import type { ChartSeries, DataTable } from './types';

const parseDelimitedLine = (line: string, delimiter: string): string[] => {
  const values: string[] = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (character === delimiter && !quoted) {
      values.push(current.trim());
      current = '';
    } else current += character;
  }
  values.push(current.trim());
  return values;
};

export const parseDataTable = (input: string): DataTable => {
  const lines = input
    .replace(/\r\n?/gu, '\n')
    .split('\n')
    .filter((line) => line.trim() !== '');
  if (lines.length < 2) throw new Error('至少需要一行表头和一行数据。');
  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  const headers = parseDelimitedLine(lines[0], delimiter);
  if (headers.length < 2 || headers.some((header) => header === ''))
    throw new Error('请提供至少两列非空表头。');
  const rows = lines.slice(1).map((line) => parseDelimitedLine(line, delimiter));
  return { headers, rows };
};

const numberAt = (row: string[], index: number): number | null => {
  const value = Number(row[index]);
  return Number.isFinite(value) ? value : null;
};

export const numericColumns = (table: DataTable): string[] =>
  table.headers.filter((_, index) => table.rows.some((row) => numberAt(row, index) !== null));

export const createChartSeries = (
  table: DataTable,
  xHeader: string,
  yHeader: string,
): ChartSeries => {
  const xIndex = table.headers.indexOf(xHeader);
  const yIndex = table.headers.indexOf(yHeader);
  if (xIndex < 0 || yIndex < 0) throw new Error('请选择有效的 X 与 Y 列。');
  const points = table.rows.flatMap((row, index) => {
    const y = numberAt(row, yIndex);
    const x = numberAt(row, xIndex);
    return y === null ? [] : [{ x: x ?? index + 1, y, label: row[xIndex] ?? String(index + 1) }];
  });
  if (points.length === 0) throw new Error('所选 Y 列没有可绘制的数值。');
  const xValues = points.map((point) => point.x);
  const yValues = points.map((point) => point.y);
  return {
    points,
    xMin: Math.min(...xValues),
    xMax: Math.max(...xValues),
    yMin: Math.min(...yValues),
    yMax: Math.max(...yValues),
  };
};
