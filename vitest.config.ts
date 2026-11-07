import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['packages/**/*.test.ts', 'apps/**/*.test.ts'], coverage:{provider:'v8',include:['packages/engine/src/**/*.ts'],exclude:['**/*.test.ts'],thresholds:{lines:95,functions:95,statements:95,branches:95}} } });
