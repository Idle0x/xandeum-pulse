const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  
  moduleNameMapper: {
    // Handle module aliases
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/pages/(.*)$': '<rootDir>/pages/$1',
  },
  
  // We ignore these folders to keep tests fast
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],

  // --- THE FIX FOR MAPS ---
  // This tells Jest: "Ignore everything in node_modules EXCEPT d3 and other ESM libraries"
  // This is what fixes the "SyntaxError: Unexpected token 'export'"
  transformIgnorePatterns: [
    "node_modules/(?!(d3-scale|d3-array|d3-interpolate|d3-color|d3-format|d3-time|d3-time-format|internmap|delaunator|robust-predicates|react-simple-maps)/)"
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
