import { Router } from 'express';
import { inviteToOrganisation, getInvitationByToken, acceptInvitation } from '../controllers/invitation.controller';

const orgInvitationRouter = Router({ mergeParams: true });
orgInvitationRouter.post('/', inviteToOrganisation);

const invitationRouter = Router();
invitationRouter.get('/:token', getInvitationByToken);
invitationRouter.post('/:token/accept', acceptInvitation);

export { orgInvitationRouter, invitationRouter };
