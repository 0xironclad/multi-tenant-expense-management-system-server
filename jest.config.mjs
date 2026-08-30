import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const services = ["auth", "expense", "file", "gateway", "notification", "user-org"];

function project(service) {
  const serviceDir = path.join(rootDir, "services", service);

  return {
    displayName: service,
    rootDir: `services/${service}`,
    preset: "ts-jest",
    testEnvironment: "node",
    testMatch: ["<rootDir>/src/**/*.test.ts"],
    transform: {
      "^.+\\.ts$": [
        "ts-jest",
        {
          tsconfig: {
            typeRoots: [
              path.join(serviceDir, "node_modules/@types"),
              path.join(rootDir, "node_modules/@types"),
            ],
          },
        },
      ],
    },
  };
}

export default {
  projects: services.map(project),
};
