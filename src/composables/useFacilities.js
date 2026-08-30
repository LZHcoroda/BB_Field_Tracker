import { computed, reactive, ref, watch } from 'vue';
import data from '../data/facilities.json';

const STORAGE_KEY = 'bb-field-tracker:filters:v1';

export const SURFACE_META = {
  artificial: { label: 'Artificial turf', color: 'var(--artificial)' },
  grass: { label: 'Natural grass', color: 'var(--grass)' },
  unknown: { label: 'Unconfirmed', color: 'var(--unknown)' },
};

export const scrapedAt = data.scrapedAt;
export const sourceUrl = data.source;
export const dataNote = data.note;

const facilities = data.facilities.map((f) => ({
  ...f,
  id: f.slug,
  searchBlob: `${f.name} ${f.address} ${f.region} ${f.facilityType} ${(f.pitchSizes || []).join(' ')}`.toLowerCase(),
}));

export const allFacilities = facilities;

export const REGIONS = [...new Set(facilities.map((f) => f.region).filter(Boolean))].sort();
export const TYPES = [...new Set(facilities.map((f) => f.facilityType))].sort();
export const PITCH_SIZES = [...new Set(facilities.flatMap((f) => f.pitchSizes || []))].sort(
  (a, b) => parseInt(a) - parseInt(b),
);

const defaultFilters = () => ({
  q: '',
  regions: [],
  surfaces: [],
  types: [],
  sizes: [],
  bookableOnly: false,
  freeOnly: false,
  sort: 'name',
});

function loadFilters() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved) return { ...defaultFilters(), ...saved };
  } catch {
    /* ignore */
  }
  return defaultFilters();
}

export const filters = reactive(loadFilters());
export const userLocation = ref(null); // { lat, lng }
export const locationStatus = ref('idle'); // idle | loading | ok | denied | unavailable

watch(
  filters,
  (v) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
    } catch {
      /* ignore */
    }
  },
  { deep: true },
);

export function resetFilters() {
  Object.assign(filters, defaultFilters());
}

const R = 6371; // km
export function haversine(a, b) {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function locateMe() {
  if (!navigator.geolocation) {
    locationStatus.value = 'unavailable';
    return;
  }
  locationStatus.value = 'loading';
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLocation.value = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      locationStatus.value = 'ok';
      if (filters.sort === 'name') filters.sort = 'distance';
    },
    () => {
      locationStatus.value = 'denied';
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
  );
}

export const filteredFacilities = computed(() => {
  const f = filters;
  const q = f.q.trim().toLowerCase();
  let list = facilities.filter((x) => {
    if (q && !x.searchBlob.includes(q)) return false;
    if (f.regions.length && !f.regions.includes(x.region)) return false;
    if (f.surfaces.length && !f.surfaces.includes(x.surface)) return false;
    if (f.types.length && !f.types.includes(x.facilityType)) return false;
    if (f.sizes.length && !(x.pitchSizes || []).some((s) => f.sizes.includes(s))) return false;
    if (f.bookableOnly && !x.bookable) return false;
    if (f.freeOnly && !x.free) return false;
    return true;
  });

  if (userLocation.value) {
    list = list.map((x) => ({
      ...x,
      distanceKm: x.lat != null ? haversine(userLocation.value, x) : null,
    }));
  }

  const by = {
    name: (a, b) => a.name.localeCompare(b.name),
    region: (a, b) => a.region.localeCompare(b.region) || a.name.localeCompare(b.name),
    surface: (a, b) => a.surface.localeCompare(b.surface) || a.name.localeCompare(b.name),
    distance: (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity),
  };
  return [...list].sort(by[f.sort] || by.name);
});

export const activeFilterCount = computed(() => {
  const f = filters;
  return (
    (f.q ? 1 : 0) +
    f.regions.length +
    f.surfaces.length +
    f.types.length +
    f.sizes.length +
    (f.bookableOnly ? 1 : 0) +
    (f.freeOnly ? 1 : 0)
  );
});
