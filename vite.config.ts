/// <reference types="vitest" />
import * as path from 'path';
import { defineConfig } from 'vite';
import webWorkerLoader from 'rollup-plugin-web-worker-loader';

export default defineConfig({
    test: {
        dir: 'tests',
        setupFiles: 'tests/setupTests.ts',
    },
    worker: {
        format: 'iife',
        plugins: [
            webWorkerLoader({
                inline: true,
                forceInline: true,
            }),
        ],
    },
    build: {
        minify: false,
        sourcemap: true,
        target: 'esnext',
        lib: {
            formats: ['cjs', 'es'],
            entry: 'src/index.ts',
            fileName: '[name]',
        },
        assetsDir: './',
        rollupOptions: {
            external: (id: string) => !id.startsWith('.') && !path.isAbsolute(id),
            treeshake: false,
            output: {
                preserveModules: true,
                sourcemapExcludeSources: true,
            },
        },
    },
});
