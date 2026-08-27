import { registerSchema, loginSchema, refreshSchema, logoutSchema } from "./auth.schemas";
import { describe, it, expect } from "@jest/globals";

describe("registerSchema", () => {
  it("accepts a valid email and password", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "password123",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid email format", () => {
    const result = registerSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "short",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a missing password field", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
    });

    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts a valid email and password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.mail",
      password: "password123",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid email format", () => {
    const result = loginSchema.safeParse({
      email: "invalid-email",
      password: "password123",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a missing password field", () => {
    const result = loginSchema.safeParse({
      email: "test@example.mail",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a missing email field", () => {
    const result = loginSchema.safeParse({
      password: "password123",
    });

    expect(result.success).toBe(false);
  });
});

describe("refreshSchema", () => {
  it("accepts a valid refresh token", () => {
    const result = refreshSchema.safeParse({
      refreshToken: "valid-refresh-token",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a missing refresh token field", () => {
    const result = refreshSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});

describe("logoutSchema", () => {
  it("accepts a valid refresh token", () => {
    const result = logoutSchema.safeParse({
      refreshToken: "valid-refresh-token",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a missing refresh token field", () => {
    const result = logoutSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});