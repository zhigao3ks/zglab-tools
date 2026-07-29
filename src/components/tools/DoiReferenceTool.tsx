import { useMemo, useState } from 'preact/hooks';
import { ClearButton } from '../common/ClearButton';
import { CopyButton } from '../common/CopyButton';
import { ToolActions } from '../common/ToolActions';
import { ToolNotice } from '../common/ToolNotice';
import { formatReference, validateDoi } from '../../tools/doi-reference/logic';
import type { ReferenceFields, ReferenceStyle } from '../../tools/doi-reference/types';

const initialFields: ReferenceFields = {
  authors: '',
  title: '',
  container: '',
  year: '',
  volume: '',
  issue: '',
  pages: '',
  doi: '',
};

export function DoiReferenceTool() {
  const [fields, setFields] = useState<ReferenceFields>(initialFields);
  const [style, setStyle] = useState<ReferenceStyle>('gbt7714');
  const doi = useMemo(() => validateDoi(fields.doi), [fields.doi]);
  const output = useMemo(() => formatReference(fields, style), [fields, style]);
  const setField = <Key extends keyof ReferenceFields>(key: Key, value: ReferenceFields[Key]) =>
    setFields((current) => ({ ...current, [key]: value }));

  return (
    <div class="tool-app doi-tool">
      <section class="doi-status" data-valid={fields.doi === '' ? undefined : doi.valid}>
        <strong>
          {fields.doi === '' ? '输入 DOI 进行检查' : doi.valid ? 'DOI 格式有效' : 'DOI 格式无效'}
        </strong>
        <span>
          {fields.doi === ''
            ? '支持 doi: 前缀及 doi.org 链接'
            : doi.valid
              ? doi.normalized
              : doi.error}
        </span>
      </section>
      <section class="field-grid doi-fields">
        <label class="field field-wide">
          <span>DOI</span>
          <input
            value={fields.doi}
            onInput={(event) => setField('doi', event.currentTarget.value)}
            placeholder="10.1000/example 或 https://doi.org/10.1000/example"
            spellcheck={false}
          />
        </label>
        <label class="field">
          <span>作者</span>
          <input
            value={fields.authors}
            onInput={(event) => setField('authors', event.currentTarget.value)}
            placeholder="多个作者用 ; 分隔"
          />
        </label>
        <label class="field">
          <span>年份</span>
          <input
            value={fields.year}
            onInput={(event) => setField('year', event.currentTarget.value)}
            placeholder="2026"
          />
        </label>
        <label class="field field-wide">
          <span>标题</span>
          <input
            value={fields.title}
            onInput={(event) => setField('title', event.currentTarget.value)}
          />
        </label>
        <label class="field field-wide">
          <span>期刊 / 出版物</span>
          <input
            value={fields.container}
            onInput={(event) => setField('container', event.currentTarget.value)}
          />
        </label>
        <label class="field">
          <span>卷</span>
          <input
            value={fields.volume}
            onInput={(event) => setField('volume', event.currentTarget.value)}
          />
        </label>
        <label class="field">
          <span>期</span>
          <input
            value={fields.issue}
            onInput={(event) => setField('issue', event.currentTarget.value)}
          />
        </label>
        <label class="field">
          <span>页码</span>
          <input
            value={fields.pages}
            onInput={(event) => setField('pages', event.currentTarget.value)}
            placeholder="10-20"
          />
        </label>
        <label class="field">
          <span>输出样式</span>
          <select
            value={style}
            onChange={(event) => setStyle(event.currentTarget.value as ReferenceStyle)}
          >
            <option value="gbt7714">GB/T 7714</option>
            <option value="apa7">APA 7</option>
            <option value="bibtex">BibTeX</option>
          </select>
        </label>
      </section>
      <section class="editor-panel">
        <header>
          <div>
            <span class="panel-label">FORMATTED REFERENCE</span>
            <h2>参考文献输出</h2>
          </div>
        </header>
        <textarea value={output} readOnly spellcheck={false} aria-label="格式化参考文献" />
        <ToolActions>
          <CopyButton text={output} disabled={output === ''} label="复制结果" />
          <ClearButton
            onClear={() => setFields(initialFields)}
            disabled={Object.values(fields).every((value) => value === '')}
          />
        </ToolActions>
      </section>
      <ToolNotice>
        DOI 检查只验证通用语法，不请求 Crossref
        等外部服务；参考文献由你填写的结构化字段本地格式化，请在投稿前按期刊要求复核。
      </ToolNotice>
    </div>
  );
}
