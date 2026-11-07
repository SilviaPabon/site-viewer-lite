<script setup lang="ts">
import { computed } from "vue";
import SegmentedControl from "../../core/components/SegmentedControl.vue";
import { levelColor } from "../lib/colors";

const props = defineProps<{ levels: string[] }>();
const level = defineModel<string | null>({ required: true });
const options = computed(() => [
  { value: null, label: "All" },
  ...props.levels.map((l) => ({
    value: l,
    label: l,
    color: levelColor(props.levels, l),
  })),
]);
</script>

<template>
  <SegmentedControl v-model="level" :options="options" label="Level" />
</template>
