import { and, eq } from 'drizzle-orm';
import { Role } from '@app/types';
import { db, userProfiles, memberships, organisations } from '../db';

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

export const findOrganisationById = async (orgId: string) => {
  const [org] = await db.select().from(organisations).where(eq(organisations.id, orgId));
  return org ?? null;
};

export const getMembersWithProfiles = async (orgId: string) => {
  return db
    .select({
      membershipId: memberships.id,
      role: memberships.role,
      joinedAt: memberships.createdAt,
      profile: {
        id: userProfiles.id,
        firstName: userProfiles.firstName,
        lastName: userProfiles.lastName,
        email: userProfiles.email,
      },
    })
    .from(memberships)
    .innerJoin(userProfiles, eq(memberships.userId, userProfiles.id))
    .where(eq(memberships.orgId, orgId));
};

export const isMember = async (orgId: string, userId: string): Promise<boolean> => {
  const [membership] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.orgId, orgId), eq(memberships.userId, userId)));
  return !!membership;
};
