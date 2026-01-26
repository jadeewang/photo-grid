import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    include: ['@mediapipe/hands', '@mediapipe/camera_utils'],
    exclude: []
  },
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..']
    }
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  }
});
