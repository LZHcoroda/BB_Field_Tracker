<script setup>
import FacilityCard from './FacilityCard.vue';
import { filteredFacilities } from '../composables/useFacilities';

defineProps({ selectedId: { type: String, default: '' } });
defineEmits(['select', 'locate']);
</script>

<template>
  <div class="list">
    <FacilityCard
      v-for="f in filteredFacilities"
      :key="f.id"
      :facility="f"
      :selected="f.id === selectedId"
      :data-id="f.id"
      @select="$emit('select', $event)"
      @locate="$emit('locate', $event)"
    />
    <p v-if="!filteredFacilities.length" class="empty">No fields match these filters.</p>
  </div>
</template>

<style scoped>
.list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
}
.empty {
  text-align: center;
  color: var(--text-dim);
  padding: 40px 0;
}
</style>
