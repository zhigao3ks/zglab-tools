export type JsonOutputMode = 'format' | 'minify' | 'validate';

export type JsonValue =
  null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export interface JsonOptions {
  mode: JsonOutputMode;
  indent: 2 | 4;
  sortKeys: boolean;
}

export interface JsonMetadata {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  topLevelSize: number | null;
  inputCharacters: number;
  outputCharacters: number;
}

export interface JsonParseIssue {
  message: string;
  position: number | null;
  line: number | null;
  column: number | null;
  context: string;
  pointerOffset: number;
}

export type JsonProcessResult =
  | {
      ok: true;
      output: string;
      value: JsonValue;
      metadata: JsonMetadata;
    }
  | {
      ok: false;
      issue: JsonParseIssue;
    };

export type JsonWorkerResult =
  | {
      ok: true;
      output: string;
      metadata: JsonMetadata;
    }
  | {
      ok: false;
      issue: JsonParseIssue;
    };
