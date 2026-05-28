import { Request, Response } from "express";
import { getUserRoleInOrganisation as getUserRole } from "../lib/org.lib";
import { findProfileByAuthUserId } from "../lib/user.lib";

export const getUserRoleInOrganisation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const authUserId = req.params.authUserId;
  const orgId = req.query.orgId as string;

  if (!authUserId || !orgId) {
    res.status(400).json({ error: "Missing required parameters" });
    return;
  }

  try {
    const profile = await findProfileByAuthUserId(authUserId);
    if (!profile) {
      res.status(404).json({ error: "Membership not found" });
      return;
    }

    const role = await getUserRole(orgId, profile.id);
    if (!role) {
      res.status(404).json({ error: "Membership not found" });
      return;
    }

    res.status(200).json({ role });
  } catch (err) {
    console.error("Get user role error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
