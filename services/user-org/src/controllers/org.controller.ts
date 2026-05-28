import { Request, Response } from "express";
import {
  createOrganisation,
  isMember,
  findOrganisationById,
} from "../lib/org.lib";
import { findProfileByAuthUserId } from "../lib/user.lib";

export const createNewOrganisation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const authUserId = req.headers["x-user-id"] as string;

  if (!authUserId) {
    res.status(401).json({ error: "Missing identity header" });
    return;
  }

  const { name, slug } = req.body;
  if (!name || !slug) {
    res.status(400).json({ error: "name and slug are required" });
    return;
  }

  try {
    const org = await createOrganisation(name, slug, authUserId);
    res.status(201).json(org);
  } catch (err: any) {
    if (err.code === "23505") {
      res.status(409).json({ error: "Slug already in use" });
      return;
    }
    console.error("Create organisation error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getOrganisationById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const authUserId = req.headers["x-user-id"] as string;

  if (!authUserId) {
    res.status(401).json({ error: "Missing identity header" });
    return;
  }
  const orgId = req.params.orgId;

  try {
    const profile = await findProfileByAuthUserId(authUserId);
    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    const member = await isMember(orgId, profile.id);
    if (!member) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const org = await findOrganisationById(orgId);
    if (!org) {
      res.status(404).json({ error: "Organisation not found" });
      return;
    }

    res.status(200).json(org);
  } catch (err) {
    console.error("Get organisation error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
