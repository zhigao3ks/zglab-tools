interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div class="empty-state" role="status">
      <span class="empty-state-mark" aria-hidden="true">
        ∅
      </span>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}
