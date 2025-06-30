import {defineConfig, build, Plugin} from 'vite';
import {resolve, dirname} from 'path';
import {fileURLToPath} from 'url';
import pkg from './package.json';

const version = pkg.version;
const __dirname = dirname(fileURLToPath(import.meta.url));


function htmlVersionPlugin(): Plugin {
    return {
        name: 'html-version-replace',
        transformIndexHtml(html) {
            return html.replace(/__VERSION__/g, version);
        },
    };
}


function buildExample() {
    return {
        name: 'build-example',
        async closeBundle() {
            await build({
                root: resolve(__dirname, 'example'),
                publicDir: false,
                build: {
                    emptyOutDir: false,
                    outDir: resolve(__dirname, 'dist/example'),
                },
            });
        },
    };
}

export default defineConfig(({command, mode}) => {
    const isDev = command === 'serve';

    return {
        define: {
            __VERSION__: JSON.stringify(version)
        },
        publicDir: resolve(__dirname, 'public'),
        build: {
            outDir: resolve(__dirname, 'dist'),
            target: 'es2015',
            emptyOutDir: false,
            rollupOptions: {
                input: {
                    main: resolve(__dirname, 'index.html'),
                },
            },
        },
        server: {
            port: 8002,
            open: '/',
        },
        plugins: [
            htmlVersionPlugin(),
            ...(isDev ? [buildExample()] : []),
        ],
    };
});
