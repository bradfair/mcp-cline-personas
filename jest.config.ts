const fs = require("fs");
const { pathsToModuleNameMapper } = require("ts-jest");
const { compilerOptions } = JSON.parse(
  fs.readFileSync("./tsconfig.json", "utf8")
);

module.exports = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  testMatch: ["**/test/**/*.test.ts"],
  reporters: ["jest-silent-reporter"],
  collectCoverage: true,
  coverageReporters: ["text", "lcov"],
  coverageDirectory: "coverage",
  moduleNameMapper: {
    "^@src/(.*)\\.js$": "<rootDir>/src/$1.ts",
    "^@src/(.*)$": "<rootDir>/src/$1.ts"
  },
  moduleFileExtensions: ["js", "ts"],
  transformIgnorePatterns: ["node_modules/(?!(@modelcontextprotocol|ts-jest)/)"],
  roots: ["<rootDir>"],
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true
      }
    ]
  }
};
