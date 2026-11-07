<script setup lang="ts" generic="T extends string | null">
// One control for every "pick one of a few" choice: user token, level filter, m²/ft².
defineProps<{
  options: { value: T; label: string; color?: string }[];
  label: string;
}>();
const model = defineModel<T>({ required: true });
</script>

<template>
  <fieldset class="segmented" :aria-label="label">
    <button
      v-for="o in options"
      :key="String(o.value)"
      type="button"
      :aria-pressed="model === o.value"
      @click="model = o.value"
    >
      <span v-if="o.color" class="swatch" :style="{ background: o.color }" />
      {{ o.label }}
    </button>
  </fieldset>
</template>

<style scoped>
.segmented {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  border: 0;
}
.swatch {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 3px;
  margin-right: 6px;
}
</style>
