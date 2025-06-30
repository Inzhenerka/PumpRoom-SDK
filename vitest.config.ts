import {defineConfig} from 'vitest/config';
import {readFileSync} from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

export default defineConfig({
    define: {
        __VERSION__: JSON.stringify(pkg.version)
    },
    test: {
        environment: 'jsdom',
        coverage: {
            provider: 'istanbul',
            reporter: ['text', 'html', 'json-summary', 'json'],
            reportOnFailure: true,
            exclude: ['example/**', 'vite.config.ts', 'dist'],
        },
    },
});
