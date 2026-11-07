import { onScopeDispose, ref, shallowRef, watch, type Ref } from "vue";
import type { Cloud } from "../lib/pts1";
import type { CloudMessage, CloudRequest } from "../workers/cloud.worker";

export type CloudStatus =
  "idle" | "loading" | "ready" | "none" | "cancelled" | "error";

// One worker per load. Cancel = terminate it: the download and the parsing stop at once.
// The load id guards against a message that was already queued from an old load (B5).
export function useCloud(
  projectId: Ref<string | null>,
  token: Ref<string | null>,
) {
  const status = ref<CloudStatus>("idle");
  const progress = ref<number | null>(null); // 0..1, null when the size is unknown
  const error = ref<string | null>(null);
  const cloud = shallowRef<Cloud | null>(null); // shallow: never make 2M points reactive
  let worker: Worker | null = null;
  let loadId = 0;

  function stop() {
    worker?.terminate();
    worker = null;
    loadId++;
  }

  function cancel() {
    if (status.value !== "loading") return;
    stop();
    status.value = "cancelled";
  }

  function load() {
    stop();
    cloud.value = null;
    error.value = null;
    progress.value = 0;
    const id = projectId.value;
    const t = token.value;
    if (!id || !t) {
      status.value = "idle";
      return;
    }
    status.value = "loading";
    const myId = loadId;
    worker = new Worker(
      new URL("../workers/cloud.worker.ts", import.meta.url),
      { type: "module" },
    );
    worker.onmessage = ({ data }: MessageEvent<CloudMessage>) => {
      if (myId !== loadId) return;
      if (data.type === "progress") {
        progress.value = data.total ? data.loaded / data.total : null;
      } else if (data.type === "done") {
        cloud.value = data.cloud;
        status.value = "ready";
        stop();
      } else {
        // A project without a cloud is a normal state, not an error (API: 404 "has no point cloud").
        status.value = data.status === 404 ? "none" : "error";
        error.value = data.message;
        stop();
      }
    };
    worker.onerror = (e) => {
      e.preventDefault();
      if (myId !== loadId) return;
      status.value = "error";
      error.value = "The point cloud could not be read.";
      stop();
    };
    worker.postMessage({
      url: `/api/projects/${id}/cloud`,
      token: t,
    } satisfies CloudRequest);
  }

  // The brief asks for a "Load point cloud" button, so a new project does not download on its own:
  // it only stops any download in progress (rule B4) and waits for the button.
  watch([projectId, token], () => {
    stop();
    cloud.value = null;
    error.value = null;
    status.value = "idle";
  });
  onScopeDispose(stop);
  return { status, progress, error, cloud, load, cancel };
}
