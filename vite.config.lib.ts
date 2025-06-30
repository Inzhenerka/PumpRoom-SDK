import {defineConfig} from 'vite';
import {resolve, dirname} from 'path';
import {fileURLToPath} from 'url';
import pkg from './package.json';

const version = pkg.version;
const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({command, mode}) => {
    return {
        define: {
            __VERSION__: JSON.stringify(version)
        },
        publicDir: false,
        build: {
            outDir: resolve(__dirname, 'dist'),
            target: 'es2015',
            emptyOutDir: true,
            sourcemap: true,
            lib: {
                entry: resolve(__dirname, 'src/index.ts'),
                name: 'PumpRoomSdk',
            },
            rollupOptions: {
                output: [
                    {
                        entryFileNames: `bundle/pumproom-sdk-v${version}.umd.js`,
                        format: 'umd',
                        name: 'PumpRoomSdk',
                    },
                    {
                        entryFileNames: 'bundle/pumproom-sdk-latest.umd.js',
                        format: 'umd',
                        name: 'PumpRoomSdk',
                    },
                    {
                        entryFileNames: `bundle/pumproom-sdk-v${version}.esm.js`,
                        format: 'es',
                    },
                    {
                        entryFileNames: 'bundle/pumproom-sdk-latest.esm.js',
                        format: 'es',
                    },
                ],
            },
        },
    };
});
