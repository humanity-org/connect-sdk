import type { Config } from 'jest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathsToModuleNameMapper } from 'ts-jest';

const tsconfig = JSON.parse(
  readFileSync(resolve(__dirname, 'tsconfig.json'), 'utf-8'),
) as { compilerOptions?: { paths?: Record<string, string[]> } };

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  maxWorkers: 1,
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest-setup.ts'],
  setupFiles: ['<rootDir>/tests/setup/load-env.ts'],
  reporters: ['default'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: resolve(__dirname, 'tsconfig.test.json'),
        isolatedModules: false,
        diagnostics: {
          warnOnly: false,
        },
      },
    ],
  },
  moduleNameMapper: pathsToModuleNameMapper(tsconfig.compilerOptions?.paths ?? {}, {
    prefix: '<rootDir>/',
  }),
};

export default config;

