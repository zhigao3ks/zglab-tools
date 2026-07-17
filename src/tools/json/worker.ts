import { processJson } from './logic';
import type { JsonOptions, JsonWorkerResult } from './types';

interface JsonWorkerRequest {
  input: string;
  options: JsonOptions;
}

self.addEventListener('message', (event: MessageEvent<JsonWorkerRequest>) => {
  const result = processJson(event.data.input, event.data.options);
  const response: JsonWorkerResult = result.ok
    ? {
        ok: true,
        output: result.output,
        metadata: result.metadata,
      }
    : result;
  self.postMessage(response);
});
