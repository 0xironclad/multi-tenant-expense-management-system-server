import { Router } from 'express';
import { createNewOrganisation, getOrganisationById, getOrganisationMembers } from '../controllers/org.controller';
import { orgInvitationRouter } from './invitation.routes';

const router = Router({ mergeParams: true });

router.post('/', createNewOrganisation);
router.get('/:orgId', getOrganisationById);
router.get('/:orgId/members', getOrganisationMembers);
router.use('/:orgId/invitations', orgInvitationRouter);

export default router;
