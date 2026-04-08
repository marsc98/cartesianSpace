/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm'
export default defineConfig({
  plugins: [react({ include: /\.(js|jsx|ts|tsx)$/ }), wasm()],
  server: {
    port: 3001
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    environmentOptions: {
      jsdom: {
        url: 'http://localhost',
      },
    },
    exclude: ['**/node_modules/**', '**/dist/**', '**/wasm/**'],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/**',
        'src/utils/**',
        'src/hooks/useSketch*',
        'src/hooks/useModal*',
        'src/hooks/useNotifications*',
        'src/hooks/useEditingModeManager*',
      ],
      exclude: [
        'src/components/organisms/**',
        'src/lib/drawing/traceRenderer*',
      ],
    },
  },
  build: {
    rolldownOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('react-dom') || id.includes('react/')) return 'react';
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/mathjs')) return 'math';
          if (
            id.includes('socket.io-client') ||
            id.includes('sockjs-client') ||
            id.includes('@stomp/stompjs')
          ) return 'realtime';
        }
      }
    }
  }
})
