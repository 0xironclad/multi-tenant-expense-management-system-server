import { afterEach, beforeAll, describe, expect, it, jest } from "@jest/globals";
import {
  hashPassword,
  comparePassword,
  createAccessToken,
  verifyAccessToken,
  createUser,
  findUserByEmail,
  findUserById,
  createRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
} from "./auth.lib";
import { TokenPayload } from "../types/auth.types";
import { db } from "../db";

beforeAll(() => {
  process.env.JWT_SECRET = "testsecret";
});

jest.mock("../db", () => ({
  ...(jest.requireActual("../db/schema") as object),
  db: {
    insert: jest.fn(),
    select: jest.fn(),
    update: jest.fn(),
  },
}));

afterEach(() => {
  jest.clearAllMocks();
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
    const tamperedToken =
      token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");

    expect(() => verifyAccessToken(tamperedToken)).toThrow();
  });

  it("throws an error for a malformed token", () => {
    expect(() => verifyAccessToken("not.a.jwt")).toThrow();
  });
});

describe("createUser", () => {
  it("creates and returns the created user", async () => {
    const payload = {
      email: "dan@mail.test",
      passwordHash: "hashedPassword123",
    };
    const createdUser = { id: "1", ...payload };

    const returning = jest.fn(async () => [createdUser]);
    const values = jest.fn((_row: typeof payload) => ({ returning }));
    (db.insert as jest.Mock).mockReturnValue({ values });

    const user = await createUser(payload.email, payload.passwordHash);

    expect(values).toHaveBeenCalledWith(payload);
    expect(user.email).toBe(payload.email);
    expect(user.passwordHash).toBe(payload.passwordHash);
  });
});


describe("findUserByEmail", () => {
  it("returns the user if found", async () => {
    const existingUser = {
      id: "1",
      email: "dan@mail.test",
      passwordHash: "hashedPassword123",
    };

    const where = jest.fn(async () => [existingUser]);
    const from = jest.fn((_table: unknown) => ({ where }));
    (db.select as jest.Mock).mockReturnValue({ from });

    const user = await findUserByEmail("dan@mail.test");

    expect(user).toEqual(existingUser);
  });

  it("returns null if the user is not found", async () => {
    const where = jest.fn(async () => []);
    const from = jest.fn((_table: unknown) => ({ where }));
    (db.select as jest.Mock).mockReturnValue({ from });

    const user = await findUserByEmail("missing@mail.test");

    expect(user).toBeNull();
  });
});

describe("findUserById", () => {
  it("returns the user if found", async () => {
    const existingUser = {
      id: "1",
      email: "dan@mail.test",
      passwordHash: "hashedPassword123",
    };

    const where = jest.fn(async () => [existingUser]);
    const from = jest.fn((_table: unknown) => ({ where }));
    (db.select as jest.Mock).mockReturnValue({ from });

    const user = await findUserById("1");

    expect(user).toEqual(existingUser);
  });

  it("returns null if the user is not found", async () => {
    const where = jest.fn(async () => []);
    const from = jest.fn((_table: unknown) => ({ where }));
    (db.select as jest.Mock).mockReturnValue({ from });

    const user = await findUserById("missing-id");

    expect(user).toBeNull();
  });
});

describe("createRefreshToken", () => {
  it("inserts a refresh token and returns it", async () => {
    const values = jest.fn(async (_row: unknown) => undefined);
    (db.insert as jest.Mock).mockReturnValue({ values });

    const token = await createRefreshToken("user-1");

    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
    expect(values).toHaveBeenCalledTimes(1);

    const insertedRow = values.mock.calls[0][0] as {
      userId: string;
      token: string;
      expiresAt: Date;
    };
    expect(insertedRow.userId).toBe("user-1");
    expect(insertedRow.token).toBe(token);
  });

  it("sets expiresAt roughly REFRESH_TOKEN_EXPIRES_DAYS days in the future", async () => {
    const values = jest.fn(async (_row: unknown) => undefined);
    (db.insert as jest.Mock).mockReturnValue({ values });

    const before = Date.now();
    await createRefreshToken("user-1");

    const insertedRow = values.mock.calls[0][0] as { expiresAt: Date };
    const expectedMs = before + 7 * 24 * 60 * 60 * 1000;
    const actualMs = insertedRow.expiresAt.getTime();

    expect(Math.abs(actualMs - expectedMs)).toBeLessThan(5000);
  });
});

describe("findRefreshToken", () => {
  it("returns the refresh token row if found", async () => {
    const existingToken = {
      id: "rt-1",
      userId: "user-1",
      token: "abc123",
      revoked: false,
      expiresAt: new Date(),
    };

    const where = jest.fn(async () => [existingToken]);
    const from = jest.fn((_table: unknown) => ({ where }));
    (db.select as jest.Mock).mockReturnValue({ from });

    const rt = await findRefreshToken("abc123");

    expect(rt).toEqual(existingToken);
  });

  it("returns null if the token is not found", async () => {
    const where = jest.fn(async () => []);
    const from = jest.fn((_table: unknown) => ({ where }));
    (db.select as jest.Mock).mockReturnValue({ from });

    const rt = await findRefreshToken("missing-token");

    expect(rt).toBeNull();
  });
});

describe("revokeRefreshToken", () => {
  it("marks the matching refresh token as revoked", async () => {
    const where = jest.fn(async (_condition: unknown) => undefined);
    const set = jest.fn((_row: unknown) => ({ where }));
    (db.update as jest.Mock).mockReturnValue({ set });

    await revokeRefreshToken("abc123");

    expect(set).toHaveBeenCalledWith({ revoked: true });
    expect(where).toHaveBeenCalledTimes(1);
  });
});