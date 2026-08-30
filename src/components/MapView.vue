<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import L from 'leaflet';
import 'leaflet.markercluster';
import { allFacilities, filteredFacilities, userLocation, SURFACE_META } from '../composables/useFacilities';

const props = defineProps({ selectedId: { type: String, default: '' } });
const emit = defineEmits(['select']);

const el = ref(null);
let map, cluster, userMarker, ro;
const markers = new Map();
const allById = new Map(allFacilities.map((f) => [f.id, f]));

const SG_CENTER = [1.3521, 103.8198];

function pinIcon(surface, selected = false) {
  const s = selected ? 30 : 22;
  return L.divIcon({
    className: '',
    html: `<div class="pin pin--${surface}${selected ? ' pin--selected' : ''}"></div>`,
    iconSize: [s, s],
    iconAnchor: [s / 2, s],
    popupAnchor: [0, -s + 2],
  });
}

let selectedMarkerId = null;
function setSelected(id) {
  if (selectedMarkerId && markers.has(selectedMarkerId)) {
    const prev = allById.get(selectedMarkerId);
    if (prev) markers.get(selectedMarkerId).setIcon(pinIcon(prev.surface, false));
  }
  selectedMarkerId = id;
  const cur = allById.get(id);
  if (cur && markers.has(id)) markers.get(id).setIcon(pinIcon(cur.surface, true));
}

function popupHtml(f) {
  const dir = `https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lng}`;
  return `
    <strong>${f.name}</strong><br>
    <span style="color:#666">${SURFACE_META[f.surface].label} · ${f.facilityType} · ${f.region}</span><br>
    <span style="color:#666">${f.address}</span><br>
    <a href="${dir}" target="_blank" rel="noopener">Directions</a>
    ${f.bookable ? ` · <a href="${f.bookingUrl}" target="_blank" rel="noopener">Book</a>` : ''}
    · <a href="${f.infoUrl}" target="_blank" rel="noopener">Info</a>`;
}

function render(list) {
  if (!cluster) return;
  cluster.clearLayers();
  markers.clear();
  for (const f of list) {
    if (f.lat == null) continue;
    const m = L.marker([f.lat, f.lng], { icon: pinIcon(f.surface) });
    m.bindPopup(popupHtml(f));
    m.on('click', () => emit('select', f.id));
    markers.set(f.id, m);
    cluster.addLayer(m);
  }
  if (selectedMarkerId) setSelected(selectedMarkerId);
}

function refresh() {
  if (!map) return;
  map.invalidateSize();
  fitAll();
}

function focus(id, { open = true } = {}) {
  const m = markers.get(id);
  if (!m || !map) return;
  map.invalidateSize();
  setSelected(id);
  const ll = m.getLatLng();
  cluster.zoomToShowLayer(m, () => {
    map.setView(ll, Math.max(map.getZoom(), 16), { animate: true });
    if (open) m.openPopup();
  });
}

defineExpose({ focus, refresh });

onMounted(() => {
  map = L.map(el.value, { zoomControl: true }).setView(SG_CENTER, 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);
  cluster = L.markerClusterGroup({ maxClusterRadius: 45, showCoverageOnHover: false });
  map.addLayer(cluster);
  render(filteredFacilities.value);
  fitAll();

  // Leaflet measures the container on init; re-measure once the fl/grid
  // layout has settled, and whenever the pane resizes afterwards.
  let firstFit = false;
  ro = new ResizeObserver(() => {
    if (!map) return;
    map.invalidateSize();
    if (!firstFit && el.value.clientHeight > 0) {
      firstFit = true;
      fitAll();
    }
  });
  ro.observe(el.value);
  setTimeout(() => map && (map.invalidateSize(), fitAll()), 250);
});

function fitAll() {
  if (map && cluster.getLayers().length) map.fitBounds(cluster.getBounds().pad(0.12));
}

onBeforeUnmount(() => {
  ro?.disconnect();
  map?.remove();
});

watch(filteredFacilities, (list) => {
  render(list);
  if (!props.selectedId) fitAll();
});

watch(
  () => props.selectedId,
  (id) => id && focus(id),
);

watch(userLocation, (loc) => {
  if (!loc || !map) return;
  if (userMarker) userMarker.remove();
  userMarker = L.circleMarker([loc.lat, loc.lng], {
    radius: 7,
    color: '#1856b3',
    fillColor: '#1856b3',
    fillOpacity: 0.9,
    weight: 3,
  })
    .addTo(map)
    .bindPopup('You are here');
  map.setView([loc.lat, loc.lng], 14);
});
</script>

<template>
  <div class="mapwrap">
    <div ref="el" class="map" />
    <div class="legend">
      <span v-for="(m, k) in SURFACE_META" :key="k"><i :style="{ background: m.color }" />{{ m.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.mapwrap {
  position: relative;
  height: 100%;
  width: 100%;
}
.map {
  height: 100%;
  width: 100%;
}
.legend {
  position: absolute;
  left: 10px;
  bottom: 10px;
  z-index: 500;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 9px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 11px;
  color: var(--text);
  box-shadow: var(--shadow);
}
.legend i {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  margin-right: 5px;
}
</style>
