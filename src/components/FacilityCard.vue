<script setup>
import { computed } from 'vue';
import SurfaceBadge from './SurfaceBadge.vue';

const props = defineProps({
  facility: { type: Object, required: true },
  selected: { type: Boolean, default: false },
});
const emit = defineEmits(['select', 'locate']);

const f = props.facility;
const mapsDir = computed(
  () => `https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lng}`,
);
const distance = computed(() =>
  f.distanceKm == null ? '' : f.distanceKm < 1 ? `${Math.round(f.distanceKm * 1000)} m` : `${f.distanceKm.toFixed(1)} km`,
);
</script>

<template>
  <article
    class="card"
    :class="{ selected }"
    tabindex="0"
    @click="emit('select', f.id)"
    @keydown.enter="emit('select', f.id)"
  >
    <div class="top">
      <h3>{{ f.name }}</h3>
      <span v-if="distance" class="dist">{{ distance }}</span>
    </div>

    <div class="badges">
      <SurfaceBadge :surface="f.surface" :confidence="f.surfaceConfidence" :basis="f.surfaceBasis" />
      <span class="tag">{{ f.facilityType }}</span>
      <span class="tag ghost">{{ f.region }}</span>
      <span v-if="f.free" class="tag free">Free</span>
      <span v-if="f.bookable" class="tag book">Online booking</span>
      <span v-for="s in f.pitchSizes" :key="s" class="tag size">{{ s }}</span>
    </div>

    <p class="addr">{{ f.address }}</p>
    <p v-if="f.hours" class="meta">🕑 {{ f.hours }}</p>
    <p v-if="f.managedBy" class="meta">Managed by {{ f.managedBy }}</p>

    <div class="actions" @click.stop>
      <button class="btn" @click="emit('locate', f.id)">Show on map</button>
      <a class="btn" :href="mapsDir" target="_blank" rel="noopener">Directions</a>
      <a v-if="f.bookable" class="btn primary" :href="f.bookingUrl" target="_blank" rel="noopener">Book</a>
      <a class="btn" :href="f.infoUrl" target="_blank" rel="noopener">ActiveSG page</a>
    </div>
  </article>
</template>

<style scoped>
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.card:hover,
.card:focus-visible {
  border-color: var(--brand);
  outline: none;
}
.card.selected {
  border-color: var(--brand);
  box-shadow: 0 0 0 2px var(--brand) inset;
}
.top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
}
h3 {
  margin: 0;
  font-size: 15px;
  line-height: 1.3;
}
.dist {
  font-size: 12px;
  font-weight: 700;
  color: var(--brand);
  flex: none;
}
.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--text-dim);
}
.tag.ghost {
  border: 1px solid var(--border);
  background: transparent;
}
.tag.free {
  background: #e7f4ec;
  color: #0b7d3e;
}
.tag.book {
  background: #e5eefc;
  color: #1856b3;
}
.tag.size {
  background: transparent;
  border: 1px dashed var(--border);
}
.addr {
  margin: 0;
  font-size: 13px;
  color: var(--text-dim);
}
.meta {
  margin: 0;
  font-size: 12px;
  color: var(--text-dim);
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
}
.btn {
  font-size: 12px;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  text-decoration: none;
}
.btn:hover {
  border-color: var(--brand);
}
.btn.primary {
  background: var(--brand);
  border-color: var(--brand);
  color: #fff;
}
@media (prefers-color-scheme: dark) {
  .tag.free {
    background: #17331f;
    color: var(--brand);
  }
  .tag.book {
    background: #16233b;
    color: #7db0f2;
  }
}
</style>
