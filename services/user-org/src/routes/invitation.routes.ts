import { Router } from 'express';
import { inviteToOrganisation, getInvitationByToken, acceptInvitationUser } from '../controllers/invitation.controller';

const orgInvitationRouter = Router({ mergeParams: true });
orgInvitationRouter.post('/', inviteToOrganisation);

const invitationRouter = Router();
invitationRouter.get('/:token', getInvitationByToken);
invitationRouter.post('/:token/accept', acceptInvitationUser);

export { orgInvitationRouter, invitationRouter };
