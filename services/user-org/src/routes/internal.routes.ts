import { Router } from "express";
import { getUserRoleInOrganisation } from "../controllers/internal.controller";

const router = Router();

router.get('/users/:authUserId/role', getUserRoleInOrganisation);

export default router;