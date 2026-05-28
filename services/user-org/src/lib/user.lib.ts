import { eq } from 'drizzle-orm';
import { db, userProfiles, memberships, organisations } from '../db';

export const findProfileByAuthUserId = async (authUserId: string) => {
  const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.authUserId, authUserId));
  return profile ?? null;
};

export const createProfile = async (authUserId: string, email: string, firstName: string, lastName: string) => {
  const [profile] = await db.insert(userProfiles).values({ authUserId, email, firstName, lastName }).returning();
  return profile;
};

export const getMembershipsWithOrgs = async (userId: string) => {
  return db
    .select({
      membershipId: memberships.id,
      role: memberships.role,
      joinedAt: memberships.createdAt,
      org: {
        id: organisations.id,
        name: organisations.name,
        slug: organisations.slug,
      },
    })
    .from(memberships)
    .innerJoin(organisations, eq(memberships.orgId, organisations.id))
    .where(eq(memberships.userId, userId));
};
