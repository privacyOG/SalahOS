import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: [
        'src/domain/**/*.ts',
        'src/platform/**/*Storage.ts',
        'src/platform/mosqueLibrary.ts',
        'src/ui/applicationRoute.ts',
      ],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      thresholds: {
        lines: 50,
        statements: 50,
        functions: 45,
        branches: 40,
      },
    },
  },
});
