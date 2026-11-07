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
  // Each chunk is written straight into one buffer sized from Content-Length: the 32 MB file is held
  // once, not as chunks plus a joined copy (Safari on iPad closes tabs that use too much memory).
  let buffer = new Uint8Array(total ?? 1 << 20);
  let loaded = 0;
  let lastPercent = -1;
  try {
    const reader = res.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (loaded + value.byteLength > buffer.length) {
        // Only without Content-Length (or if the server sends more than announced).
        const bigger = new Uint8Array(
          Math.max(buffer.length * 2, loaded + value.byteLength),
        );
        bigger.set(buffer.subarray(0, loaded));
        buffer = bigger;
      }
      buffer.set(value, loaded);
      loaded += value.byteLength;
      // At most ~100 progress messages: one per chunk would re-render the bar thousands of times.
      const percent = total ? Math.floor((loaded / total) * 100) : loaded >> 20;
      if (percent !== lastPercent) {
        lastPercent = percent;
        post({ type: "progress", loaded, total });
      }
    }
  } catch {
    return post({ type: "error", status: 0, message: NETWORK_ERROR });
  }

  try {
    // The parser checks the exact size, so pass only the bytes actually received.
    const body =
      loaded === buffer.length ? buffer.buffer : buffer.buffer.slice(0, loaded);
    const cloud = parsePts1(body);
    // Transferables: the arrays move to the main thread without being copied.
    post({ type: "done", cloud }, [
      cloud.positions.buffer,
      cloud.colors.buffer,
    ]);
  } catch (err) {
    post({ type: "error", status: 0, message: (err as Error).message });
  }
};
