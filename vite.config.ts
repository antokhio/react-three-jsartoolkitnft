/// <reference types="vitest" />
import * as path from 'path';
import { defineConfig } from 'vite';
import OMT from '@surma/rollup-plugin-off-main-thread';

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
        target: 'esnext',
        lib: {
            formats: ['cjs', 'es'],
            entry: 'src/index.ts',
            fileName: '[name]',
        },
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
