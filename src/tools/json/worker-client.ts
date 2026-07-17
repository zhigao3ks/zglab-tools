import JsonProcessingWorker from './worker?worker';
import type { JsonOptions, JsonWorkerResult } from './types';

export const processJsonInWorker = (
  input: string,
  options: JsonOptions,
): Promise<JsonWorkerResult> =>
  new Promise((resolve, reject) => {
    if (typeof Worker === 'undefined') {
      reject(new Error('当前浏览器不支持后台 JSON 处理。'));
      return;
    }

    const worker = new JsonProcessingWorker();
    const stop = () => worker.terminate();

    worker.addEventListener(
      'message',
      (event: MessageEvent<JsonWorkerResult>) => {
        resolve(event.data);
        stop();
      },
      { once: true },
    );
    worker.addEventListener(
      'error',
      () => {
        reject(new Error('JSON 后台处理失败，请检查输入或减少数据量后重试。'));
        stop();
      },
      { once: true },
    );
    worker.postMessage({ input, options });
  });
