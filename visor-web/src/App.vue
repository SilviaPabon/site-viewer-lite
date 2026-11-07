<script setup lang="ts">
import { ref, watch } from "vue";
import type {
  ProjectDetail,
  ProjectSummary,
  Space,
} from "./modules/core/api-types";
import ErrorBox from "./modules/core/components/ErrorBox.vue";
import { useApi } from "./modules/core/hooks/useApi";
import TokenPicker from "./modules/session/components/TokenPicker.vue";
import ProjectList from "./modules/projects/components/ProjectList.vue";
import ProjectCard from "./modules/projects/components/ProjectCard.vue";
import SpaceView from "./modules/viewer-3d/components/SpaceView.vue";
import SpacePanel from "./modules/viewer-3d/components/SpacePanel.vue";
import LevelFilter from "./modules/viewer-3d/components/LevelFilter.vue";
import { CloudLoader, useCloud } from "./modules/point-cloud";
import IssueForm from "./modules/issues/components/IssueForm.vue";

const token = ref<string | null>(null);
const projectId = ref<string | null>(null);
const level = ref<string | null>(null);
const space = ref<Space | null>(null);

// Changing user forgets the project: the next user may not be allowed to see it.
watch(token, () => (projectId.value = null));
watch(projectId, () => {
  level.value = null;
  space.value = null;
});

const projects = useApi<ProjectSummary[]>(() => "/api/projects", token);
const detail = useApi<ProjectDetail>(
  () => projectId.value && `/api/projects/${projectId.value}`,
  token,
);
const spaces = useApi<Space[]>(
  () => projectId.value && `/api/projects/${projectId.value}/spaces`,
  token,
);
// Changing project (or user) aborts the previous cloud download (useCloud watches both).
const cloud = useCloud(projectId, token);
</script>

<template>
  <div class="layout">
    <header class="topbar">
      <h1>Site Viewer Lite</h1>
      <TokenPicker v-model="token" />
    </header>

    <aside class="sidebar">
      <p v-if="!token" class="muted">Pick a user to see their projects.</p>
      <template v-else>
        <ErrorBox
          v-if="projects.error.value"
          :message="projects.error.value"
          @retry="projects.reload"
        />
        <p v-else-if="projects.loading.value" class="muted">
          Loading projects…
        </p>
        <ProjectList
          v-else-if="projects.data.value"
          v-model="projectId"
          :projects="projects.data.value"
        />

        <template v-if="projectId">
          <ErrorBox
            v-if="detail.error.value"
            :message="detail.error.value"
            @retry="detail.reload"
          />
          <ProjectCard
            v-else-if="detail.data.value"
            :project="detail.data.value"
          />
          <SpacePanel v-if="space" :space="space" />
          <!-- key: a new project starts with an empty form. -->
          <IssueForm
            v-if="detail.data.value"
            :key="projectId"
            :project-id="projectId"
            :token="token"
            :levels="detail.data.value.levels"
            :space="space"
          />
        </template>
      </template>
    </aside>

    <main class="viewer">
      <template v-if="projectId && detail.data.value">
        <ErrorBox
          v-if="spaces.error.value"
          class="overlay"
          :message="spaces.error.value"
          @retry="spaces.reload"
        />
        <template v-else-if="spaces.data.value">
          <SpaceView
            :spaces="spaces.data.value"
            :levels="detail.data.value.levels"
            :level="level"
            :selected-id="space?.id ?? null"
            :cloud="cloud.cloud.value"
            @select="space = $event"
          />
          <LevelFilter
            v-model="level"
            class="overlay"
            :levels="detail.data.value.levels"
          />
          <CloudLoader
            class="bottom"
            :status="cloud.status.value"
            :progress="cloud.progress.value"
            :error="cloud.error.value"
            @cancel="cloud.cancel"
            @load="cloud.load"
          />
        </template>
      </template>
      <p v-else class="overlay muted">Pick a project to see it in 3D.</p>
    </main>
  </div>
</template>

<style scoped>
/* Landscape (1180×820): sidebar beside the viewer. Portrait (820×1180): stacked. */
.layout {
  display: grid;
  grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr);
  grid-template-areas:
    "top top"
    "side main";
  height: 100dvh;
}
@media (max-width: 900px) {
  .layout {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 40dvh) minmax(0, 1fr);
    grid-template-areas: "top" "side" "main";
  }
}
.topbar {
  grid-area: top;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap);
  padding: 8px 16px;
  background: var(--panel);
  border-bottom: 1px solid var(--border);
}
.topbar h1 {
  font-size: 18px;
  margin: 0;
}
.sidebar {
  grid-area: side;
  overflow-y: auto;
  padding: 16px;
  background: var(--panel);
  border-right: 1px solid var(--border);
}
.viewer {
  grid-area: main;
  min-height: 0;
  position: relative;
}
.bottom {
  position: absolute;
  bottom: 12px;
  left: 12px;
  right: 12px;
  margin: 0;
}
.overlay {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  margin: 0;
}
</style>
