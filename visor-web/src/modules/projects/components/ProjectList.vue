<script setup lang="ts">
import type { ProjectSummary } from "../../core/api-types";

defineProps<{ projects: ProjectSummary[] }>();
const selected = defineModel<string | null>({ required: true });
</script>

<template>
  <p v-if="projects.length === 0" class="muted">No projects.</p>
  <ul v-else class="plain-list">
    <li v-for="p in projects" :key="p.id">
      <button
        type="button"
        class="project"
        :aria-current="selected === p.id"
        @click="selected = p.id"
      >
        <strong>{{ p.name }}</strong>
        <span>{{ p.id }} · {{ p.status }}</span>
      </button>
    </li>
  </ul>
</template>

<style scoped>
.project {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 6px;
  text-align: left;
}
.project span {
  font-size: 14px;
  opacity: 0.8;
}
</style>
