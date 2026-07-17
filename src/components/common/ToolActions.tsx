import type { ComponentChildren } from 'preact';

interface ToolActionsProps {
  children: ComponentChildren;
  className?: string;
}

export function ToolActions({ children, className = '' }: ToolActionsProps) {
  return <div class={`tool-actions ${className}`}>{children}</div>;
}
