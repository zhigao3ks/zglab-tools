import { decodeBase64ToText, encodeTextToBase64 } from '../tools/base64/logic';
import { processJson } from '../tools/json/logic';
import { processLines } from '../tools/line-processor/logic';
import { countText } from '../tools/text-counter/logic';
import { timestampToDate } from '../tools/timestamp/logic';
import { decodeUrlText, encodeUrlText } from '../tools/url/logic';
import type { JsonSchema, ToolDefinition } from './contracts';
import { ToolError } from './errors';
import { DEFAULT_TOOL_LIMITS } from './limits';
import { ToolRegistry } from './registry';

// ---------------------------------------------------------------------------
// Narrow input validation. Each helper rejects the exact failure class and
// never leaks raw exceptions or machine paths.
// ---------------------------------------------------------------------------

const isObject = (input: unknown): input is Record<string, unknown> =>
  typeof input === 'object' && input !== null && !Array.isArray(input);

const requireObject = (input: unknown): Record<string, unknown> => {
  if (!isObject(input)) throw new ToolError('INVALID_INPUT', 'input must be a JSON object');
  return input;
};

const rejectUnknownFields = (input: Record<string, unknown>, allowed: readonly string[]): void => {
  for (const key of Object.keys(input)) {
    if (!allowed.includes(key)) {
      throw new ToolError('INVALID_INPUT', `unknown field '${key}'`);
    }
  }
};

const requireString = (input: Record<string, unknown>, key: string): string => {
  const value = input[key];
  if (typeof value !== 'string') throw new ToolError('INVALID_INPUT', `'${key}' must be a string`);
  return value;
};

const requireNonEmptyString = (input: Record<string, unknown>, key: string): string => {
  const value = requireString(input, key);
  if (value === '') throw new ToolError('INVALID_INPUT', `'${key}' must not be empty`);
  return value;
};

const parseIndent = (value: unknown): 2 | 4 => {
  if (value === undefined) return 2;
  if (value === 2 || value === 4) return value;
  throw new ToolError('UNSUPPORTED_OPTION', 'indent must be 2 or 4');
};

const jsonIssueDetails = (issue: {
  message: string;
  line: number | null;
  column: number | null;
}): Record<string, string | number | boolean | null> => ({
  message: issue.message,
  line: issue.line,
  column: issue.column,
});

const textInputSchema = (key: string): JsonSchema => ({
  type: 'object',
  properties: { [key]: { type: 'string', maxLength: 1_000_000 } },
  required: [key],
  additionalProperties: false,
});

const stringOutputSchema: JsonSchema = { type: 'string' };

// ---------------------------------------------------------------------------
// JSON tools (share the existing processJson core; no key sorting in v1, so
// key order is preserved and the result is fully deterministic).
// ---------------------------------------------------------------------------

const jsonFormatTool: ToolDefinition = {
  id: 'json_format',
  name: 'Format JSON',
  description:
    'Pretty-print a JSON document with 2 or 4 spaces of indentation. Deterministic, pure, no network, no side effects; key order is preserved (keys are not sorted).',
  inputSchema: {
    type: 'object',
    properties: {
      text: { type: 'string', maxLength: 1_000_000 },
      indent: { type: 'integer', enum: [2, 4], default: 2 },
    },
    required: ['text'],
    additionalProperties: false,
  },
  outputSchema: stringOutputSchema,
  sideEffect: 'none',
  networkAccess: false,
  deterministic: true,
  timeoutMs: DEFAULT_TOOL_LIMITS.timeoutMs,
  maxInputBytes: DEFAULT_TOOL_LIMITS.maxInputBytes,
  maxOutputBytes: DEFAULT_TOOL_LIMITS.maxOutputBytes,
  execute(input) {
    const object = requireObject(input);
    rejectUnknownFields(object, ['text', 'indent']);
    const text = requireNonEmptyString(object, 'text');
    const indent = parseIndent(object.indent);
    const result = processJson(text, { mode: 'format', indent, sortKeys: false });
    if (!result.ok)
      throw new ToolError(
        'INVALID_INPUT',
        'input is not valid JSON',
        jsonIssueDetails(result.issue),
      );
    return result.output;
  },
};

