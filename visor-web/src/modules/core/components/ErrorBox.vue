<script setup lang="ts">
// Every failure shows the same way: a clear message and "Try again" (no alert()).
defineProps<{ message: string }>();
defineEmits<{ retry: [] }>();
</script>

<template>
  <div class="error-box" role="alert">
    <p>{{ message }}</p>
    <button type="button" @click="$emit('retry')">Try again</button>
  </div>
</template>

<style scoped>
.error-box {
  border: 1px solid var(--danger);
  border-radius: var(--radius);
  padding: var(--gap);
  color: var(--danger);
  background: #fff5f5;
}
.error-box p {
  margin: 0 0 8px;
}
</style>
