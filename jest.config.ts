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
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: "<rootDir>/",
  }),
  moduleFileExtensions: ["js", "ts"],
  transformIgnorePatterns: ["node_modules/(?!(@modelcontextprotocol)/)"],
  roots: ["<rootDir>"],
};
