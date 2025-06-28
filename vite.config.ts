import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import pkg from './package.json';

const version = pkg.version;
const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    target: 'es2015',
    emptyOutDir: false,
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'PumpRoomSdk',
    },
    rollupOptions: {
      output: [
        {
          dir: 'dist/bundles',
          entryFileNames: `pumproom-sdk-v${version}.umd.js`,
          format: 'umd',
          name: 'PumpRoomSdk',
        },
        {
          dir: 'dist/bundles',
          entryFileNames: 'pumproom-sdk-latest.umd.js',
          format: 'umd',
          name: 'PumpRoomSdk',
        },
        {
          dir: 'dist/bundles',
          entryFileNames: `pumproom-sdk-v${version}.esm.js`,
          format: 'es',
        },
        {
          dir: 'dist/bundles',
          entryFileNames: 'pumproom-sdk-latest.esm.js',
          format: 'es',
        },
      ],
    },
  },
  server: {
    port: 8002,
    open: '/example/',
  },
});
