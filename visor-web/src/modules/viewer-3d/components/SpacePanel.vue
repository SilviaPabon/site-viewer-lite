<script setup lang="ts">
import { ref } from "vue";
import type { Space } from "../../core/api-types";
import SegmentedControl from "../../core/components/SegmentedControl.vue";
import { formatArea, type AreaUnit } from "../../core/lib/units";

defineProps<{ space: Space }>();
const unit = ref<AreaUnit>("m2");
const units: { value: AreaUnit; label: string }[] = [
  { value: "m2", label: "m²" },
  { value: "ft2", label: "ft²" },
];
</script>

<template>
  <section>
    <h2>{{ space.name }}</h2>
    <p class="muted">{{ space.level }} · {{ space.use }}</p>
    <p class="area">
      {{ formatArea(space.w * space.d, unit) }}
      <SegmentedControl v-model="unit" :options="units" label="Area unit" />
    </p>
  </section>
</template>

<style scoped>
.area {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap);
  font-size: 18px;
}
</style>
