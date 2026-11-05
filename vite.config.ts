import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  server: { port: 5180 },
  build: { target: 'es2022', outDir: 'dist' },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
