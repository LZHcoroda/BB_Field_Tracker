<script setup>
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import FilterBar from './components/FilterBar.vue';
import FacilityList from './components/FacilityList.vue';
import MapView from './components/MapView.vue';
import { scrapedAt, sourceUrl, allFacilities, filteredFacilities } from './composables/useFacilities';

const isMobile = ref(window.matchMedia('(max-width: 860px)').matches);
const mobileTab = ref('list'); // list | map
const selectedId = ref('');
const mapRef = ref(null);

const mq = window.matchMedia('(max-width: 860px)');
const onMq = (e) => (isMobile.value = e.matches);
onMounted(() => mq.addEventListener('change', onMq));
onBeforeUnmount(() => mq.removeEventListener('change', onMq));

const scrapedDate = computed(() =>
  new Date(scrapedAt).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' }),
);

watch(mobileTab, (t) => {
  if (t === 'map') nextTick(() => mapRef.value?.refresh());
});

function select(id) {
  selectedId.value = id;
  nextTick(() => {
    document.querySelector(`[data-id="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}

async function locate(id) {
  selectedId.value = id;
  if (isMobile.value) {
    mobileTab.value = 'map';
    await nextTick();
  }
  mapRef.value?.focus(id);
}
</script>

<template>
  <div class="app">
    <header>
      <div class="brand">
        <span class="logo">⚽</span>
        <div>
          <h1>BB Field Tracker</h1>
          <p>ActiveSG football fields &amp; turf pitches in Singapore</p>
        </div>
      </div>
      <a class="src" :href="sourceUrl" target="_blank" rel="noopener">
        {{ allFacilities.length }} fields · data {{ scrapedDate }}
      </a>
    </header>

    <FilterBar />

    <nav v-if="isMobile" class="tabs">
      <button :class="{ on: mobileTab === 'list' }" @click="mobileTab = 'list'">List</button>
      <button :class="{ on: mobileTab === 'map' }" @click="mobileTab = 'map'">
        Map ({{ filteredFacilities.length }})
      </button>
    </nav>

    <main :class="{ mobile: isMobile }">
      <section v-show="!isMobile || mobileTab === 'list'" class="pane list-pane">
        <FacilityList :selected-id="selectedId" @select="select" @locate="locate" />
      </section>
      <section v-show="!isMobile || mobileTab === 'map'" class="pane map-pane">
        <MapView ref="mapRef" :selected-id="selectedId" @select="select" />
      </section>
    </main>

    <footer>
      Surface type is <strong>inferred</strong> from facility category and booking names — ActiveSG does not publish it.
      Always confirm with the venue. Source:
      <a :href="sourceUrl" target="_blank" rel="noopener">ActiveSG Circle</a>. Not affiliated with ActiveSG / Sport Singapore.
    </footer>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100%;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: var(--brand-dark);
  color: #fff;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.logo {
  font-size: 22px;
}
h1 {
  margin: 0;
  font-size: 16px;
}
.brand p {
  margin: 0;
  font-size: 12px;
  opacity: 0.85;
}
.src {
  color: #fff;
  font-size: 12px;
  opacity: 0.9;
  text-align: right;
  text-decoration: none;
  border: 1px solid rgba(255, 255, 255, 0.4);
  padding: 4px 8px;
  border-radius: 8px;
}
.tabs {
  display: flex;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}
.tabs button {
  flex: 1;
  padding: 10px;
  border: none;
  background: none;
  color: var(--text-dim);
  font-weight: 600;
  border-bottom: 2px solid transparent;
}
.tabs button.on {
  color: var(--brand);
  border-bottom-color: var(--brand);
}
main {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(340px, 440px) 1fr;
  grid-template-rows: minmax(0, 1fr);
  overflow: hidden;
}
main.mobile {
  grid-template-columns: 1fr;
}
.pane {
  min-height: 0;
  min-width: 0;
  overflow: auto;
}
.list-pane {
  border-right: 1px solid var(--border);
}
.map-pane {
  overflow: hidden;
}
main.mobile .pane {
  grid-column: 1;
  grid-row: 1;
}
footer {
  padding: 8px 14px;
  font-size: 11px;
  color: var(--text-dim);
  background: var(--surface);
  border-top: 1px solid var(--border);
}
footer a {
  color: var(--brand);
}
@media (max-width: 860px) {
  .brand p {
    display: none;
  }
}
</style>
