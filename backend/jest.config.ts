import type { Config } from "jest";
import dotenv from "dotenv";
// dotenv.config({ path: "./.env.test" });

const config: Config = {
  testEnvironment: "node",
  verbose: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  coveragePathIgnorePatterns: ["/node_modules/", "/dist/", "src/utils/", "src/types/"],
  collectCoverageFrom: ["src/**/*.ts"],
  preset: "ts-jest",
  testTimeout: 30000,
  testMatch: ["**/*.test.ts"],
  openHandlesTimeout: 0,
};

export default config;
