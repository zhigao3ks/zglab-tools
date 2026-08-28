// Phase 13C — production-shaped MCP server build.
//
// Bundles src/mcp/cli.ts (and the shared tool core it imports) into a single
// runnable ESM file at dist-mcp/cli.js. node_modules packages stay external, so
// the artifact resolves the official MCP SDK from the installed dependencies.
// The browser site (Astro `dist/`) is untouched and never includes this file.
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
await mkdir(new URL('../dist-mcp', import.meta.url), { recursive: true });

await build({
  entryPoints: ['src/mcp/cli.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  outfile: 'dist-mcp/cli.js',
  packages: 'external',
  define: {
    __MCP_SERVER_VERSION__: JSON.stringify(pkg.version),
  },
  logLevel: 'info',
});
