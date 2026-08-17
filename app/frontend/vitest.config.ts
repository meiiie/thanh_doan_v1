import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The suite currently has one entry point. A single worker avoids flaky
    // Windows process starts after the PostgreSQL/Testcontainers gate.
    pool: 'threads',
    maxWorkers: 1,
    minWorkers: 1,
  },
});
