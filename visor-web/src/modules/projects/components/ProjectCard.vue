<script setup lang="ts">
import { computed } from "vue";
import type { ProjectDetail } from "../../core/api-types";
import { formatDate } from "../../core/lib/units";

const props = defineProps<{ project: ProjectDetail }>();
const dates = computed(() => {
  const d = props.project.dates;
  return [
    ["Signed", d.signed],
    ["Scan", d.scan],
    ["Estimated delivery", d.estimatedDelivery],
    ["Delivered", d.delivered],
  ] as const;
});
</script>

<template>
  <section>
    <h2>{{ project.name }}</h2>
    <p class="muted">{{ project.address }} · {{ project.clientName }}</p>
    <dl>
      <template v-for="[label, value] in dates" :key="label">
        <dt>{{ label }}</dt>
        <dd :class="{ muted: value === null }">{{ formatDate(value) }}</dd>
      </template>
    </dl>
    <h2>Contacts</h2>
    <ul class="plain-list">
      <!-- email/phone only arrive for staff (rule 3); the card just shows what it gets. -->
      <li v-for="c in project.contacts" :key="c.role + c.name">
        <strong>{{ c.name }}</strong> <span class="muted">({{ c.role }})</span>
        <div v-if="c.email">{{ c.email }}</div>
        <div v-if="c.phone">{{ c.phone }}</div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
dl {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 4px 12px;
  margin: 0;
}
dt {
  color: var(--muted);
}
dd {
  margin: 0;
}
li + li {
  margin-top: 8px;
}
</style>
