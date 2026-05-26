import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { db, users, refreshTokens } from '../db';
import type { TokenPayload } from '../types/auth.types';

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const createAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '15m') as jwt.SignOptions['expiresIn'],
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
};

export const createUser = async (email: string, passwordHash: string) => {
  const [user] = await db.insert(users).values({ email, passwordHash }).returning();
  return user;
};

export const findUserByEmail = async (email: string) => {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user ?? null;
};

export const findUserById = async (id: string) => {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user ?? null;
};

export const createRefreshToken = async (userId: string): Promise<string> => {
  const token = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS ?? 7));
  await db.insert(refreshTokens).values({ userId, token, expiresAt });
  return token;
};

export const findRefreshToken = async (token: string) => {
  const [rt] = await db.select().from(refreshTokens).where(eq(refreshTokens.token, token));
  return rt ?? null;
};

export const revokeRefreshToken = async (token: string): Promise<void> => {
  await db.update(refreshTokens).set({ revoked: true }).where(eq(refreshTokens.token, token));
};
