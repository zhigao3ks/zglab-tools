import { useRef, useState } from 'preact/hooks';
import type { ActionState } from '../../types/common';

interface DownloadButtonProps {
  onDownload: () => void | Promise<void>;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function DownloadButton({
  onDownload,
  label = '下载',
  disabled = false,
  className = '',
}: DownloadButtonProps) {
  const [state, setState] = useState<ActionState>('idle');
  const resetTimer = useRef<number | undefined>(undefined);

  const handleDownload = async () => {
    if (disabled || state === 'loading') return;
    window.clearTimeout(resetTimer.current);
    setState('loading');
    try {
      await onDownload();
      setState('success');
    } catch {
      setState('error');
    }
    resetTimer.current = window.setTimeout(() => setState('idle'), 1800);
  };

  const stateLabel =
    state === 'loading'
      ? '生成中…'
      : state === 'success'
        ? '已下载'
        : state === 'error'
          ? '下载失败'
          : label;

  return (
    <button
      class={`action-button ${className}`}
      type="button"
      disabled={disabled || state === 'loading'}
      onClick={handleDownload}
      data-state={state}
    >
      <span aria-hidden="true">↓</span>
      {stateLabel}
    </button>
  );
}
