import { Router } from 'express';
import { createNewOrganisation } from '../controllers/org.controller';

const router = Router();

router.post('/', createNewOrganisation);
// router.get('/:orgId', getOrganisationById);

export default router;
