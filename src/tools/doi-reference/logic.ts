import type { DoiValidation, ReferenceFields, ReferenceStyle } from './types';

const DOI_PATTERN = /^10\.\d{4,9}\/[._;()/:A-Z0-9-]+$/iu;

export const validateDoi = (input: string): DoiValidation => {
  const normalized = input
    .trim()
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//iu, '')
    .replace(/^doi:\s*/iu, '');
  if (normalized === '') return { valid: false, normalized: '', error: '请输入 DOI。' };
  if (!DOI_PATTERN.test(normalized))
    return { valid: false, normalized, error: 'DOI 格式无效，应以 10. 开头并包含斜杠。' };
  return { valid: true, normalized: normalized.toLocaleLowerCase(), error: null };
};

const sentence = (value: string): string => value.trim().replace(/[.。]+$/u, '');

const authorList = (authors: string): string => authors.trim().replace(/\s*;\s*/gu, '; ');

export const formatReference = (fields: ReferenceFields, style: ReferenceStyle): string => {
  const doi = validateDoi(fields.doi);
  const authors = authorList(fields.authors);
  const title = sentence(fields.title);
  const container = sentence(fields.container);
  const volumeIssue = [fields.volume.trim(), fields.issue.trim() ? `(${fields.issue.trim()})` : '']
    .filter(Boolean)
    .join('');
  const pages = fields.pages.trim();
  const doiUrl = doi.valid ? `https://doi.org/${doi.normalized}` : '';
  if (style === 'gbt7714') {
    return [
      `${authors}. ${title}[J].`,
      container ? `${container},` : '',
      fields.year.trim(),
      volumeIssue ? `, ${volumeIssue}` : '',
      pages ? `: ${pages}` : '',
      doiUrl ? `. ${doiUrl}` : '.',
    ]
      .join('')
      .replace(/,\./gu, '.')
      .trim();
  }
  if (style === 'apa7') {
    return [
      authors ? `${authors} (${fields.year.trim() || 'n.d.'}).` : '',
      title ? ` ${title}.` : '',
      container ? ` ${container}` : '',
      volumeIssue ? `, ${volumeIssue}` : '',
      pages ? `, ${pages}` : '',
      doiUrl ? `. ${doiUrl}` : '.',
    ]
      .join('')
      .trim();
  }
  const keyAuthor =
    authors
      .split(/[;,\s]/u)
      .find(Boolean)
      ?.toLocaleLowerCase()
      .replace(/[^a-z0-9]/gu, '') || 'reference';
  const key = `${keyAuthor}${fields.year.trim() || 'year'}`;
  return [
    `@article{${key},`,
    `  author = {${authors}},`,
    `  title = {${title}},`,
    container ? `  journal = {${container}},` : '',
    fields.year.trim() ? `  year = {${fields.year.trim()}},` : '',
    fields.volume.trim() ? `  volume = {${fields.volume.trim()}},` : '',
    fields.issue.trim() ? `  number = {${fields.issue.trim()}},` : '',
    pages ? `  pages = {${pages}},` : '',
    doi.valid ? `  doi = {${doi.normalized}},` : '',
    '}',
  ]
    .filter(Boolean)
    .join('\n');
};
