import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const packageJson = require('./package.json') as { version: string }

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (
            id.includes('@tiptap') ||
            id.includes('reactjs-tiptap-editor') ||
            id.includes('prosemirror') ||
            id.includes('lowlight')
          ) {
            return 'editor'
          }
          if (id.includes('@mdxeditor') || id.includes('lexical')) {
            return 'mdx-editor'
          }
        },
      },
    },
  },
})
