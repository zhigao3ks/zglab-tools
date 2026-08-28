// Phase 13B — stdio entrypoint. stdout is reserved for the MCP protocol only;
// every diagnostic goes to stderr. No console.log, no startup banner.
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer, MCP_MAX_BUFFER_SIZE_BYTES } from './server.js';

const main = async (): Promise<void> => {
  const { server } = createMcpServer();
  const transport = new StdioServerTransport(undefined, undefined, {
    maxBufferSize: MCP_MAX_BUFFER_SIZE_BYTES,
  });

  const shutdown = async (code: number): Promise<void> => {
    try {
      await server.close();
    } catch {
      // closing is best-effort; never mask the exit code
    }
    process.exit(code);
  };

  process.on('SIGINT', () => void shutdown(0));
  process.on('SIGTERM', () => void shutdown(0));
  process.stdin.on('end', () => void shutdown(0));
  process.on('uncaughtException', (error: unknown) => {
    process.stderr.write(
      `zglab-tools-mcp: fatal ${error instanceof Error ? error.message : 'error'}\n`,
    );
    void shutdown(1);
  });
  process.on('unhandledRejection', () => {
    process.stderr.write('zglab-tools-mcp: fatal unhandled rejection\n');
    void shutdown(1);
  });

  await server.connect(transport);
};

void main();
