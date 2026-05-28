import { Request, Response } from 'express';
import { createProfileSchema } from '../schemas/user.schemas';
import { findProfileByAuthUserId, createProfile, getMembershipsWithOrgs } from '../lib/user.lib';

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


export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
  const authUserId = req.headers['x-user-id'] as string;

  if (!authUserId) {
    res.status(401).json({ error: 'Missing identity header' });
    return;
  }

  try {
    const profile = await findProfileByAuthUserId(authUserId);
    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    const memberships = await getMembershipsWithOrgs(profile.id);
    res.status(200).json({ ...profile, memberships });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}