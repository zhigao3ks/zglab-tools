import type { ComponentChildren } from 'preact';

interface ToolNoticeProps {
  tone?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: ComponentChildren;
}

export function ToolNotice({ tone = 'info', title, children }: ToolNoticeProps) {
  return (
    <div class="tool-notice" data-tone={tone} role={tone === 'error' ? 'alert' : 'status'}>
      {title && <strong>{title}</strong>}
      <span>{children}</span>
    </div>
  );
}
