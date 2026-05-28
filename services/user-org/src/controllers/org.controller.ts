import { Request, Response } from "express";
import { createOrganisation } from "../lib/user.lib";

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
