<script setup>
import { computed } from 'vue';
import { SURFACE_META } from '../composables/useFacilities';

const props = defineProps({
  surface: { type: String, required: true },
  confidence: { type: String, default: '' },
  basis: { type: String, default: '' },
});

const meta = computed(() => SURFACE_META[props.surface] || SURFACE_META.unknown);
const title = computed(() =>
  [meta.value.label, props.confidence && `· inferred (${props.confidence} confidence)`, props.basis && `\n${props.basis}`]
    .filter(Boolean)
    .join(' '),
);
</script>

<template>
  <span class="sb" :style="{ '--c': meta.color }" :title="title">
    <span class="dot" />
    {{ meta.label }}
    <span v-if="confidence" class="conf" :data-lvl="confidence">inferred</span>
  </span>
</template>

<style scoped>
.sb {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
}
.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--c);
  flex: none;
}
.conf {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 1px 5px;
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--text-dim);
}
.conf[data-lvl='low'] {
  color: #b4690e;
}
</style>
