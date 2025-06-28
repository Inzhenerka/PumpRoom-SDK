import { defineConfig } from 'vite';
import { resolve } from 'path';
import pkg from './package.json';

const version = pkg.version;

export default defineConfig({
  root: 'example',
  build: {
    target: 'es2015',
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(__dirname, 'src/index.ts'),
      output: [
        {
          file: `dist/pumproom-sdk-v${version}.umd.js`,
          format: 'umd',
          name: 'PumpRoomSdk',
          sourcemap: true,
        },
        {
          file: 'dist/pumproom-sdk-latest.umd.js',
          format: 'umd',
          name: 'PumpRoomSdk',
          sourcemap: true,
        },
        {
          file: `dist/pumproom-sdk-v${version}.esm.js`,
          format: 'es',
          sourcemap: true,
        },
        {
          file: 'dist/pumproom-sdk-latest.esm.js',
          format: 'es',
          sourcemap: true,
        },
      ],
    },
  },
  server: {
    port: 8002,
  },
});

