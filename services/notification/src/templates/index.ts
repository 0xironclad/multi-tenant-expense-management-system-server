// Plain HTML string builders — no template engine for MVP.

const layout = (heading: string, body: string): string => `
  <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
    <h2 style="color: #111;">${heading}</h2>
    ${body}
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
    <p style="color: #888; font-size: 12px;">Expense Management System</p>
  </div>
`;

export const expenseApprovedEmail = (opts: {
  firstName: string | null;
  amount: string;
  currency: string;
}) => ({
  subject: 'Your expense was approved',
  html: layout(
    'Expense approved ✅',
    `<p>Hi ${opts.firstName ?? 'there'},</p>
     <p>Your expense for <strong>${opts.amount} ${opts.currency}</strong> has been <strong>approved</strong>.</p>`,
  ),
});

export const expenseRejectedEmail = (opts: {
  firstName: string | null;
  reason: string;
}) => ({
  subject: 'Your expense was rejected',
  html: layout(
    'Expense rejected',
    `<p>Hi ${opts.firstName ?? 'there'},</p>
     <p>Your expense was <strong>rejected</strong>.</p>
     <p><strong>Reason:</strong> ${opts.reason}</p>`,
  ),
});

export const userInvitedEmail = (opts: {
  orgName: string;
  role: string;
  inviteToken: string;
}) => {
  const link = `${process.env.APP_BASE_URL ?? 'http://localhost:3000'}/invitations/${opts.inviteToken}`;
  return {
    subject: `You've been invited to ${opts.orgName}`,
    html: layout(
      `You're invited to ${opts.orgName}`,
      `<p>You've been invited to join <strong>${opts.orgName}</strong> as <strong>${opts.role}</strong>.</p>
       <p><a href="${link}" style="background:#111;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Accept invitation</a></p>
       <p style="color:#888;font-size:12px;">Or paste this link: ${link}</p>`,
    ),
  };
};
