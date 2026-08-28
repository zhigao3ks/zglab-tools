import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/tools/**/*.test.ts', 'src/tool-core/**/*.test.ts', 'src/mcp/**/*.test.ts'],
    passWithNoTests: false,
  },
});
