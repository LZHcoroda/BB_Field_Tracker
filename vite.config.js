import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Repo name -> served at https://<user>.github.io/BB_Field_Tracker/
const base = process.env.GITHUB_ACTIONS ? '/BB_Field_Tracker/' : '/';

export default defineConfig({
  base,
  plugins: [vue()],
});
