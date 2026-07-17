import { useMemo, useState } from 'preact/hooks';
import { normalizeText } from './logic';

export function ToolIsland() {
  const [input, setInput] = useState('');
  const [trim, setTrim] = useState(true);
  const output = useMemo(() => normalizeText(input, { trim, collapseSpaces: true }), [input, trim]);

  return (
    <div class="tool-app">
      <label class="field">
        <span>输入文本</span>
        <textarea value={input} onInput={(event) => setInput(event.currentTarget.value)} />
      </label>
      <label class="toggle-control">
        <input
          type="checkbox"
          checked={trim}
          onChange={(event) => setTrim(event.currentTarget.checked)}
        />
        <span>去除首尾空白</span>
      </label>
      <label class="field">
        <span>输出</span>
        <textarea value={output} readOnly />
      </label>
    </div>
  );
}
