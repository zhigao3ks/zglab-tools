import { describe, expect, it } from 'vitest';
import { formatReference, validateDoi } from './logic';

describe('DOI and reference logic', () => {
  it('normalizes valid DOI URLs', () => {
    expect(validateDoi('https://doi.org/10.1000/XYZ.1')).toEqual({
      valid: true,
      normalized: '10.1000/xyz.1',
      error: null,
    });
  });

  it('rejects malformed DOI', () => {
    expect(validateDoi('doi: invalid')).toMatchObject({ valid: false });
  });

  it('formats a structured reference as BibTeX', () => {
    expect(
      formatReference(
        {
          authors: 'Doe, J.',
          title: 'Local tools',
          container: 'Tool Journal',
          year: '2026',
          volume: '4',
          issue: '2',
          pages: '10-20',
          doi: '10.1000/test',
        },
        'bibtex',
      ),
    ).toContain('doi = {10.1000/test}');
  });
});
