import { createRequire } from 'node:module';

export const SERVER_NAME = 'zglab-tools-mcp';

// Reuse the package.json version as the single source of truth for the MCP
// server version, so it cannot drift from the published artifact.
const require = createRequire(import.meta.url);
const packageJson = require('../../package.json') as { version?: string };

export const SERVER_VERSION = packageJson.version ?? '0.0.0';
