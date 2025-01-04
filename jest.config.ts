import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.ts'],
  reporters: ['jest-silent-reporter'],
  collectCoverage: true,
  coverageReporters: ['text', 'lcov'],
  coverageDirectory: 'coverage'
};

export default config;
