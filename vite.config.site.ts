import {defineConfig, build, Plugin} from 'vite';
import {resolve, dirname} from 'path';
import {fileURLToPath} from 'url';
import pkg from './package.json';

const version = pkg.version;
const majorVersion = version.split('.')[0];
const baseUrl = pkg.homepage.replace(/\/$/, '');
const __dirname = dirname(fileURLToPath(import.meta.url));


function htmlVersionPlugin(): Plugin {
    return {
        name: 'html-version-replace',
        transformIndexHtml(html) {
            return html
                .replace(/__VERSION__/g, version)
                .replace(/__MAJOR_VERSION__/g, majorVersion)
                .replace(/__BASE_URL__/g, baseUrl);
        },
    };
}

export default defineConfig(({command, mode}) => {
    return {
        define: {
            __VERSION__: JSON.stringify(version),
            __BASE_URL__: JSON.stringify(baseUrl)
        },
        publicDir: resolve(__dirname, 'public'),
        build: {
            outDir: resolve(__dirname, 'dist'),
            target: 'es2015',
            emptyOutDir: false,
            rollupOptions: {
                input: {
                    main: resolve(__dirname, 'index.html'),
                    site: resolve(__dirname, 'site.ts'),
                    example: resolve(__dirname, 'example/index.html'),
                },
            },
        },
        server: {
            port: 8002,
            open: '/',
        },
        plugins: [
            htmlVersionPlugin(),
        ],
        css: {
            preprocessorOptions: {
                scss: {
                    silenceDeprecations: [
                        'import',
                        'mixed-decls',
                        'color-functions',
                        'global-builtin',
                    ],
                },
            },
        },
    };
});
