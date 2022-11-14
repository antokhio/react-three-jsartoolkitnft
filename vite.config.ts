/// <reference types="vitest" />
import * as path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    test: {
        dir: 'tests',
        setupFiles: 'tests/setupTests.ts',
    },
    worker: {
        format: 'iife',
    },
    build: {
        minify: false,
        sourcemap: true,
        target: 'es2020',
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