const jsonMinifyTool: ToolDefinition = {
  id: 'json_minify',
  name: 'Minify JSON',
  description:
    'Minify a JSON document into a single line. Deterministic, pure, no network, no side effects; key order is preserved.',
  inputSchema: textInputSchema('text'),
  outputSchema: stringOutputSchema,
  sideEffect: 'none',
  networkAccess: false,
  deterministic: true,
  timeoutMs: DEFAULT_TOOL_LIMITS.timeoutMs,
  maxInputBytes: DEFAULT_TOOL_LIMITS.maxInputBytes,
  maxOutputBytes: DEFAULT_TOOL_LIMITS.maxOutputBytes,
  execute(input) {
    const object = requireObject(input);
    rejectUnknownFields(object, ['text']);
    const text = requireNonEmptyString(object, 'text');
    const result = processJson(text, { mode: 'minify', indent: 2, sortKeys: false });
    if (!result.ok)
      throw new ToolError(
        'INVALID_INPUT',
        'input is not valid JSON',
        jsonIssueDetails(result.issue),
      );
    return result.output;
  },
};

const jsonValidateTool: ToolDefinition = {
  id: 'json_validate',
  name: 'Validate JSON',
  description:
    'Validate a JSON document and report its top-level type and size, or a safe parse error with line and column. Invalid JSON is a successful output with `valid: false`, not a tool error.',
  inputSchema: textInputSchema('text'),
  outputSchema: {
    type: 'object',
    properties: {
      valid: { type: 'boolean' },
      error: {
        type: ['object', 'null'],
        properties: {
          message: { type: 'string' },
          line: { type: ['integer', 'null'] },
          column: { type: ['integer', 'null'] },
        },
      },
      metadata: {
        type: ['object', 'null'],
        properties: {
          type: { type: 'string' },
          topLevelSize: { type: ['integer', 'null'] },
          inputCharacters: { type: 'integer' },
          outputCharacters: { type: 'integer' },
        },
      },
    },
  },
  sideEffect: 'none',
  networkAccess: false,
  deterministic: true,
  timeoutMs: DEFAULT_TOOL_LIMITS.timeoutMs,
  maxInputBytes: DEFAULT_TOOL_LIMITS.maxInputBytes,
  maxOutputBytes: DEFAULT_TOOL_LIMITS.maxOutputBytes,
  execute(input) {
    const object = requireObject(input);
    rejectUnknownFields(object, ['text']);
    const text = requireNonEmptyString(object, 'text');
    const result = processJson(text, { mode: 'validate', indent: 2, sortKeys: false });
    if (!result.ok) {
      return {
        valid: false,
        error: {
          message: result.issue.message,
          line: result.issue.line,
          column: result.issue.column,
        },
        metadata: null,
      };
    }
    return { valid: true, error: null, metadata: result.metadata };
  },
};

// ---------------------------------------------------------------------------
// Base64 / URL codecs (share the existing pure logic; UTF-8 text only in v1).
// ---------------------------------------------------------------------------

const base64EncodeTool: ToolDefinition = {
  id: 'base64_encode',
  name: 'Base64 encode',
  description:
    'Encode UTF-8 text to standard Base64. Deterministic, pure, no network, no side effects. Binary/file bytes are out of scope for v1.',
  inputSchema: textInputSchema('text'),
  outputSchema: stringOutputSchema,
  sideEffect: 'none',
  networkAccess: false,
  deterministic: true,
  timeoutMs: DEFAULT_TOOL_LIMITS.timeoutMs,
  maxInputBytes: DEFAULT_TOOL_LIMITS.maxInputBytes,
  maxOutputBytes: DEFAULT_TOOL_LIMITS.maxOutputBytes,
  execute(input) {
    const object = requireObject(input);
    rejectUnknownFields(object, ['text']);
    const text = requireNonEmptyString(object, 'text');
    try {
      return encodeTextToBase64(text);
    } catch {
      throw new ToolError('INVALID_INPUT', 'text could not be Base64-encoded');
    }
  },
};

const base64DecodeTool: ToolDefinition = {
  id: 'base64_decode',
  name: 'Base64 decode',
  description:
    'Decode standard Base64 to UTF-8 text. Deterministic, pure, no network, no side effects. Non-UTF-8 (binary) payloads are out of scope for v1.',
  inputSchema: textInputSchema('text'),
  outputSchema: stringOutputSchema,
  sideEffect: 'none',
  networkAccess: false,
  deterministic: true,
  timeoutMs: DEFAULT_TOOL_LIMITS.timeoutMs,
  maxInputBytes: DEFAULT_TOOL_LIMITS.maxInputBytes,
  maxOutputBytes: DEFAULT_TOOL_LIMITS.maxOutputBytes,
  execute(input) {
    const object = requireObject(input);
    rejectUnknownFields(object, ['text']);
    const text = requireNonEmptyString(object, 'text');
    try {
      return decodeBase64ToText(text).text;
    } catch {
      throw new ToolError('INVALID_INPUT', 'input is not valid Base64-encoded UTF-8 text');
    }
  },
};

