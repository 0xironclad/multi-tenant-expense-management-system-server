import { Router } from 'express';
import { createNewOrganisation } from '../controllers/user.controller';

const router = Router();

router.post('/', createNewOrganisation);

export default router;
