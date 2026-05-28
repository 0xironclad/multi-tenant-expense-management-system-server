import { Request, Response } from 'express';
import { Role } from '@app/types';
import { findProfileByAuthUserId } from '../lib/user.lib';
import { getUserRoleInOrganisation, findOrganisationById } from '../lib/org.lib';
import { createInvitation, isAlreadyMember } from '../lib/invitation.lib';
import { publishEvent } from '../lib/queue';

const ROLE_HIERARCHY: Record<string, number> = {
  [Role.OWNER]: 3,
  [Role.MANAGER]: 2,
  [Role.EMPLOYEE]: 1,
};

export const inviteToOrganisation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const authUserId = req.headers['x-user-id'] as string;

  if (!authUserId) {
    res.status(401).json({ error: 'Missing identity header' });
    return;
  }

  const { orgId } = req.params;
  const { email, role } = req.body;

  if (!email || !role || !Object.values(Role).includes(role)) {
    res.status(400).json({ error: 'Valid email and role are required' });
    return;
  }

  try {
    const profile = await findProfileByAuthUserId(authUserId);
    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    const callerRole = await getUserRoleInOrganisation(orgId, profile.id);
    if (!callerRole) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    if (callerRole === Role.EMPLOYEE) {
      res.status(403).json({ error: 'Employees cannot invite members' });
      return;
    }

    if (ROLE_HIERARCHY[role] > ROLE_HIERARCHY[callerRole]) {
      res.status(403).json({ error: 'Cannot invite a member with a higher role than your own' });
      return;
    }

    const alreadyMember = await isAlreadyMember(orgId, email);
    if (alreadyMember) {
      res.status(409).json({ error: 'User is already a member of this organisation' });
      return;
    }

    const org = await findOrganisationById(orgId);
    if (!org) {
      res.status(404).json({ error: 'Organisation not found' });
      return;
    }

    const invitation = await createInvitation(orgId, email, role);

    await publishEvent({
      eventId: crypto.randomUUID(),
      type: 'USER_INVITED',
      email,
      orgId,
      orgName: org.name,
      role,
      inviteToken: invitation.token,
      occurredAt: new Date().toISOString(),
    });

    res.status(201).json(invitation);
  } catch (err) {
    console.error('Invite to organisation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
