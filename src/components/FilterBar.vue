<script setup>
import { ref } from 'vue';
import {
  filters,
  REGIONS,
  TYPES,
  PITCH_SIZES,
  resetFilters,
  activeFilterCount,
  filteredFacilities,
  locateMe,
  locationStatus,
  SURFACE_META,
} from '../composables/useFacilities';

const open = ref(false);
const SURFACES = Object.keys(SURFACE_META);

function toggle(arr, val) {
  const i = arr.indexOf(val);
  if (i === -1) arr.push(val);
  else arr.splice(i, 1);
}
</script>

<template>
  <div class="bar">
    <div class="row primary">
      <input v-model="filters.q" type="search" placeholder="Search field or address…" class="search" />
      <button class="ghost" :class="{ on: open }" @click="open = !open">
        Filters<span v-if="activeFilterCount" class="count">{{ activeFilterCount }}</span>
      </button>
      <select v-model="filters.sort" class="sort" aria-label="Sort by">
        <option value="name">A–Z</option>
        <option value="region">Region</option>
        <option value="surface">Surface</option>
        <option value="distance" :disabled="locationStatus !== 'ok'">Nearest</option>
      </select>
      <button class="ghost" @click="locateMe" :disabled="locationStatus === 'loading'">
        {{ locationStatus === 'loading' ? 'Locating…' : '📍 Near me' }}
      </button>
    </div>

    <p v-if="locationStatus === 'denied'" class="hint">Location permission denied — enable it to sort by distance.</p>
    <p v-else-if="locationStatus === 'unavailable'" class="hint">Geolocation isn’t available in this browser.</p>

    <div v-show="open" class="panel">
      <fieldset>
        <legend>Region</legend>
        <label v-for="r in REGIONS" :key="r">
          <input type="checkbox" :checked="filters.regions.includes(r)" @change="toggle(filters.regions, r)" />
          {{ r }}
        </label>
      </fieldset>

      <fieldset>
        <legend>Surface <span class="inferred">inferred</span></legend>
        <label v-for="s in SURFACES" :key="s">
          <input type="checkbox" :checked="filters.surfaces.includes(s)" @change="toggle(filters.surfaces, s)" />
          {{ SURFACE_META[s].label }}
        </label>
      </fieldset>

      <fieldset>
        <legend>Facility type</legend>
        <label v-for="t in TYPES" :key="t">
          <input type="checkbox" :checked="filters.types.includes(t)" @change="toggle(filters.types, t)" />
          {{ t }}
        </label>
      </fieldset>

      <fieldset v-if="PITCH_SIZES.length">
        <legend>Pitch size</legend>
        <label v-for="s in PITCH_SIZES" :key="s">
          <input type="checkbox" :checked="filters.sizes.includes(s)" @change="toggle(filters.sizes, s)" />
          {{ s }}
        </label>
      </fieldset>

      <fieldset class="toggles">
        <legend>Access</legend>
        <label><input type="checkbox" v-model="filters.bookableOnly" /> Online booking only</label>
        <label><input type="checkbox" v-model="filters.freeOnly" /> Free to play only</label>
      </fieldset>
    </div>

    <div class="row status">
      <span>{{ filteredFacilities.length }} field{{ filteredFacilities.length === 1 ? '' : 's' }}</span>
      <button v-if="activeFilterCount" class="link" @click="resetFilters">Clear all</button>
    </div>
  </div>
</template>

<style scoped>
.bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}
.row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.search {
  flex: 1 1 180px;
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  color: var(--text);
  font: inherit;
}
.ghost,
.sort {
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
  font-size: 13px;
}
.ghost.on {
  border-color: var(--brand);
  color: var(--brand);
}
.ghost:disabled {
  opacity: 0.5;
}
.count {
  display: inline-block;
  margin-left: 5px;
  background: var(--brand);
  color: #fff;
  border-radius: 999px;
  padding: 0 6px;
  font-size: 11px;
}
.panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  padding: 10px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
}
fieldset {
  border: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
legend {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-dim);
  margin-bottom: 2px;
}
.inferred {
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0;
  font-size: 10px;
  color: #b4690e;
}
label {
  font-size: 13px;
  display: flex;
  gap: 6px;
  align-items: center;
}
.status {
  justify-content: space-between;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-dim);
}
.link {
  background: none;
  border: none;
  color: var(--brand);
  font: inherit;
  font-weight: 600;
  padding: 0;
}
.hint {
  margin: 0;
  font-size: 12px;
  color: #b4690e;
}
</style>
