// Test-only MCP stdio fixture. It deliberately never exposes a network
// listener. The Python host lifecycle tests use its PID file to prove that a
// hard deadline/cancellation/transport failure reaps the real Node child.
import { appendFileSync } from 'node:fs';
import readline from 'node:readline';

const pidFile = process.argv[2];
if (!pidFile) process.exit(64);
appendFileSync(pidFile, `${process.pid}\n`, 'utf8');

const toolIds = [
  'json_format',
  'json_minify',
  'json_validate',
  'base64_encode',
  'base64_decode',
  'url_encode',
  'url_decode',
  'text_count',
  'text_deduplicate',
  'timestamp_convert',
];
const tools = toolIds.map((name) => ({
  name,
  title: name,
  description: 'test fixture',
  inputSchema: { type: 'object', properties: { text: { type: 'string' } } },
}));
const reply = (id, result) =>
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, result })}\n`);

readline.createInterface({ input: process.stdin, crlfDelay: Infinity }).on('line', (line) => {
  const request = JSON.parse(line);
  if (request.method === 'initialize') {
    reply(request.id, {
      protocolVersion: '2025-11-25',
      capabilities: { tools: {} },
      serverInfo: { name: 'zglab-tools-mcp', version: 'test-fixture' },
    });
  } else if (request.method === 'tools/list') {
    reply(request.id, { tools });
  } else if (request.method === 'tools/call') {
    const text = request.params?.arguments?.text;
    if (text === '__HANG__') return;
    if (text === '__EXIT__') process.exit(17);
    const isolated = ['OPENAI_API_KEY', 'ZGLAB_RAG_SEARCH_API_KEY', 'ZGLAB_RAG_TEST_SECRET'].every(
      (key) => process.env[key] === undefined,
    );
    reply(request.id, {
      content: [{ type: 'text', text: JSON.stringify(text) }],
      structuredContent: { status: 'success', result: text === '__ENV__' ? { isolated } : text },
    });
  }
});