const urlEncodeTool: ToolDefinition = {
  id: 'url_encode',
  name: 'URL encode',
  description:
    'Percent-encode a value with encodeURIComponent semantics. Deterministic, pure, no network, no side effects.',
  inputSchema: textInputSchema('text'),
  outputSchema: stringOutputSchema,
  sideEffect: 'none',
  networkAccess: false,
  deterministic: true,
  timeoutMs: DEFAULT_TOOL_LIMITS.timeoutMs,
  maxInputBytes: DEFAULT_TOOL_LIMITS.maxInputBytes,
  maxOutputBytes: DEFAULT_TOOL_LIMITS.maxOutputBytes,
  execute(input) {
    const object = requireObject(input);
    rejectUnknownFields(object, ['text']);
    const text = requireNonEmptyString(object, 'text');
    try {
      return encodeUrlText(text, 'component');
    } catch {
      throw new ToolError('INVALID_INPUT', 'text could not be URL-encoded');
    }
  },
};

const urlDecodeTool: ToolDefinition = {
  id: 'url_decode',
  name: 'URL decode',
  description:
    'Decode percent-encoded text with decodeURIComponent semantics. Deterministic, pure, no network, no side effects.',
  inputSchema: textInputSchema('text'),
  outputSchema: stringOutputSchema,
  sideEffect: 'none',
  networkAccess: false,
  deterministic: true,
  timeoutMs: DEFAULT_TOOL_LIMITS.timeoutMs,
  maxInputBytes: DEFAULT_TOOL_LIMITS.maxInputBytes,
  maxOutputBytes: DEFAULT_TOOL_LIMITS.maxOutputBytes,
  execute(input) {
    const object = requireObject(input);
    rejectUnknownFields(object, ['text']);
    const text = requireNonEmptyString(object, 'text');
    try {
      return decodeUrlText(text, 'component');
    } catch {
      throw new ToolError('INVALID_INPUT', 'input is not valid percent-encoded text');
    }
  },
};

// ---------------------------------------------------------------------------
// Text tools (share the existing pure logic; options are fixed to stay
// deterministic — no locale collation, no randomness).
// ---------------------------------------------------------------------------

const textCountTool: ToolDefinition = {
  id: 'text_count',
  name: 'Count text',
  description:
    'Count Unicode-aware characters, Han/Latin characters, words, lines, paragraphs and UTF-8 bytes. Reading-time fields are estimates. Deterministic, pure, no network.',
  inputSchema: textInputSchema('text'),
  outputSchema: {
    type: 'object',
    properties: {
      characterCount: { type: 'integer' },
      nonWhitespaceCharacterCount: { type: 'integer' },
      chineseCharacterCount: { type: 'integer' },
      englishLetterCount: { type: 'integer' },
      digitCount: { type: 'integer' },
      spaceCount: { type: 'integer' },
      punctuationCount: { type: 'integer' },
      lineCount: { type: 'integer' },
      nonEmptyLineCount: { type: 'integer' },
      paragraphCount: { type: 'integer' },
      englishWordCount: { type: 'integer' },
      utf8Bytes: { type: 'integer' },
    },
  },
  sideEffect: 'none',
  networkAccess: false,
  deterministic: true,
  timeoutMs: DEFAULT_TOOL_LIMITS.timeoutMs,
  maxInputBytes: DEFAULT_TOOL_LIMITS.maxInputBytes,
  maxOutputBytes: DEFAULT_TOOL_LIMITS.maxOutputBytes,
  execute(input) {
    const object = requireObject(input);
    rejectUnknownFields(object, ['text']);
    const text = requireString(object, 'text');
    const statistics = countText(text);
    return {
      characterCount: statistics.characterCount,
      nonWhitespaceCharacterCount: statistics.nonWhitespaceCharacterCount,
      chineseCharacterCount: statistics.chineseCharacterCount,
      englishLetterCount: statistics.englishLetterCount,
      digitCount: statistics.digitCount,
      spaceCount: statistics.spaceCount,
      punctuationCount: statistics.punctuationCount,
      lineCount: statistics.lineCount,
      nonEmptyLineCount: statistics.nonEmptyLineCount,
      paragraphCount: statistics.paragraphCount,
      englishWordCount: statistics.englishWordCount,
      utf8Bytes: statistics.utf8Bytes,
    };
  },
};

