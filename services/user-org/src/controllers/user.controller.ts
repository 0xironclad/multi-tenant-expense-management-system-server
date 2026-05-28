import { Request, Response } from 'express';
import { createProfileSchema } from '../schemas/user.schemas';
import { findProfileByAuthUserId, createProfile } from '../lib/user.lib';

export const createUserProfile = async (req: Request, res: Response): Promise<void> => {
  const authUserId = req.headers['x-user-id'] as string;
  const email = req.headers['x-user-email'] as string;

  if (!authUserId || !email) {
    res.status(401).json({ error: 'Missing identity headers' });
    return;
  }

  const result = createProfileSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const { firstName, lastName } = result.data;

  const existing = await findProfileByAuthUserId(authUserId);
  if (existing) {
    res.status(200).json(existing);
    return;
  }

  try {
    const profile = await createProfile(authUserId, email, firstName, lastName);
    res.status(201).json(profile);
  } catch (err) {
    console.error('Create profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
