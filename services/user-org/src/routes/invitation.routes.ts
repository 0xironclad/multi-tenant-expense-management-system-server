import { Router } from 'express';
import { inviteToOrganisation, getInvitationByToken, acceptInvitationUser, rejectInvitationUser } from '../controllers/invitation.controller';

const orgInvitationRouter = Router({ mergeParams: true });
orgInvitationRouter.post('/', inviteToOrganisation);

const invitationRouter = Router();
invitationRouter.get('/:token', getInvitationByToken);
invitationRouter.post('/:token/accept', acceptInvitationUser);
invitationRouter.post('/:token/reject', rejectInvitationUser);

export { orgInvitationRouter, invitationRouter };
