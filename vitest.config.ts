import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  root: process.cwd(),
  resolve: { alias: { '@': path.resolve(process.cwd(), 'apps/navigation/src') } },
  test: { include: ['tests/**/*.test.ts'] },
});
