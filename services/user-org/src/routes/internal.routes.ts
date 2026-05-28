import { Router } from "express";
import { getUserRoleInOrganisation, getUserByAuthUserId } from "../controllers/internal.controller";

const router = Router();

router.get('/users/:authUserId/role', getUserRoleInOrganisation);
router.get('/users/:authUserId', getUserByAuthUserId);

export default router;