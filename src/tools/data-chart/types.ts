export type ChartType = 'line' | 'scatter' | 'bar';

export interface DataTable {
  headers: string[];
  rows: string[][];
}

export interface ChartPoint {
  x: number;
  y: number;
  label: string;
}

export interface ChartSeries {
  points: ChartPoint[];
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}
