// stdout purity + clean shutdown: stdout must carry only MCP protocol bytes
// (no startup banner, no console.log, no stack trace), and the process must
// exit cleanly when stdin closes.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const CLI_PATH = fileURLToPath(new URL('./cli.ts', import.meta.url));
const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));

const startServer = () =>
  spawn(process.execPath, ['--import', 'tsx', CLI_PATH], {
    cwd: REPO_ROOT,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

const waitForExit = (child: ReturnType<typeof spawn>, timeoutMs: number): Promise<number | null> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('server did not exit in time')), timeoutMs);
    child.once('close', (code) => {
      clearTimeout(timer);
      resolve(code);
    });
  });

describe('stdio transport hygiene', () => {
  it('writes nothing to stdout on startup and exits cleanly on stdin close', async () => {
    const child = startServer();
    const chunks: Buffer[] = [];
    child.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));

    // Give the process a moment to (incorrectly) print a banner, if it ever did.
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(Buffer.concat(chunks).toString('utf8')).toBe('');

    child.stdin.end();
    const code = await waitForExit(child, 10_000);
    expect(code).toBe(0);
    // Even after shutdown, stdout must contain only MCP frames — here none.
    expect(Buffer.concat(chunks).toString('utf8')).toBe('');
  });
});
