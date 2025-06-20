module.exports = {
  projects: [
    {
      displayName: 'unit',
      preset: 'jest-expo',
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/src/**/*.test.{js,jsx,ts,tsx}',
      ],
      transformIgnorePatterns: [
        'node_modules/(?!(jest-)?@?react-native|@react-native-community|@react-navigation|expo|@expo|expo-router|@expo/vector-icons|react-native-vector-icons|@expo/.*|@react-native-async-storage/.*)',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@/firebase/config$': '<rootDir>/src/config/firebase.ts',
      },
      collectCoverageFrom: [
        'src/**/*.{js,jsx,ts,tsx}',
        '!**/*.d.ts',
        '!**/node_modules/**',
        '!**/.expo/**',
        '!**/android/**',
        '!**/ios/**',
        '!src/**/__tests__/**',
      ],
      coverageReporters: ['text', 'lcov', 'html'],
      coverageDirectory: 'coverage',
      testTimeout: 10000,
    },
    {
      displayName: 'integration',
      preset: 'jest-expo',
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      testMatch: ['<rootDir>/tests/integration/**/*.test.{js,jsx,ts,tsx}'],
      transformIgnorePatterns: [
        'node_modules/(?!(jest-)?@?react-native|@react-native-community|@react-navigation|expo|@expo|expo-router|@expo/vector-icons|react-native-vector-icons|@expo/.*|@react-native-async-storage/.*)',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@/firebase/config$': '<rootDir>/src/config/firebase.ts',
      },
      testTimeout: 30000,
    },
    {
      displayName: 'critical',
      preset: 'jest-expo',
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      testMatch: ['<rootDir>/tests/critical/**/*.test.{js,jsx,ts,tsx}'],
      transformIgnorePatterns: [
        'node_modules/(?!(jest-)?@?react-native|@react-native-community|@react-navigation|expo|@expo|expo-router|@expo/vector-icons|react-native-vector-icons|@expo/.*|@react-native-async-storage/.*)',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@/firebase/config$': '<rootDir>/src/config/firebase.ts',
      },
      testTimeout: 10000,
    },
  ],
  // Configuration globale de couverture
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Seuils spécifiques pour les modules critiques
    './src/services/auth/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './src/services/payment/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
};
