import { Request, Response } from "express";
import { Role, EventType } from "@app/types";
import { findProfileByAuthUserId } from "../lib/user.lib";
import {
  getUserRoleInOrganisation,
  findOrganisationById,
} from "../lib/org.lib";
import {
  createInvitation,
  isAlreadyMember,
  hasPendingInvitation,
  findInvitationByToken,
  acceptInvitation,
} from "../lib/invitation.lib";
import { publishEvent } from "../lib/queue";

const ROLE_HIERARCHY: Record<string, number> = {
  [Role.OWNER]: 3,
  [Role.MANAGER]: 2,
  [Role.EMPLOYEE]: 1,
};

export const inviteToOrganisation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const authUserId = req.headers["x-user-id"] as string;

  if (!authUserId) {
    res.status(401).json({ error: "Missing identity header" });
    return;
  }

  const { orgId } = req.params;
  const { email, role } = req.body;

  if (!email || !role || !Object.values(Role).includes(role)) {
    res.status(400).json({ error: "Valid email and role are required" });
    return;
  }

  try {
    const profile = await findProfileByAuthUserId(authUserId);
    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    const callerRole = await getUserRoleInOrganisation(orgId, profile.id);
    if (!callerRole) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    if (callerRole === Role.EMPLOYEE) {
      res.status(403).json({ error: "Employees cannot invite members" });
      return;
    }

    if (ROLE_HIERARCHY[role] > ROLE_HIERARCHY[callerRole]) {
      res.status(403).json({
        error: "Cannot invite a member with a higher role than your own",
      });
      return;
    }

    const alreadyMember = await isAlreadyMember(orgId, email);
    if (alreadyMember) {
      res
        .status(409)
        .json({ error: "User is already a member of this organisation" });
      return;
    }

    const pendingInvite = await hasPendingInvitation(orgId, email);
    if (pendingInvite) {
      res.status(409).json({ error: 'A pending invitation already exists for this email' });
      return;
    }

    const org = await findOrganisationById(orgId);
    if (!org) {
      res.status(404).json({ error: "Organisation not found" });
      return;
    }

    const invitation = await createInvitation(orgId, email, role);

    await publishEvent({
      eventId: crypto.randomUUID(),
      type: EventType.USER_INVITED,
      email,
      orgId,
      orgName: org.name,
      role,
      inviteToken: invitation.token,
      occurredAt: new Date().toISOString(),
    });

    res.status(201).json(invitation);
  } catch (err) {
    console.error("Invite to organisation error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getInvitationByToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { token } = req.params;

  try {
    const invitation = await findInvitationByToken(token);
    if (!invitation) {
      res.status(404).json({ error: "Invitation not found" });
      return;
    }

    res.status(200).json({
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      acceptedAt: invitation.acceptedAt,
      orgId: invitation.orgId,
    });
  } catch (err) {
    console.error("Get invitation by token error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const acceptInvitationUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { token } = req.params;
  const authUserId = req.headers["x-user-id"] as string;

  if (!authUserId) {
    res.status(401).json({ error: "Missing identity header" });
    return;
  }

  try {
    const membership = await acceptInvitation(token, authUserId);
    res.status(200).json({
      message: "Invitation accepted",
      orgId: membership.orgId,
      role: membership.role,
    });
  } catch (err) {
    if (err instanceof Error) {
      switch (err.message) {
        case "NOT_FOUND":
          res.status(404).json({ error: "Invitation not found" });
          return;
        case "ALREADY_ACCEPTED":
          res.status(400).json({ error: "Invitation has already been accepted" });
          return;
        case "EXPIRED":
          res.status(400).json({ error: "Invitation has expired" });
          return;
        case "PROFILE_NOT_FOUND":
          res.status(404).json({ error: "User profile not found" });
          return;
        case "EMAIL_MISMATCH":
          res.status(403).json({ error: "This invitation was sent to a different email address" });
          return;
        default:
          console.error("Accept invitation error:", err);
          res.status(500).json({ error: "Internal server error" });
      }
    } else {
      console.error("Accept invitation error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
};
