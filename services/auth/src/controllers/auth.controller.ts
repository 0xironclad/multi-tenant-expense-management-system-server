import { Request, Response } from 'express';
import { registerSchema, loginSchema, refreshSchema, logoutSchema } from '../schemas/auth.schemas';
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
} from '../lib/auth.lib';

export const register = async (req: Request, res: Response): Promise<void> => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const { email, password } = result.data;

  try {
    const passwordHash = await hashPassword(password);
    const user = await createUser(email, passwordHash);
    res.status(201).json({ userId: user.id, email: user.email });
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Email already in use' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const { email, password } = result.data;
  const user = await findUserByEmail(email);

  if (!user) {
    res.status(401).json({ error: 'Invalid email' });
    return;
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid password' });
    return;
  }

  const accessToken = createAccessToken({ sub: user.id, email: user.email });
  const refreshToken = await createRefreshToken(user.id);

  res.status(200).json({ accessToken, refreshToken });
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const result = refreshSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const { refreshToken } = result.data;
  const rt = await findRefreshToken(refreshToken);

  if (!rt || rt.revoked || rt.expiresAt < new Date()) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
    return;
  }

  await revokeRefreshToken(refreshToken);

  const user = await findUserById(rt.userId);
  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return;
  }

  const accessToken = createAccessToken({ sub: user.id, email: user.email });
  const newRefreshToken = await createRefreshToken(user.id);

  res.status(200).json({ accessToken, refreshToken: newRefreshToken });
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  const result = logoutSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  await revokeRefreshToken(result.data.refreshToken);
  res.status(200).json({ message: 'Logged out' });
};

export const verify = async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ valid: false });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    res.status(200).json({ valid: true, userId: payload.sub, email: payload.email });
  } catch {
    res.status(401).json({ valid: false });
  }
};
