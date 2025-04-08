/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }],
    '^.+\\.js$': 'babel-jest'
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  testTimeout: 30000
}; 