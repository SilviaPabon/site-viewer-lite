/// <reference lib="webworker" />
// Downloads and parses the cloud off the main thread, so a 32 MB file never freezes the iPad.
import { NETWORK_ERROR, toApiError } from "../../core/lib/http";
import { parsePts1, type Cloud } from "../lib/pts1";

export type CloudRequest = { url: string; token: string };
export type CloudMessage =
  | { type: "progress"; loaded: number; total: number | null }
  | { type: "done"; cloud: Cloud }
  | { type: "error"; status: number; message: string };

const post = (msg: CloudMessage, transfer: Transferable[] = []) =>
  self.postMessage(msg, transfer);

self.onmessage = async ({ data }: MessageEvent<CloudRequest>) => {
  let res: Response;
  try {
    res = await fetch(data.url, {
      headers: { Authorization: `Bearer ${data.token}` },
    });
  } catch {
    return post({ type: "error", status: 0, message: NETWORK_ERROR });
  }
  if (!res.ok || !res.body) {
    const err = await toApiError(res);
    return post({ type: "error", status: err.status, message: err.message });
  }

  // Real progress: bytes read so far against Content-Length.
  const length = Number(res.headers.get("Content-Length"));
  const total = length > 0 ? length : null;
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  try {
    const reader = res.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.byteLength;
      post({ type: "progress", loaded, total });
    }
  } catch {
    return post({ type: "error", status: 0, message: NETWORK_ERROR });
  }

  const buffer = new Uint8Array(loaded);
  let offset = 0;
  for (const c of chunks) {
    buffer.set(c, offset);
    offset += c.byteLength;
  }
  try {
    const cloud = parsePts1(buffer.buffer);
    // Transferables: the arrays move to the main thread without being copied.
    post({ type: "done", cloud }, [
      cloud.positions.buffer,
      cloud.colors.buffer,
    ]);
  } catch (err) {
    post({ type: "error", status: 0, message: (err as Error).message });
  }
};
