import { Router } from 'express';
import { inviteToOrganisation } from '../controllers/invitation.controller';

const router = Router({ mergeParams: true });

router.post('/', inviteToOrganisation);

export default router;
