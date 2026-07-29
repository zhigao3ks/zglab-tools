import { useMemo, useState } from 'preact/hooks';
import { CopyButton } from '../common/CopyButton';
import { ToolNotice } from '../common/ToolNotice';
import {
  calculateScreenRatio,
  convertPixelsAndRem,
  gradientCss,
  hexToRgb,
  hslToRgb,
  normalizeHex,
  radiusCss,
  rgbToHex,
  rgbToHsl,
  shadowCss,
} from '../../tools/design/logic';

export type DesignToolMode =
  'color' | 'picker' | 'gradient' | 'shadow' | 'radius' | 'rem' | 'screen';

interface DesignToolProps {
  mode: DesignToolMode;
}

const numberValue = (event: Event): number =>
  Number((event.currentTarget as HTMLInputElement).value);

export function DesignTool({ mode }: DesignToolProps) {
  const [hex, setHex] = useState('#3B82F6');
  const [first, setFirst] = useState('#3B82F6');
  const [second, setSecond] = useState('#8B5CF6');
  const [angle, setAngle] = useState(135);
  const [shadow, setShadow] = useState({
    x: 0,
    y: 12,
    blur: 32,
    spread: -8,
    color: '#1D4ED8',
    inset: false,
  });
  const [radii, setRadii] = useState({
    topLeft: 16,
    topRight: 16,
    bottomRight: 16,
    bottomLeft: 16,
  });
  const [value, setValue] = useState(16);
  const [root, setRoot] = useState(16);
  const [unit, setUnit] = useState<'px' | 'rem'>('px');
  const [screen, setScreen] = useState({ width: 1920, height: 1080 });

  const color = useMemo(() => {
    try {
      const rgb = hexToRgb(hex);
      return { hex: normalizeHex(hex), rgb, hsl: rgbToHsl(rgb), error: '' };
    } catch (cause) {
      return {
        hex: '',
        rgb: null,
        hsl: null,
        error: cause instanceof Error ? cause.message : '颜色无效。',
      };
    }
  }, [hex]);

  if (mode === 'color' || mode === 'picker') {
    const updateRgb = (key: 'red' | 'green' | 'blue', next: number) => {
      if (!color.rgb) return;
      setHex(rgbToHex({ ...color.rgb, [key]: next }));
    };
    const updateHsl = (key: 'hue' | 'saturation' | 'lightness', next: number) => {
      if (!color.hsl) return;
      setHex(rgbToHex(hslToRgb({ ...color.hsl, [key]: next })));
    };
    return (
      <div class="tool-app design-tool">
        <section class="color-workbench">
          <div class="color-swatch" style={{ background: color.hex || '#000000' }} />
          <div class="color-inputs">
            {mode === 'picker' && (
              <label class="field">
                <span>选择颜色</span>
                <input
                  type="color"
                  value={color.hex || '#000000'}
                  onInput={(event) => setHex(event.currentTarget.value)}
                />
              </label>
            )}
            <label class="field">
              <span>HEX</span>
              <input
                value={hex}
                onInput={(event) => setHex(event.currentTarget.value)}
                placeholder="#3B82F6"
                spellcheck={false}
              />
            </label>
            <div class="field-grid">
              {(['red', 'green', 'blue'] as const).map((key) => (
                <label class="field">
                  <span>RGB {key[0].toUpperCase()}</span>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={color.rgb?.[key] ?? ''}
                    onInput={(event) => updateRgb(key, numberValue(event))}
                  />
                </label>
              ))}
            </div>
            <div class="field-grid">
              {(['hue', 'saturation', 'lightness'] as const).map((key) => (
                <label class="field">
                  <span>HSL {key === 'hue' ? 'H' : key === 'saturation' ? 'S' : 'L'}</span>
                  <input
                    type="number"
                    min="0"
                    max={key === 'hue' ? 360 : 100}
                    value={color.hsl?.[key] ?? ''}
                    onInput={(event) => updateHsl(key, numberValue(event))}
                  />
                </label>
              ))}
            </div>
          </div>
        </section>
        {color.error ? (
          <ToolNotice tone="error">{color.error}</ToolNotice>
        ) : (
          <section class="css-output">
            <code>{color.hex}</code>
            <code>
              rgb({color.rgb?.red}, {color.rgb?.green}, {color.rgb?.blue})
            </code>
            <code>
              hsl({color.hsl?.hue} {color.hsl?.saturation}% {color.hsl?.lightness}%)
            </code>
            <CopyButton text={color.hex} label="复制 HEX" />
          </section>
        )}
        <ToolNotice>
          {mode === 'picker'
            ? '使用原生颜色面板选择颜色，或直接输入 HEX、RGB、HSL 值。'
            : 'HEX、RGB 和 HSL 会实时双向换算，所有计算在浏览器本地完成。'}
        </ToolNotice>
      </div>
    );
  }

  if (mode === 'gradient') {
    const css = gradientCss(first, second, angle);
    return (
      <div class="tool-app design-tool">
        <section class="design-control-grid">
          <label class="field">
            <span>起始颜色</span>
            <input
              type="color"
              value={first}
              onInput={(event) => setFirst(event.currentTarget.value)}
            />
          </label>
          <label class="field">
            <span>结束颜色</span>
            <input
              type="color"
              value={second}
              onInput={(event) => setSecond(event.currentTarget.value)}
            />
          </label>
          <label class="field">
            <span>角度：{angle}°</span>
            <input
              type="range"
              min="0"
              max="360"
              value={angle}
              onInput={(event) => setAngle(numberValue(event))}
            />
          </label>
        </section>
        <div class="design-preview gradient-preview" style={{ background: css }} />
        <section class="css-output">
          <code>background: {css};</code>
          <CopyButton text={`background: ${css};`} label="复制 CSS" />
        </section>
        <ToolNotice>生成标准 CSS linear-gradient，可直接用于背景属性。</ToolNotice>
      </div>
    );
  }

  if (mode === 'shadow') {
    const css = shadowCss(shadow);
    return (
      <div class="tool-app design-tool">
        <section class="design-control-grid">
          {(['x', 'y', 'blur', 'spread'] as const).map((key) => (
            <label class="field">
              <span>
                {{ x: '水平偏移', y: '垂直偏移', blur: '模糊', spread: '扩展' }[key]}：{shadow[key]}
                px
              </span>
              <input
                type="range"
                min={key === 'spread' ? -50 : -100}
                max="100"
                value={shadow[key]}
                onInput={(event) =>
                  setShadow((current) => ({ ...current, [key]: numberValue(event) }))
                }
              />
            </label>
          ))}
          <label class="field">
            <span>颜色</span>
            <input
              type="color"
              value={shadow.color}
              onInput={(event) =>
                setShadow((current) => ({ ...current, color: event.currentTarget.value }))
              }
            />
          </label>
          <label class="toggle-control">
            <input
              type="checkbox"
              checked={shadow.inset}
              onChange={(event) =>
                setShadow((current) => ({ ...current, inset: event.currentTarget.checked }))
              }
            />
            <span>内阴影</span>
          </label>
        </section>
        <div class="design-preview shadow-preview">
          <div style={{ boxShadow: css }}>ZGLab</div>
        </div>
        <section class="css-output">
          <code>box-shadow: {css};</code>
          <CopyButton text={`box-shadow: ${css};`} label="复制 CSS" />
        </section>
        <ToolNotice>调整偏移、模糊、扩展和颜色，预览与 CSS 会同步更新。</ToolNotice>
      </div>
    );
  }

  if (mode === 'radius') {
    const css = radiusCss(radii.topLeft, radii.topRight, radii.bottomRight, radii.bottomLeft);
    return (
      <div class="tool-app design-tool">
        <section class="design-control-grid">
          {(['topLeft', 'topRight', 'bottomRight', 'bottomLeft'] as const).map((key) => (
            <label class="field">
              <span>
                {
                  { topLeft: '左上', topRight: '右上', bottomRight: '右下', bottomLeft: '左下' }[
                    key
                  ]
                }
                ：{radii[key]}px
              </span>
              <input
                type="range"
                min="0"
                max="160"
                value={radii[key]}
                onInput={(event) =>
                  setRadii((current) => ({ ...current, [key]: numberValue(event) }))
                }
              />
            </label>
          ))}
        </section>
        <div class="design-preview radius-preview">
          <div style={{ borderRadius: css }}>ZGLab</div>
        </div>
        <section class="css-output">
          <code>border-radius: {css};</code>
          <CopyButton text={`border-radius: ${css};`} label="复制 CSS" />
        </section>
        <ToolNotice>四个角可独立设置，生成标准 CSS border-radius 值。</ToolNotice>
      </div>
    );
  }

  if (mode === 'rem') {
    const result = (() => {
      try {
        return {
          value: convertPixelsAndRem(unit === 'px' ? value : value * root, root),
          error: '',
        };
      } catch (cause) {
        return { value: null, error: cause instanceof Error ? cause.message : '计算失败。' };
      }
    })();
    return (
      <div class="tool-app design-tool">
        <section class="design-control-grid">
          <label class="field">
            <span>输入数值</span>
            <input type="number" value={value} onInput={(event) => setValue(numberValue(event))} />
          </label>
          <label class="field">
            <span>输入单位</span>
            <select
              value={unit}
              onChange={(event) => setUnit(event.currentTarget.value as 'px' | 'rem')}
            >
              <option value="px">px → rem</option>
              <option value="rem">rem → px</option>
            </select>
          </label>
          <label class="field">
            <span>根字号（px）</span>
            <input
              type="number"
              min="1"
              value={root}
              onInput={(event) => setRoot(numberValue(event))}
            />
          </label>
        </section>
        {result.error ? (
          <ToolNotice tone="error">{result.error}</ToolNotice>
        ) : (
          <section class="css-output">
            <code>
              {unit === 'px'
                ? `${value}px = ${result.value?.rem.toFixed(4)}rem`
                : `${value}rem = ${result.value?.px}px`}
            </code>
            <CopyButton
              text={unit === 'px' ? `${result.value?.rem.toFixed(4)}rem` : `${result.value?.px}px`}
              label={unit === 'px' ? '复制 REM' : '复制 PX'}
            />
          </section>
        )}
        <ToolNotice>按设定的根字号双向计算 px 与 rem；常用根字号为 16px。</ToolNotice>
      </div>
    );
  }

  const result = (() => {
    try {
      return { value: calculateScreenRatio(screen.width, screen.height), error: '' };
    } catch (cause) {
      return { value: null, error: cause instanceof Error ? cause.message : '计算失败。' };
    }
  })();
  return (
    <div class="tool-app design-tool">
      <section class="design-control-grid">
        <label class="field">
          <span>宽度（px）</span>
          <input
            type="number"
            min="1"
            value={screen.width}
            onInput={(event) => setScreen((current) => ({ ...current, width: numberValue(event) }))}
          />
        </label>
        <label class="field">
          <span>高度（px）</span>
          <input
            type="number"
            min="1"
            value={screen.height}
            onInput={(event) =>
              setScreen((current) => ({ ...current, height: numberValue(event) }))
            }
          />
        </label>
      </section>
      {result.error ? (
        <ToolNotice tone="error">{result.error}</ToolNotice>
      ) : (
        <>
          <div class="screen-preview" style={{ aspectRatio: `${screen.width} / ${screen.height}` }}>
            <span>
              {screen.width} × {screen.height}
            </span>
          </div>
          <dl class="metadata-strip screen-stats">
            <div>
              <dt>最简比例</dt>
              <dd>{result.value?.ratio}</dd>
            </div>
            <div>
              <dt>小数比例</dt>
              <dd>{result.value?.decimal}</dd>
            </div>
            <div>
              <dt>方向</dt>
              <dd>{result.value?.orientation}</dd>
            </div>
          </dl>
        </>
      )}
      <ToolNotice>输入任意屏幕、画布或视频宽高，自动化简比例并判断方向。</ToolNotice>
    </div>
  );
}
