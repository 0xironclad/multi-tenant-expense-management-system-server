import { eq } from 'drizzle-orm';
import { Role } from '@app/types';
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

export const createOrganisation = async (name: string, slug: string, authUserId: string) => {
  return db.transaction(async (tx) => {
    const [org] = await tx.insert(organisations).values({ name, slug }).returning();

    const [profile] = await tx.select().from(userProfiles).where(eq(userProfiles.authUserId, authUserId));
    if (!profile) throw new Error('Profile not found for authUserId: ' + authUserId);

    await tx.insert(memberships).values({
      userId: profile.id,
      orgId: org.id,
      role: Role.OWNER,
    });

    return org;
  });
};