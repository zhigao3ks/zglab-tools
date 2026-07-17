import { useRef, useState } from 'preact/hooks';
import type { ActionState } from '../../types/common';
import { copyToClipboard } from '../../utils/clipboard';

interface CopyButtonProps {
  text: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}

const stateLabels: Record<ActionState, string> = {
  idle: '',
  loading: '复制中…',
  success: '已复制',
  error: '复制失败',
};

export function CopyButton({
  text,
  label = '复制',
  disabled = false,
  className = '',
}: CopyButtonProps) {
  const [state, setState] = useState<ActionState>('idle');
  const resetTimer = useRef<number | undefined>(undefined);

  const handleCopy = async () => {
    if (disabled || state === 'loading') return;
    window.clearTimeout(resetTimer.current);
    setState('loading');
    const copied = await copyToClipboard(text);
    setState(copied ? 'success' : 'error');
    resetTimer.current = window.setTimeout(() => setState('idle'), 1600);
  };

  return (
    <button
      class={`action-button ${className}`}
      type="button"
      disabled={disabled || state === 'loading'}
      onClick={handleCopy}
      data-state={state}
    >
      <span aria-hidden="true">□</span>
      {state === 'idle' ? label : stateLabels[state]}
    </button>
  );
}
