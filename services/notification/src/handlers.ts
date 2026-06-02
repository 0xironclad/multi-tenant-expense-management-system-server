import { AppEvent, EventType } from '@app/types';
import { resolveUser } from './lib/userLookup';
import { sendEmail } from './lib/email';
import {
  expenseApprovedEmail,
  expenseRejectedEmail,
  userInvitedEmail,
} from './templates';

// Dispatches a parsed event to the right email. Any thrown error propagates to
// the consumer, which nacks the message so it is retried on redelivery.
export const handleEvent = async (event: AppEvent): Promise<void> => {
  switch (event.type) {
    case EventType.EXPENSE_APPROVED: {
      const user = await resolveUser(event.submittedBy);
      const { subject, html } = expenseApprovedEmail({
        firstName: user.firstName,
        amount: event.amount,
        currency: event.currency,
      });
      await sendEmail({ to: user.email, subject, html });
      break;
    }
    
    case EventType.EXPENSE_REJECTED: {
      const user = await resolveUser(event.submittedBy);
      const { subject, html } = expenseRejectedEmail({
        firstName: user.firstName,
        reason: event.reason,
      });
      await sendEmail({ to: user.email, subject, html });
      break;
    }

    case EventType.USER_INVITED: {
      // Email is in the payload — the invitee may not have a profile yet.
      const { subject, html } = userInvitedEmail({
        orgName: event.orgName,
        role: event.role,
        inviteToken: event.inviteToken,
      });
      await sendEmail({ to: event.email, subject, html });
      break;
    }

    default: {
      // Unknown event type — log and let the caller ack it (nothing to retry).
      console.warn('[handler] ignoring unknown event type:', (event as { type?: string }).type);
    }
  }
};
