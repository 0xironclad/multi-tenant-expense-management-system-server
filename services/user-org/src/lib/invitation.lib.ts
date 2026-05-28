import { eq, and } from 'drizzle-orm';
import { db, invitations, memberships, userProfiles } from '../db';

export const createInvitation = async (
  orgId: string,
  email: string,
  role: string,
) => {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [invitation] = await db
    .insert(invitations)
    .values({ orgId, email, role, token, expiresAt })
    .returning();

  return invitation;
};

export const findInvitationByToken = async (token: string) => {
  const [invitation] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.token, token));
  return invitation ?? null;
};

export const acceptInvitation = async (token: string, authUserId: string) => {
  return db.transaction(async (tx) => {
    const [invitation] = await tx
      .select()
      .from(invitations)
      .where(eq(invitations.token, token));

    if (!invitation) throw new Error('NOT_FOUND');
    if (invitation.acceptedAt) throw new Error('ALREADY_ACCEPTED');
    if (invitation.expiresAt < new Date()) throw new Error('EXPIRED');

    const [profile] = await tx
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.authUserId, authUserId));

    if (!profile) throw new Error('PROFILE_NOT_FOUND');
    if (profile.email !== invitation.email) throw new Error('EMAIL_MISMATCH');

    const [membership] = await tx
      .insert(memberships)
      .values({ userId: profile.id, orgId: invitation.orgId, role: invitation.role })
      .returning();

    await tx
      .update(invitations)
      .set({ acceptedAt: new Date() })
      .where(eq(invitations.token, token));

    return membership;
  });
};

export const isAlreadyMember = async (orgId: string, email: string): Promise<boolean> => {
  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.email, email));

  if (!profile) return false;

  const [membership] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.orgId, orgId), eq(memberships.userId, profile.id)));

  return !!membership;
};
