<script setup lang="ts"></script>

<template>
  <div class="layout">
    <header class="topbar">
      <h1>Site Viewer Lite</h1>
      <!-- B2: token picker -->
    </header>
    <aside class="sidebar">
      <!-- B2: project list and project card -->
      <p class="muted">Pick a user to see their projects.</p>
    </aside>
    <main class="viewer">
      <!-- B3: 3D scene -->
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
    grid-template-rows: auto auto minmax(0, 1fr);
    grid-template-areas: "top" "side" "main";
  }
}
.topbar {
  grid-area: top;
  display: flex;
  align-items: center;
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
.muted {
  color: var(--muted);
}
</style>
