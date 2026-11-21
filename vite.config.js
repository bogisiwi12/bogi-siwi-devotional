import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'firebase-auth',
              test: /[\\/]node_modules[\\/]@firebase[\\/]auth[\\/]/,
            },
            {
              name: 'firebase-firestore',
              test: /[\\/]node_modules[\\/]@firebase[\\/]firestore[\\/]/,
            },
            {
              name: 'firebase',
              test: /[\\/]node_modules[\\/](@firebase|firebase)[\\/]/,
            },
          ],
        },
      },
    },
  },
})