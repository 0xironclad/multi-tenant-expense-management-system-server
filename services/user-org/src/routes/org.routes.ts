import { Router } from 'express';
import { createNewOrganisation, getOrganisationById, getOrganisationMembers } from '../controllers/org.controller';

const router = Router();

router.post('/', createNewOrganisation);
router.get('/:orgId', getOrganisationById);
router.get('/:orgId/members', getOrganisationMembers);

export default router;
