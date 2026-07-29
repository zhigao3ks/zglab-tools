import { describe, expect, it } from 'vitest';
import { createChartSeries, numericColumns, parseDataTable } from './logic';

describe('data chart logic', () => {
  it('parses CSV data and exposes numeric columns', () => {
    const table = parseDataTable('time,control,experiment\n0,1.2,1.4\n1,1.8,2.1');
    expect(numericColumns(table)).toEqual(['time', 'control', 'experiment']);
    expect(createChartSeries(table, 'time', 'experiment')).toMatchObject({
      xMin: 0,
      xMax: 1,
      yMin: 1.4,
      yMax: 2.1,
    });
  });

  it('supports quoted CSV fields', () => {
    expect(parseDataTable('x,label\n1,"sample, one"').rows[0]).toEqual(['1', 'sample, one']);
  });
});
