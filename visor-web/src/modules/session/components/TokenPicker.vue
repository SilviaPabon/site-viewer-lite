<script setup lang="ts">
import SegmentedControl from "../../core/components/SegmentedControl.vue";

// The three demo users from the kit. The token is only kept in memory (lost on reload, by design).
const users = [
  { value: "staff-token", label: "Staff" },
  { value: "acme-token", label: "Acme" },
  { value: "brick-token", label: "Brick" },
];
const token = defineModel<string | null>({ required: true });
</script>

<template>
  <SegmentedControl v-model="token" :options="users" label="User" />
</template>
