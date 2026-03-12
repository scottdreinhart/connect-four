import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const noCache = env.VITE_NO_CACHE === 'true'

  if (noCache) {
    // eslint-disable-next-line no-console
    console.log('\n🚫 Anti-cache mode active (--mode nocache)\n')
  }

  return {
    base: './',
    plugins: [
      react(),
      visualizer({
        filename: 'dist/bundle-report.html',
        gzipSize: true,
        brotliSize: true,
        open: false,
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@/domain': path.resolve(__dirname, 'src/domain'),
        '@/app': path.resolve(__dirname, 'src/app'),
        '@/ui': path.resolve(__dirname, 'src/ui'),
        '@/wasm': path.resolve(__dirname, 'src/wasm'),
        '@/workers': path.resolve(__dirname, 'src/workers'),
      },
    },
    build: {
      target: 'es2020',
      cssTarget: 'es2020',
      modulePreload: { polyfill: false },
      minify: 'esbuild',
      cssMinify: true,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
          },
        },
      },
    },
    optimizeDeps: {
      force: true,
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      hmr: {
        host: 'localhost',
        port: 5173,
      },
      ...(noCache && {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }),
    },
  }
})
