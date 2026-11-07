<script setup lang="ts">
import ErrorBox from "../../core/components/ErrorBox.vue";
import type { CloudStatus } from "../hooks/useCloud";

defineProps<{
  status: CloudStatus;
  progress: number | null;
  error: string | null;
}>();
defineEmits<{ cancel: []; load: [] }>();
</script>

<template>
  <div v-if="status === 'loading'" class="loader">
    <!-- No value = indeterminate bar when the server does not send Content-Length. -->
    <progress
      :value="progress ?? undefined"
      max="1"
      aria-label="Point cloud download"
    />
    <span>{{
      progress === null ? "Loading…" : `${Math.round(progress * 100)} %`
    }}</span>
    <button type="button" @click="$emit('cancel')">Cancel</button>
  </div>
  <ErrorBox
    v-else-if="status === 'error'"
    :message="error ?? ''"
    @retry="$emit('load')"
  />
  <div v-else-if="status === 'idle' || status === 'cancelled'" class="loader">
    <span v-if="status === 'cancelled'" class="muted">Load cancelled.</span>
    <button type="button" @click="$emit('load')">Load point cloud</button>
  </div>
  <p v-else-if="status === 'none'" class="loader muted">{{ error }}</p>
</template>

<style scoped>
.loader {
  display: flex;
  align-items: center;
  gap: var(--gap);
  margin: 0;
  padding: 8px 12px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
progress {
  flex: 1;
  min-width: 0;
}
</style>
