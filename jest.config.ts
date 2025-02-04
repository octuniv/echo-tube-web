// jest.config.ts
import { createDefaultPreset, JestConfigWithTsJest } from "ts-jest";

const jestConfig: JestConfigWithTsJest = {
  // [...]
  ...createDefaultPreset(),
  // Ignore all non-unit tests files
  testPathIgnorePatterns: ["/node_modules/", "/tests-e2e/", "/tests-examples/"],
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
};

export default jestConfig;
