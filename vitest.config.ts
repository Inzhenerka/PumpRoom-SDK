import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html', 'json-summary', 'json'],
      reportOnFailure: true,
      exclude: ['example/**'],
    },
  },
});
