import { useMemo, useState } from 'preact/hooks';
import { ClearButton } from '../common/ClearButton';
import { CopyButton } from '../common/CopyButton';
import { ToolActions } from '../common/ToolActions';
import { ToolNotice } from '../common/ToolNotice';
import { compareText } from '../../tools/text-diff/logic';
import type { DiffSegment } from '../../tools/text-diff/types';

const sampleLeft = 'ZGLab Tools 在浏览器本地处理文本。\n不上传，不登录。';
const sampleRight = 'ZGLab Tools 在浏览器本地处理内容。\n不上传、无需登录。';

function DiffContent({ segments }: { segments: DiffSegment[] }) {
  return (
    <>
      {segments.map((segment, index) => (
        <span key={index} class={`diff-segment diff-${segment.kind}`}>
          {segment.value}
        </span>
      ))}
    </>
  );
}

export function TextDiff() {
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const result = useMemo(() => compareText(left, right), [left, right]);

  return (
    <div class="tool-app diff-tool">
      <div class="diff-editor-grid">
        <label class="editor-panel">
          <header>
            <div>
              <span class="panel-label">ORIGINAL / LEFT</span>
              <h2>左侧文本</h2>
            </div>
            <span>{left.length.toLocaleString('zh-CN')} 字符</span>
          </header>
          <textarea
            value={left}
            onInput={(event) => setLeft(event.currentTarget.value)}
            placeholder="粘贴原始文本"
            spellcheck={false}
            aria-label="左侧对比文本"
          />
        </label>
        <label class="editor-panel">
          <header>
            <div>
              <span class="panel-label">REVISED / RIGHT</span>
              <h2>右侧文本</h2>
            </div>
            <span>{right.length.toLocaleString('zh-CN')} 字符</span>
          </header>
          <textarea
            value={right}
            onInput={(event) => setRight(event.currentTarget.value)}
            placeholder="粘贴修改后的文本"
            spellcheck={false}
            aria-label="右侧对比文本"
          />
        </label>
      </div>
      <ToolActions className="line-actions">
        <button
          class="action-button action-button-quiet"
          type="button"
          onClick={() => {
            setLeft(sampleLeft);
            setRight(sampleRight);
          }}
        >
          加载示例
        </button>
        <button
          class="action-button"
          type="button"
          onClick={() => {
            const current = left;
            setLeft(right);
            setRight(current);
          }}
        >
          交换左右
        </button>
        <CopyButton text={left} disabled={left === ''} label="复制左侧" />
        <CopyButton text={right} disabled={right === ''} label="复制右侧" />
        <ClearButton
          onClear={() => {
            setLeft('');
            setRight('');
          }}
          disabled={left === '' && right === ''}
        />
      </ToolActions>
      <section class="diff-result-grid" aria-label="文本对比高亮结果">
        <article>
          <header>
            <span>左侧：删除内容以红色标记</span>
          </header>
          <pre>
            <DiffContent segments={result.left} />
          </pre>
        </article>
        <article>
          <header>
            <span>右侧：新增内容以绿色标记</span>
          </header>
          <pre>
            <DiffContent segments={result.right} />
          </pre>
        </article>
      </section>
      <dl class="metadata-strip diff-stats">
        <div>
          <dt>新增字符</dt>
          <dd>{result.addedCharacters.toLocaleString('zh-CN')}</dd>
        </div>
        <div>
          <dt>删除字符</dt>
          <dd>{result.removedCharacters.toLocaleString('zh-CN')}</dd>
        </div>
        <div>
          <dt>相同字符</dt>
          <dd>{result.unchangedCharacters.toLocaleString('zh-CN')}</dd>
        </div>
      </dl>
      {result.coarse && (
        <ToolNotice tone="warning">
          文本较长，已自动切换为按行对比或粗粒度对比，以避免页面卡顿。
        </ToolNotice>
      )}
      <ToolNotice>
        对比在本地实时计算；左侧突出删除内容，右侧突出新增内容。不会上传两侧文本。
      </ToolNotice>
    </div>
  );
}
