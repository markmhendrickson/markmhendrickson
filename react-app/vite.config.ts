import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const GA_MEASUREMENT_ID = process.env.VITE_GA_MEASUREMENT_ID || 'G-5CWQZTEN9S'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Inject gtag in production only (head, before app) so GA detects the tag
    {
      name: 'inject-ga-production',
      transformIndexHtml(html, ctx) {
        // Only inject when building (not in dev server), so production deploy has gtag in head
        if (ctx.server || !GA_MEASUREMENT_ID) return html
        const snippet = `
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"><\/script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${GA_MEASUREMENT_ID}');
<\/script>`
        return html.replace('</head>', `${snippet}\n  </head>`)
      },
    },
  ],
  base: '/',
  root: __dirname, // Explicitly set root to react-app directory
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@cache': path.resolve(__dirname, './cache'),
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
    proxy: {
      '/api/newsletter': {
        target: 'http://localhost:3456',
        changeOrigin: true,
      },
    },
    fs: {
      // Allow serving files from shared directory
      allow: ['..'],
    },
    watch: {
      // Ignore node_modules and dist to reduce file watcher CPU (Vite + Cursor both watch otherwise)
      ignored: ['**/node_modules/**', '**/dist/**'],
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
  },
  // For GitHub Pages - handle client-side routing
  preview: {
    port: 4173,
  },
})
