import { Router } from 'express';
import { createNewOrganisation, getOrganisationById } from '../controllers/org.controller';

const router = Router();

router.post('/', createNewOrganisation);
router.get('/:orgId', getOrganisationById);

export default router;
