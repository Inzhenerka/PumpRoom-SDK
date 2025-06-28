import {defineConfig, build} from 'vite';
import {resolve, dirname, join} from 'path';
import {promises as fs} from 'fs';
import {fileURLToPath} from 'url';
import pkg from './package.json';

const version = pkg.version;
const __dirname = dirname(fileURLToPath(import.meta.url));

function buildSite() {
    return {
        name: 'build-site',
        async closeBundle() {
            await build({
                root: resolve(__dirname, 'example'),
                publicDir: false,
                build: {
                    emptyOutDir: false,
                    outDir: resolve(__dirname, 'dist/example'),
                },
            });
            const src = resolve(__dirname, 'index.html');
            const dest = join(__dirname, 'dist/index.html');
            await fs.copyFile(src, dest);
        },
    };
}

export default defineConfig({
    publicDir: 'public',
    build: {
        outDir: 'dist',
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
                    entryFileNames: `bundles/pumproom-sdk-v${version}.umd.js`,
                    format: 'umd',
                    name: 'PumpRoomSdk',
                },
                {
                    entryFileNames: 'bundles/pumproom-sdk-latest.umd.js',
                    format: 'umd',
                    name: 'PumpRoomSdk',
                },
                {
                    entryFileNames: `bundles/pumproom-sdk-v${version}.esm.js`,
                    format: 'es',
                },
                {
                    entryFileNames: 'bundles/pumproom-sdk-latest.esm.js',
                    format: 'es',
                },
            ],
        },
    },
    server: {
        port: 8002,
        open: '/',
    },
    plugins: [buildSite()],
});
