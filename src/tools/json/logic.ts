import type {
  JsonMetadata,
  JsonOptions,
  JsonParseIssue,
  JsonProcessResult,
  JsonValue,
} from './types';

export const LARGE_JSON_WARNING_BYTES = 1024 * 1024;

const getJsonType = (value: JsonValue): JsonMetadata['type'] => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value as JsonMetadata['type'];
};

const getTopLevelSize = (value: JsonValue): number | null => {
  if (Array.isArray(value)) return value.length;
  if (value !== null && typeof value === 'object') return Object.keys(value).length;
  return null;
};

const lineColumnToPosition = (input: string, line: number, column: number): number => {
  const lines = input.split('\n');
  const before = lines
    .slice(0, Math.max(0, line - 1))
    .reduce((sum, item) => sum + item.length + 1, 0);
  return Math.min(input.length, before + Math.max(0, column - 1));
};

const getLineAndColumn = (input: string, position: number): { line: number; column: number } => {
  const before = input.slice(0, position);
  const lines = before.split('\n');
  return {
    line: lines.length,
    column: (lines.at(-1)?.length ?? 0) + 1,
  };
};

export const createJsonParseIssue = (input: string, error: unknown): JsonParseIssue => {
  const message = error instanceof Error ? error.message : 'JSON 解析失败';
  const positionMatch = message.match(/position\s+(\d+)/i);
  const lineColumnMatch = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);

  let position: number | null = positionMatch ? Number(positionMatch[1]) : null;
  let line: number | null = lineColumnMatch ? Number(lineColumnMatch[1]) : null;
  let column: number | null = lineColumnMatch ? Number(lineColumnMatch[2]) : null;

  if (position === null && line !== null && column !== null) {
    position = lineColumnToPosition(input, line, column);
  }

  if (position !== null && (line === null || column === null)) {
    const location = getLineAndColumn(input, position);
    line = location.line;
    column = location.column;
  }

  const contextStart = Math.max(0, (position ?? 0) - 32);
  const contextEnd = Math.min(input.length, (position ?? 0) + 33);
  const context = input.slice(contextStart, contextEnd).replace(/\n/g, '↵');

  return {
    message,
    position,
    line,
    column,
    context,
    pointerOffset: position === null ? 0 : position - contextStart,
  };
};

const createContainer = (value: object): JsonValue[] | Record<string, JsonValue> =>
  Array.isArray(value) ? [] : {};

export const sortJsonKeys = (value: JsonValue): JsonValue => {
  if (value === null || typeof value !== 'object') return value;

  const seen = new WeakSet<object>();
  const root = createContainer(value);
  const stack: Array<{
    source: JsonValue[] | Record<string, JsonValue>;
    target: JsonValue[] | Record<string, JsonValue>;
  }> = [{ source: value, target: root }];
  seen.add(value);

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) break;

    if (Array.isArray(current.source) && Array.isArray(current.target)) {
      for (const item of current.source) {
        if (item !== null && typeof item === 'object') {
          if (seen.has(item)) throw new TypeError('检测到循环引用，无法排序');
          seen.add(item);
          const child = createContainer(item);
          current.target.push(child);
          stack.push({ source: item, target: child });
        } else {
          current.target.push(item);
        }
      }
      continue;
    }

    if (!Array.isArray(current.source) && !Array.isArray(current.target)) {
      for (const key of Object.keys(current.source).sort((a, b) => a.localeCompare(b))) {
        const item = current.source[key];
        if (item !== null && typeof item === 'object') {
          if (seen.has(item)) throw new TypeError('检测到循环引用，无法排序');
          seen.add(item);
          const child = createContainer(item);
          current.target[key] = child;
          stack.push({ source: item, target: child });
        } else {
          current.target[key] = item;
        }
      }
    }
  }

  return root;
};

export const processJson = (input: string, options: JsonOptions): JsonProcessResult => {
  try {
    const parsed = JSON.parse(input) as JsonValue;
    const value = options.sortKeys ? sortJsonKeys(parsed) : parsed;
    const indentation = options.mode === 'minify' ? 0 : options.indent;
    const output = JSON.stringify(value, null, indentation);

    return {
      ok: true,
      output,
      value,
      metadata: {
        type: getJsonType(value),
        topLevelSize: getTopLevelSize(value),
        inputCharacters: input.length,
        outputCharacters: output.length,
      },
    };
  } catch (error) {
    return {
      ok: false,
      issue: createJsonParseIssue(input, error),
    };
  }
};

export const getJsonDownloadContent = (output: string): string =>
  output.endsWith('\n') ? output : `${output}\n`;

export const isLargeJsonInput = (input: string): boolean =>
  new TextEncoder().encode(input).byteLength > LARGE_JSON_WARNING_BYTES;
