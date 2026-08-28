import type { ToolErrorCode } from './contracts';

/**
 * The single error type a tool may raise to its caller. It carries a stable
 * code and a safe message only — never a stack trace, an absolute path or a
 * raw exception, so it is always safe to serialize across a process boundary.
 */
export class ToolError extends Error {
  readonly code: ToolErrorCode;
  readonly details?: Record<string, string | number | boolean | null>;

  constructor(
    code: ToolErrorCode,
    message: string,
    details?: Record<string, string | number | boolean | null>,
  ) {
    super(message);
    this.name = 'ToolError';
    this.code = code;
    this.details = details;
  }
}

/** Raised by the registry when a tool id is registered twice. */
export class DuplicateToolError extends Error {
  constructor(id: string) {
    super(`Tool '${id}' is already registered`);
    this.name = 'DuplicateToolError';
  }
}

/** Raised by the registry when a tool id is not registered. */
export class ToolNotFoundError extends Error {
  constructor(id: string) {
    super(`Tool '${id}' is not registered`);
    this.name = 'ToolNotFoundError';
  }
}
