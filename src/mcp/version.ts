// Phase 13B/13C — MCP server identity. The version is injected at build time
// by scripts/build-mcp.mjs (single source of truth = package.json version).
// The dev path (`tsx src/mcp/cli.ts`) and any build without the define fall
// back to a safe default; `typeof` on an undeclared identifier is the one
// operator that never throws.
declare const __MCP_SERVER_VERSION__: string | undefined;

export const SERVER_NAME = 'zglab-tools-mcp';
export const SERVER_VERSION =
  typeof __MCP_SERVER_VERSION__ === 'string' ? __MCP_SERVER_VERSION__ : '0.0.1';
