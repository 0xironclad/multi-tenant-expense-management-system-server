const services = ["auth", "expense", "file", "gateway", "notification", "user-org"];

function project(service) {
  return {
    displayName: service,
    rootDir: `services/${service}`,
    preset: "ts-jest",
    testEnvironment: "node",
    testMatch: ["<rootDir>/src/**/*.test.ts"],
  };
}

export default {
  projects: services.map(project),
};
