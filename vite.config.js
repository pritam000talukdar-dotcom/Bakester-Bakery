import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    // Inline small assets to reduce round trips
    assetsInlineLimit: 4096,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Produce smaller chunks for better mobile caching
    rollupOptions: {
      output: {
        // Separate vendor chunk so it can be cached independently
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
          supabase: ['@supabase/supabase-js'],
          icons: ['react-icons'],
        },
      },
    },
    // Minify with terser-compatible options via esbuild (built-in)
    minify: 'esbuild',
    target: 'es2015',
    sourcemap: false,
  },
  // Optimise dependency pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion', 'react-icons/fi', 'react-icons/hi2'],
  },
})
