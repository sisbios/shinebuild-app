import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    test: {
      name: 'shared',
      root: './packages/shared',
      include: ['src/**/*.test.ts'],
    },
  },
  {
    test: {
      name: 'web',
      root: './apps/web',
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      environment: 'node',
    },
  },
  {
    test: {
      name: 'integration',
      root: './functions',
      include: ['src/**/*.integration.test.ts'],
      environment: 'node',
    },
  },
]);
