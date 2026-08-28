// Phase 13C — production-shaped MCP server build.
//
// Bundles src/mcp/cli.ts (and the shared tool core it imports) into a single
// runnable ESM file at dist-mcp/cli.js. node_modules packages stay external, so
// the artifact resolves the official MCP SDK from the installed dependencies.
// The browser site (Astro `dist/`) is untouched and never includes this file.
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const outputDir = new URL('../dist-mcp/', import.meta.url);
await mkdir(outputDir, { recursive: true });

const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: new URL('..', import.meta.url),
  encoding: 'utf8',
}).trim();

await build({
  entryPoints: ['src/mcp/cli.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  // Keep the executable independent from node_modules and src/: production
  // installs copy this directory alone outside the Astro static-site tree.
  outfile: 'dist-mcp/cli.js',
  define: {
    __MCP_SERVER_VERSION__: JSON.stringify(pkg.version),
  },
  logLevel: 'info',
});

await writeFile(
  new URL('manifest.json', outputDir),
  `${JSON.stringify(
    {
      server: 'zglab-tools-mcp',
      version: pkg.version,
      source_commit: sourceCommit,
      tool_count: 10,
    },
    null,
    2,
  )}\n`,
  'utf8',
);
