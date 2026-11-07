import { onScopeDispose, ref, shallowRef, watch, type Ref } from "vue";
import { apiFetch } from "../lib/http";

// GET that follows its inputs: when the path or the token change, the previous request is aborted
// and only the latest answer is kept. Used by every list/detail read in the viewer.
export function useApi<T>(
  path: () => string | null,
  token: Ref<string | null>,
) {
  const data = shallowRef<T | null>(null);
  const error = ref<string | null>(null);
  const loading = ref(false);
  let current: AbortController | null = null;

  async function load() {
    current?.abort();
    data.value = null;
    error.value = null;
    const p = path();
    const t = token.value;
    if (!p || !t) {
      loading.value = false;
      return;
    }
    const ctrl = (current = new AbortController());
    loading.value = true;
    try {
      const result = await apiFetch<T>(p, t, { signal: ctrl.signal });
      if (ctrl === current) data.value = result;
    } catch (err) {
      if (ctrl === current)
        error.value = err instanceof Error ? err.message : String(err);
    } finally {
      if (ctrl === current) loading.value = false;
    }
  }

  watch([path, token], load, { immediate: true });
  onScopeDispose(() => current?.abort());
  return { data, error, loading, reload: load };
}