const textDeduplicateTool: ToolDefinition = {
  id: 'text_deduplicate',
  name: 'Deduplicate lines',
  description:
    'Trim each line, remove empty lines and drop duplicate lines keeping first occurrence (NFKC-normalized, case-sensitive, order preserved). Deterministic, pure, no network.',
  inputSchema: textInputSchema('text'),
  outputSchema: {
    type: 'object',
    properties: {
      output: { type: 'string' },
      stats: {
        type: 'object',
        properties: {
          inputLines: { type: 'integer' },
          outputLines: { type: 'integer' },
          duplicateLinesRemoved: { type: 'integer' },
          emptyLinesRemoved: { type: 'integer' },
          inputCharacters: { type: 'integer' },
          outputCharacters: { type: 'integer' },
        },
      },
    },
  },
  sideEffect: 'none',
  networkAccess: false,
  deterministic: true,
  timeoutMs: DEFAULT_TOOL_LIMITS.timeoutMs,
  maxInputBytes: DEFAULT_TOOL_LIMITS.maxInputBytes,
  maxOutputBytes: DEFAULT_TOOL_LIMITS.maxOutputBytes,
  execute(input) {
    const object = requireObject(input);
    rejectUnknownFields(object, ['text']);
    const text = requireString(object, 'text');
    const result = processLines(text, {
      trimLines: true,
      emptyLineMode: 'remove',
      dedupeMode: 'first',
      caseSensitive: true,
      normalizeForDedupe: true,
      order: 'keep',
    });
    return { output: result.output, stats: result.stats };
  },
};

// ---------------------------------------------------------------------------
// Timestamp tool (UTC only in v1; local/relative fields are machine-dependent
// and therefore excluded from the deterministic output).
// ---------------------------------------------------------------------------

const timestampConvertTool: ToolDefinition = {
  id: 'timestamp_convert',
  name: 'Convert timestamp',
  description:
    'Convert a Unix timestamp (seconds or milliseconds, auto-detected) to UTC ISO-8601. Deterministic: timezone is fixed to UTC and machine-local/relative fields are excluded.',
  inputSchema: textInputSchema('timestamp'),
  outputSchema: {
    type: 'object',
    properties: {
      milliseconds: { type: 'integer' },
      seconds: { type: 'integer' },
      detectedUnit: { type: 'string', enum: ['seconds', 'milliseconds'] },
      iso: { type: 'string' },
      utc: { type: 'string' },
    },
  },
  sideEffect: 'none',
  networkAccess: false,
  deterministic: true,
  timeoutMs: DEFAULT_TOOL_LIMITS.timeoutMs,
  maxInputBytes: DEFAULT_TOOL_LIMITS.maxInputBytes,
  maxOutputBytes: DEFAULT_TOOL_LIMITS.maxOutputBytes,
  execute(input) {
    const object = requireObject(input);
    rejectUnknownFields(object, ['timestamp']);
    const timestamp = requireNonEmptyString(object, 'timestamp');
    const result = timestampToDate(timestamp, 'auto', 'UTC');
    if (!result.ok) {
      throw new ToolError('INVALID_INPUT', 'timestamp is not a finite number or out of range');
    }
    return {
      milliseconds: result.value.milliseconds,
      seconds: result.value.seconds,
      detectedUnit: result.value.detectedUnit,
      iso: result.value.iso,
      utc: result.value.utc,
    };
  },
};

// ---------------------------------------------------------------------------
// The explicit Phase 13A allowlist. No filesystem scan, no dynamic import.
// ---------------------------------------------------------------------------

export const TOOL_DEFINITIONS: readonly ToolDefinition[] = [
  jsonFormatTool,
  jsonMinifyTool,
  jsonValidateTool,
  base64EncodeTool,
  base64DecodeTool,
  urlEncodeTool,
  urlDecodeTool,
  textCountTool,
  textDeduplicateTool,
  timestampConvertTool,
];

export const createToolRegistry = (): ToolRegistry => {
  const registry = new ToolRegistry();
  for (const tool of TOOL_DEFINITIONS) registry.register(tool);
  return registry;
};
