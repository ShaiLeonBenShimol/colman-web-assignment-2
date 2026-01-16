module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.spec.ts', '**/?(*.)+(spec|test).ts'],
  testPathIgnorePatterns: ['.*/testUtils\\.ts$'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/tests/testUtils.ts',
  ],
  moduleFileExtensions: ['ts', 'js', 'json'],
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};