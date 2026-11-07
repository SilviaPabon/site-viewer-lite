<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { Space } from "../../core/api-types";
import type { Cloud } from "../../point-cloud";
import { SpaceScene } from "../lib/space-scene";

const props = defineProps<{
  spaces: Space[];
  levels: string[];
  level: string | null;
  selectedId: string | null;
  cloud: Cloud | null;
}>();
const emit = defineEmits<{ select: [space: Space | null] }>();

const host = ref<HTMLDivElement>();
// A plain variable, not a ref: three.js objects stay out of Vue reactivity.
let scene: SpaceScene | null = null;
let down: { x: number; y: number } | null = null;

// A tap selects; a drag (orbit) does not. 6px tolerates a shaky finger.
function onDown(e: PointerEvent) {
  down = { x: e.clientX, y: e.clientY };
}
function onUp(e: PointerEvent) {
  if (!scene || !down) return;
  const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
  down = null;
  if (moved < 6) emit("select", scene.pick(e.clientX, e.clientY));
}

onMounted(() => {
  scene = new SpaceScene(host.value!);
  scene.canvas.addEventListener("pointerdown", onDown);
  scene.canvas.addEventListener("pointerup", onUp);
  watch(
    () => [props.spaces, props.levels] as const,
    ([spaces, levels]) => {
      scene!.setSpaces(spaces, levels);
      scene!.showLevel(props.level);
      scene!.select(props.selectedId);
    },
    { immediate: true },
  );
  watch(
    () => props.cloud,
    (c) => scene!.setCloud(c),
    { immediate: true },
  );
  watch(
    () => props.level,
    (l) => scene!.showLevel(l),
  );
  watch(
    () => props.selectedId,
    (id) => scene!.select(id),
  );
});
onBeforeUnmount(() => {
  scene?.dispose();
  scene = null;
});
</script>

<template>
  <div ref="host" class="scene" />
</template>

<style scoped>
.scene {
  position: absolute;
  inset: 0;
  /* OrbitControls handles pinch and drag; the browser must not scroll or zoom the page here. */
  touch-action: none;
}
</style>
