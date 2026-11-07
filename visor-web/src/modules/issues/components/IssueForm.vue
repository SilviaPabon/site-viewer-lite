<script setup lang="ts">
import { ref, watch } from "vue";
import type { Space } from "../../core/api-types";
import { apiFetch } from "../../core/lib/http";

const props = defineProps<{
  projectId: string;
  token: string;
  levels: string[];
  space: Space | null;
}>();

const title = ref("");
const level = ref(props.levels[0] ?? "");
const sending = ref(false);
const result = ref<{ ok: boolean; text: string } | null>(null);

// Picking a room in 3D fills in its level; the issue is attached to that room.
watch(
  () => props.space,
  (s) => {
    if (s) level.value = s.level;
  },
  { immediate: true },
);

async function submit() {
  sending.value = true;
  result.value = null;
  try {
    const { id } = await apiFetch<{ id: string }>(
      `/api/projects/${props.projectId}/issues`,
      props.token,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.value,
          level: level.value,
          // Only send the room when it belongs to the chosen level; the API rejects a mismatch.
          ...(props.space?.level === level.value && {
            spaceId: props.space.id,
          }),
        }),
      },
    );
    result.value = { ok: true, text: `Issue created (${id}).` };
    title.value = "";
  } catch (err) {
    // The API already writes readable messages (validation-message.ts); shown as they come.
    result.value = { ok: false, text: (err as Error).message };
  } finally {
    sending.value = false;
  }
}
</script>

<template>
  <form @submit.prevent="submit">
    <h2>Report an issue</h2>
    <label>
      Title
      <input v-model="title" maxlength="120" required />
    </label>
    <label>
      Level
      <select v-model="level">
        <option v-for="l in levels" :key="l" :value="l">{{ l }}</option>
      </select>
    </label>
    <p class="muted">
      Room:
      {{
        space && space.level === level ? space.name : "none (tap a room in 3D)"
      }}
    </p>
    <button type="submit" :disabled="sending">
      {{ sending ? "Sending…" : "Send" }}
    </button>
    <p v-if="result" :class="result.ok ? 'ok' : 'fail'" role="status">
      {{ result.text }}
    </p>
  </form>
</template>

<style scoped>
form {
  display: grid;
  gap: 8px;
}
label {
  display: grid;
  gap: 4px;
}
input,
select {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0 10px;
}
.ok {
  color: #1b7f3b;
}
.fail {
  color: var(--danger);
}
</style>
