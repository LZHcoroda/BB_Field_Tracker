import { createApp } from 'vue';
import App from './App.vue';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
// App styles last so cluster-bubble overrides win over the library defaults.
import './styles.css';

createApp(App).mount('#app');
