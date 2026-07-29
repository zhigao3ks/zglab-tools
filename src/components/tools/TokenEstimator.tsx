import { useMemo, useState } from 'preact/hooks';
import { ClearButton } from '../common/ClearButton';
import { ToolActions } from '../common/ToolActions';
import { ToolNotice } from '../common/ToolNotice';
import { estimateTokens } from '../../tools/token-estimator/logic';

export function TokenEstimator() {
  const [input, setInput] = useState('');
  const result = useMemo(() => estimateTokens(input), [input]);

  return (
    <div class="tool-app token-tool">
      <section class="editor-panel">
        <header>
          <div>
            <span class="panel-label">LOCAL TOKEN HEURISTIC</span>
            <h2>输入文本</h2>
          </div>
          <span>{result.characters.toLocaleString('zh-CN')} 字符</span>
        </header>
        <textarea
          value={input}
          onInput={(event) => setInput(event.currentTarget.value)}
          placeholder="粘贴提示词、文章、代码或中英混合内容"
          spellcheck={false}
          aria-label="待估算 Token 的文本"
        />
        <ToolActions>
          <ClearButton onClear={() => setInput('')} disabled={input === ''} />
        </ToolActions>
      </section>
      <section class="token-results">
        <article>
          <span>通用中英混合</span>
          <strong>{result.estimates.balanced.toLocaleString('zh-CN')}</strong>
          <small>建议默认参考</small>
        </article>
        <article>
          <span>中文密集文本</span>
          <strong>{result.estimates.chineseHeavy.toLocaleString('zh-CN')}</strong>
          <small>中文与标点占比较高</small>
        </article>
        <article>
          <span>英文 / 代码</span>
          <strong>{result.estimates.englishOrCode.toLocaleString('zh-CN')}</strong>
          <small>英文、数字、代码占比较高</small>
        </article>
      </section>
      <dl class="metadata-strip token-stats">
        <div>
          <dt>中文字符</dt>
          <dd>{result.hanCharacters.toLocaleString('zh-CN')}</dd>
        </div>
        <div>
          <dt>拉丁字符</dt>
          <dd>{result.latinCharacters.toLocaleString('zh-CN')}</dd>
        </div>
        <div>
          <dt>数字与符号</dt>
          <dd>{result.numbersAndSymbols.toLocaleString('zh-CN')}</dd>
        </div>
        <div>
          <dt>行数</dt>
          <dd>{result.lines.toLocaleString('zh-CN')}</dd>
        </div>
      </dl>
      <ToolNotice tone="warning">
        这是本地启发式估算，不等同于特定模型的真实分词。实际 Token
        会随模型、编码器、空格、标点和代码结构变化。
      </ToolNotice>
    </div>
  );
}
