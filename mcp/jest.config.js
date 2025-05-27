/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest/presets/js-with-babel',
  verbose: true,
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts', '.mts', '.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^(\.{1,2}/.*)\.js$': '$1',
  },
  transform: {
    '^.+\.[tj]sx?$': ['babel-jest', { rootMode: 'upward' }],
  },
  testMatch: [
    '**/tests/**/*.test.ts'
  ],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(\.pnpm|node-fetch|fetch-blob|data-uri-to-buffer|formdata-polyfill)/)',
  ],
};
