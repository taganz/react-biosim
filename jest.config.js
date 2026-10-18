/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    // helpers shared by the tests, not tests themselves
    testPathIgnorePatterns: ['/node_modules/', '/__tests__/support/'],
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/$1', // Replace "path/to/your/src" with the actual path to your source files
    },
};