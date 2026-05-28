import { eq } from 'drizzle-orm';
import { db, userProfiles } from '../db';

export const findProfileByAuthUserId = async (authUserId: string) => {
  const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.authUserId, authUserId));
  return profile ?? null;
};

export const createProfile = async (authUserId: string, email: string, firstName: string, lastName: string) => {
  const [profile] = await db.insert(userProfiles).values({ authUserId, email, firstName, lastName }).returning();
  return profile;
};
