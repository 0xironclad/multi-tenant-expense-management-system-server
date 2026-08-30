import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Request, Response } from "express";
import { register, login, refresh, logout, verify } from "./auth.controller";
import {
  hashPassword,
  comparePassword,
  createUser,
  findUserByEmail,
  findUserById,
  createAccessToken,
  createRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  verifyAccessToken,
} from "../lib/auth.lib";

jest.mock("../lib/auth.lib", () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
  createUser: jest.fn(),
  findUserByEmail: jest.fn(),
  findUserById: jest.fn(),
  createAccessToken: jest.fn(),
  createRefreshToken: jest.fn(),
  findRefreshToken: jest.fn(),
  revokeRefreshToken: jest.fn(),
  verifyAccessToken: jest.fn(),
}));

function createMockReq(overrides: {
  body?: unknown;
  headers?: Record<string, string>;
} = {}) {
  return {
    body: overrides.body ?? {},
    headers: overrides.headers ?? {},
  } as unknown as Request;
}

function createMockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

function fakeUser(overrides: Partial<Awaited<ReturnType<typeof findUserByEmail>>> = {}) {
  return {
    id: "1",
    email: "dan@mail.test",
    passwordHash: "hashedPassword123",
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function fakeRefreshToken(overrides: Partial<Awaited<ReturnType<typeof findRefreshToken>>> = {}) {
  return {
    id: "rt-1",
    userId: "1",
    token: "abc123",
    expiresAt: new Date(Date.now() + 100_000),
    revoked: false,
    createdAt: new Date(),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("register", () => {
  it("returns 400 when the body fails validation", async () => {
    const req = createMockReq({ body: { email: "not-an-email", password: "short" } });
    const res = createMockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(createUser).not.toHaveBeenCalled();
  });

  it("returns 201 with the created user on success", async () => {
    const req = createMockReq({
      body: { email: "dan@mail.test", password: "password123" },
    });
    const res = createMockRes();

    jest.mocked(hashPassword).mockResolvedValue("hashedPassword123");
    jest.mocked(createUser).mockResolvedValue(fakeUser());

    await register(req, res);

    expect(hashPassword).toHaveBeenCalledWith("password123");
    expect(createUser).toHaveBeenCalledWith("dan@mail.test", "hashedPassword123");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ userId: "1", email: "dan@mail.test" });
  });

  it("returns 409 when the email is already in use", async () => {
    const req = createMockReq({
      body: { email: "dan@mail.test", password: "password123" },
    });
    const res = createMockRes();

    jest.mocked(hashPassword).mockResolvedValue("hashedPassword123");
    jest.mocked(createUser).mockRejectedValue({ code: "23505" });

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: "Email already in use" });
  });

  it("returns 500 on an unexpected error", async () => {
    const req = createMockReq({
      body: { email: "dan@mail.test", password: "password123" },
    });
    const res = createMockRes();
    jest.spyOn(console, "error").mockImplementation(() => {});

    jest.mocked(hashPassword).mockResolvedValue("hashedPassword123");
    jest.mocked(createUser).mockRejectedValue(new Error("db unreachable"));

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});

describe("login", () => {
  it("returns 400 on invalid body", async () => {
    const req = createMockReq({ body: { email: "not-an-email" } });
    const res = createMockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(findUserByEmail).not.toHaveBeenCalled();
  });

  it('returns 401 "Invalid email" when the user is not found', async () => {
    const req = createMockReq({
      body: { email: "dan@mail.test", password: "password123" },
    });
    const res = createMockRes();

    jest.mocked(findUserByEmail).mockResolvedValue(null as any);

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid email" });
  });

  it('returns 401 "Invalid password" when the password does not match', async () => {
    const req = createMockReq({
      body: { email: "dan@mail.test", password: "wrongpassword" },
    });
    const res = createMockRes();

    jest.mocked(findUserByEmail).mockResolvedValue(fakeUser());
    jest.mocked(comparePassword).mockResolvedValue(false);

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid password" });
  });

  it("returns 200 with new tokens on success", async () => {
    const req = createMockReq({
      body: { email: "dan@mail.test", password: "password123" },
    });
    const res = createMockRes();

    jest.mocked(findUserByEmail).mockResolvedValue(fakeUser());
    jest.mocked(comparePassword).mockResolvedValue(true);
    jest.mocked(createAccessToken).mockReturnValue("access-token");
    jest.mocked(createRefreshToken).mockResolvedValue("refresh-token");

    await login(req, res);

    expect(createAccessToken).toHaveBeenCalledWith({ sub: "1", email: "dan@mail.test" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });
  });
});

describe("refresh", () => {
  it("returns 400 on invalid body", async () => {
    const req = createMockReq({ body: {} });
    const res = createMockRes();

    await refresh(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(findRefreshToken).not.toHaveBeenCalled();
  });

  it("returns 401 when the refresh token is not found", async () => {
    const req = createMockReq({ body: { refreshToken: "abc123" } });
    const res = createMockRes();

    jest.mocked(findRefreshToken).mockResolvedValue(null as any);

    await refresh(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid or expired refresh token" });
  });

  it("returns 401 when the refresh token is revoked", async () => {
    const req = createMockReq({ body: { refreshToken: "abc123" } });
    const res = createMockRes();

    jest.mocked(findRefreshToken).mockResolvedValue(
      fakeRefreshToken({ revoked: true })
    );

    await refresh(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 401 when the refresh token is expired", async () => {
    const req = createMockReq({ body: { refreshToken: "abc123" } });
    const res = createMockRes();

    jest.mocked(findRefreshToken).mockResolvedValue(
      fakeRefreshToken({ expiresAt: new Date(Date.now() - 1_000) })
    );

    await refresh(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 401 when the token's user no longer exists", async () => {
    const req = createMockReq({ body: { refreshToken: "abc123" } });
    const res = createMockRes();

    jest.mocked(findRefreshToken).mockResolvedValue(fakeRefreshToken());
    jest.mocked(findUserById).mockResolvedValue(null as any);

    await refresh(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  it("returns 200 with new tokens and revokes the old token", async () => {
    const req = createMockReq({ body: { refreshToken: "abc123" } });
    const res = createMockRes();

    jest.mocked(findRefreshToken).mockResolvedValue(fakeRefreshToken());
    jest.mocked(findUserById).mockResolvedValue(fakeUser());
    jest.mocked(createAccessToken).mockReturnValue("new-access-token");
    jest.mocked(createRefreshToken).mockResolvedValue("new-refresh-token");

    await refresh(req, res);

    expect(revokeRefreshToken).toHaveBeenCalledWith("abc123");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
    });
  });
});

describe("logout", () => {
  it("returns 400 on invalid body", async () => {
    const req = createMockReq({ body: {} });
    const res = createMockRes();

    await logout(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(revokeRefreshToken).not.toHaveBeenCalled();
  });

  it("revokes the token and returns 200 on success", async () => {
    const req = createMockReq({ body: { refreshToken: "abc123" } });
    const res = createMockRes();

    await logout(req, res);

    expect(revokeRefreshToken).toHaveBeenCalledWith("abc123");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Logged out" });
  });
});

describe("verify", () => {
  it("returns 401 when the Authorization header is missing", async () => {
    const req = createMockReq({ headers: {} });
    const res = createMockRes();

    await verify(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ valid: false });
  });

  it('returns 401 when the Authorization header does not start with "Bearer "', async () => {
    const req = createMockReq({ headers: { authorization: "Basic abc123" } });
    const res = createMockRes();

    await verify(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ valid: false });
  });

  it("returns 401 when verifyAccessToken throws", async () => {
    const req = createMockReq({ headers: { authorization: "Bearer bad-token" } });
    const res = createMockRes();

    jest.mocked(verifyAccessToken).mockImplementation(() => {
      throw new Error("invalid token");
    });

    await verify(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ valid: false });
  });

  it("returns 200 with the decoded payload on a valid token", async () => {
    const req = createMockReq({ headers: { authorization: "Bearer good-token" } });
    const res = createMockRes();

    jest.mocked(verifyAccessToken).mockReturnValue({ sub: "1", email: "dan@mail.test" });

    await verify(req, res);

    expect(verifyAccessToken).toHaveBeenCalledWith("good-token");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ valid: true, userId: "1", email: "dan@mail.test" });
  });
});
