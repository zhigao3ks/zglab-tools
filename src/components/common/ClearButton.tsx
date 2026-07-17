import { useRef, useState } from 'preact/hooks';
import type { ActionState } from '../../types/common';

interface ClearButtonProps {
  onClear: () => void | Promise<void>;
  disabled?: boolean;
  label?: string;
}

export function ClearButton({ onClear, disabled = false, label = '清空' }: ClearButtonProps) {
  const [state, setState] = useState<ActionState>('idle');
  const resetTimer = useRef<number | undefined>(undefined);

  const handleClear = async () => {
    if (disabled || state === 'loading') return;
    window.clearTimeout(resetTimer.current);
    setState('loading');
    try {
      await onClear();
      setState('success');
    } catch {
      setState('error');
    }
    resetTimer.current = window.setTimeout(() => setState('idle'), 1200);
  };

  return (
    <button
      class="action-button action-button-quiet"
      type="button"
      disabled={disabled || state === 'loading'}
      onClick={handleClear}
      data-state={state}
    >
      {state === 'success' ? '已清空' : state === 'error' ? '清空失败' : label}
    </button>
  );
}
