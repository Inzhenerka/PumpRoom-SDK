import { defineConfig } from 'vite';
import { resolve } from 'path';
import pkg from './package.json';

const version = pkg.version;

export default defineConfig({
  root: 'example',
  build: {
    target: 'es2015',
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/index.ts'),
      output: [
        {
          dir: 'dist',
          entryFileNames: `pumproom-sdk-v${version}.umd.js`,
          format: 'umd',
          name: 'PumpRoomSdk',
        },
        {
          dir: 'dist',
          entryFileNames: 'pumproom-sdk-latest.umd.js',
          format: 'umd',
          name: 'PumpRoomSdk',
        },
        {
          dir: 'dist',
          entryFileNames: `pumproom-sdk-v${version}.esm.js`,
          format: 'es',
        },
        {
          dir: 'dist',
          entryFileNames: 'pumproom-sdk-latest.esm.js',
          format: 'es',
        },
      ],
    },
  },
  server: {
    port: 8002,
  },
});

