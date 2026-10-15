import { fileURLToPath, URL } from 'node:url';
import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';

// `electron-vite build --mode enterprise` bakes the enterprise edition into the main process and
// renderer (see src/edition.ts); every other mode is the consumer edition.
export default defineConfig(({ mode }) => {
  const define = { __APP_EDITION__: JSON.stringify(mode === 'enterprise' ? 'enterprise' : 'consumer') };

  return {
    main: {
      define,
      plugins: [externalizeDepsPlugin()],
      build: {
        rollupOptions: {
          input: {
            index: resolve(__dirname, 'electron/main.ts'),
          },
        },
      },
      resolve: {
        alias: {
          '@electron': fileURLToPath(new URL('./electron', import.meta.url)),
        },
      },
    },
    preload: {
      plugins: [externalizeDepsPlugin()],
      build: {
        rollupOptions: {
          input: {
            index: resolve(__dirname, 'electron/preload.ts'),
          },
        },
      },
    },
    renderer: {
      define,
      plugins: [vue()],
      root: '.',
      build: {
        rollupOptions: {
          input: {
            index: resolve(__dirname, 'index.html'),
          },
        },
      },
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
      },
    },
  };
});
