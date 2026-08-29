import { beforeAll, describe, expect, it } from "@jest/globals";
import {
  hashPassword,
  comparePassword,
  createAccessToken,
  verifyAccessToken,
} from "./auth.lib";
import { TokenPayload } from "../types/auth.types";

beforeAll(() => {
  process.env.JWT_SECRET = "testsecret";
});

describe("hashPassword", () => {
  it("should hash a password and return a string", async () => {
    const password = "mySecurePassword";
    const hashedPassword = await hashPassword(password);

    expect(typeof hashedPassword).toBe("string");
    expect(hashedPassword).not.toBe(password);
  });
});

describe("comparePassword", () => {
  it("should return true for the correct password against its hash", async () => {
    const password = "myPassword";
    const hashedPassword = await hashPassword(password);

    expect(await comparePassword(password, hashedPassword)).toBe(true);
    expect(await comparePassword("wrongPassword", hashedPassword)).toBe(false);
  });
});

describe("createAccessToken and verifyAccessToken", () => {
  it("should create a valid JWT and verify it", () => {
    const payload: TokenPayload = {
      sub: "userId123",
      email: "user@example.com",
    };
    const token = createAccessToken(payload);

    expect(typeof token).toBe("string");

    const decodedPayload = verifyAccessToken(token);
    expect(decodedPayload.sub).toBe(payload.sub);
    expect(decodedPayload.email).toBe(payload.email);
  });
});

describe("verifyAccessToken", () => {
  it("throws an error if the token is tampered with", () => {
    const payload: TokenPayload = {
      sub: "userId123",
      email: "user@example.com",
    };
    const token = createAccessToken(payload);
    const tamperedToken = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");

    expect(() => verifyAccessToken(tamperedToken)).toThrow();
  });

  it("throws an error for a malformed token", () => {
    expect(() => verifyAccessToken("not.a.jwt")).toThrow();
  });
});
