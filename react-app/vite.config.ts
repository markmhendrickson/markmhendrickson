import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  root: __dirname, // Explicitly set root to react-app directory
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared/src'),
      // Resolve shared package deps from app node_modules (shared has no node_modules)
      'lucide-react': path.resolve(__dirname, 'node_modules/lucide-react'),
      '@radix-ui/react-slot': path.resolve(__dirname, 'node_modules/@radix-ui/react-slot'),
      'clsx': path.resolve(__dirname, 'node_modules/clsx'),
      'tailwind-merge': path.resolve(__dirname, 'node_modules/tailwind-merge'),
      'class-variance-authority': path.resolve(__dirname, 'node_modules/class-variance-authority'),
    },
    dedupe: ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
  },
  ssr: {
    // Externalize react/react-dom so prerender and Node use one instance (avoids "useContext" null).
    // react-helmet-async is CJS; bundle it so Node ESM loader doesn't fail on named import.
    noExternal: ['react-dom/server', 'react-router-dom', 'react-helmet-async'],
    target: 'node',
  },
  server: {
    fs: {
      // Allow serving files from shared directory
      allow: ['..'],
    },
  },
  optimizeDeps: {
    // Include shared components in dependency optimization
    include: [
      '@radix-ui/react-slot',
      'lucide-react',
      'clsx',
      'tailwind-merge',
    ],
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      // Exclude private posts from production bundle (drafts); app falls back to posts.json
      external: (id) =>
        process.env.NODE_ENV === 'production' && id.includes('posts.private.json'),
    },
  },
  // For GitHub Pages - handle client-side routing
  preview: {
    port: 4173,
  },
})
