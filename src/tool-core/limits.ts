/**
 * Default bounded-resource policy for every Phase 13A tool.
 *
 * These are the shared defaults; individual tools may tighten them, but the
 * first batch all use these exact values. `timeoutMs` is reserved metadata —
 * Phase 13A tools are bounded synchronous pure functions and are enforced at
 * the process boundary by the Phase 13B MCP server, not preempted in-band.
 */
export const DEFAULT_TOOL_LIMITS = {
  maxInputBytes: 256 * 1024,
  maxOutputBytes: 256 * 1024,
  timeoutMs: 2000,
} as const;
