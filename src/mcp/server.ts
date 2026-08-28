// Phase 13B — MCP Server over stdio. Uses the official low-level `Server` so
// the raw Phase 13A JSON Schema remains the single source of truth (the
// high-level `McpServer` would require a parallel Zod schema). Tool allowlist
// and execution are delegated entirely to the ToolRegistry.
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createToolRegistry } from '../tool-core/index.js';
import type { ToolRegistry } from '../tool-core/index.js';
import { toCallToolResult, toMcpTool } from './adapter.js';
import { SERVER_NAME, SERVER_VERSION } from './version.js';

/**
 * First-line stdio frame limit: a single MCP message larger than this is
 * rejected by the transport before JSON.parse / dispatch. The per-tool
 * `maxInputBytes` in the registry remains the second line of defence.
 */
export const MCP_MAX_BUFFER_SIZE_BYTES = 1024 * 1024;

export const SERVER_INSTRUCTIONS =
  'Deterministic local utilities. No network access. No filesystem access. No external side effects.';

export interface McpServerHandle {
  server: Server;
  registry: ToolRegistry;
}

export const createMcpServer = (registry: ToolRegistry = createToolRegistry()): McpServerHandle => {
  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} }, instructions: SERVER_INSTRUCTIONS },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: registry.list().map(toMcpTool),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    // Structural validation, size bounds and safe error normalization all live
    // inside ToolRegistry.execute; this handler only maps the result.
    const result = await registry.execute(request.params.name, request.params.arguments ?? {});
    return toCallToolResult(result);
  });

  return { server, registry };
};
