// Transactional email templates. Hand-built, email-safe HTML: table layout,
// inline styles, hex colors (clients don't support OKLCH), monospace figures.
// The approved/rejected mails are styled as a printed expense voucher.

// ── palette (warm paper + ink, one semantic status color per mail) ───────────
const C = {
  page: '#f1ede4', // warm paper backdrop
  card: '#fefdfb', // voucher surface (off-white, tinted warm)
  ink: '#211f1a', // primary text (near-black, warm)
  soft: '#54504a', // secondary text
  muted: '#8a857c', // labels, meta
  hair: '#e6e0d4', // hairline rules
  perf: '#cfc7b6', // perforation dashes
  approve: '#1f7a4d', // green — approved
  approveBg: '#e9f2ea',
  decline: '#a8412b', // clay — declined
  declineBg: '#f6ebe6',
};

const MONO = '"SF Mono","JetBrains Mono","Roboto Mono",Menlo,Consolas,monospace';
const SANS = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif';

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', KES: 'KSh', NGN: '₦',
};

// ── helpers ──────────────────────────────────────────────────────────────────
const esc = (s: string | null | undefined): string =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!),
  );

const money = (amount: string, currency: string): string => {
  const sym = CURRENCY_SYMBOLS[currency?.toUpperCase?.()] ?? '';
  return sym ? `${sym}${esc(amount)}` : esc(amount);
};

const fmtDate = (iso?: string): string => {
  const d = iso ? new Date(iso) : new Date();
  return isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const reference = (expenseId: string): string =>
  `EXP-${expenseId.replace(/-/g, '').slice(0, 8).toUpperCase()}`;

const perforation = (): string =>
  `<div style="border-top:2px dashed ${C.perf};line-height:0;font-size:0;height:0;">&nbsp;</div>`;

// A label/value ledger row, value right-aligned in mono.
const row = (label: string, value: string): string => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0;">
    <tr>
      <td style="padding:9px 0;font:400 13px/1.4 ${SANS};color:${C.muted};">${label}</td>
      <td align="right" style="padding:9px 0;font:500 13px/1.4 ${MONO};color:${C.ink};letter-spacing:0.02em;">${value}</td>
    </tr>
  </table>`;

const stamp = (text: string, color: string, bg: string): string => `
  <span style="display:inline-block;font:700 11px/1 ${SANS};letter-spacing:0.18em;text-transform:uppercase;color:${color};background:${bg};border:1px solid ${color};border-radius:4px;padding:6px 10px;">${esc(text)}</span>`;

// Round status seal + heading + date, the visual anchor at the top of a voucher.
// The circle is a table cell (border-radius on td renders in modern clients;
// Outlook squares it off, which is acceptable degradation).
const sealHeader = (
  glyph: string,
  status: string,
  color: string,
  bg: string,
  dateLabel: string,
): string => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;">
    <tr>
      <td width="56" valign="middle">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="width:54px;height:54px;border-radius:27px;background:${bg};border:2px solid ${color};text-align:center;vertical-align:middle;font:700 27px/54px ${SANS};color:${color};">${glyph}</td>
        </tr></table>
      </td>
      <td valign="middle" style="padding-left:16px;">
        <div style="font:700 13px/1.2 ${SANS};letter-spacing:0.14em;text-transform:uppercase;color:${color};">${esc(status)}</div>
        <div style="font:400 13px/1.4 ${SANS};color:${C.muted};margin-top:4px;">${esc(dateLabel)}</div>
      </td>
    </tr>
  </table>`;

// Outer document chrome shared by every mail: paper backdrop, centered voucher
// card, tracked wordmark, footer, and a hidden inbox preheader.
const document = (preheader: string, inner: string): string => `
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page};margin:0;padding:0;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:480px;max-width:100%;background:${C.card};border:1px solid ${C.hair};border-radius:14px;overflow:hidden;">
        <tr>
          <td style="padding:26px 30px 18px;">
            <div style="font:600 11px/1 ${SANS};letter-spacing:0.22em;text-transform:uppercase;color:${C.muted};">Expense Management</div>
          </td>
        </tr>
        <tr><td style="padding:0 30px;">${perforation()}</td></tr>
        <tr>
          <td style="padding:24px 30px 28px;">
            ${inner}
          </td>
        </tr>
        <tr><td style="padding:0 30px;">${perforation()}</td></tr>
        <tr>
          <td style="padding:16px 30px 26px;">
            <div style="font:400 11px/1.6 ${SANS};color:${C.muted};">
              Automated message from your organisation's expense system. Please do not reply.
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;

const eyebrow = (text: string, color: string): string =>
  `<div style="font:700 12px/1 ${SANS};letter-spacing:0.16em;text-transform:uppercase;color:${color};margin:0 0 14px;">${esc(text)}</div>`;

// ── templates ─────────────────────────────────────────────────────────────────
export const expenseApprovedEmail = (opts: {
  firstName: string | null;
  amount: string;
  currency: string;
  expenseId: string;
  occurredAt?: string;
}) => ({
  subject: `Expense approved · ${money(opts.amount, opts.currency)}`,
  html: document(
    `Approved · ${money(opts.amount, opts.currency)} · ${reference(opts.expenseId)}`,
    `
    ${sealHeader('✓', 'Expense approved', C.approve, C.approveBg, fmtDate(opts.occurredAt))}
    <div style="font:600 40px/1.1 ${MONO};color:${C.ink};letter-spacing:-0.01em;">${money(opts.amount, opts.currency)}</div>
    <div style="font:500 13px/1 ${MONO};color:${C.muted};letter-spacing:0.08em;margin:6px 0 22px;">${esc(opts.currency?.toUpperCase?.() || '')}</div>
    <p style="font:400 15px/1.6 ${SANS};color:${C.soft};margin:0 0 6px;">
      Hi ${esc(opts.firstName ?? 'there')}, this expense has been reviewed and approved.
    </p>
    <div style="height:1px;background:${C.hair};margin:20px 0 4px;"></div>
    ${row('Reference', reference(opts.expenseId))}
    <div style="height:1px;background:${C.hair};"></div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="padding:13px 0;font:400 13px/1.4 ${SANS};color:${C.muted};">Status</td>
      <td align="right" style="padding:13px 0;">${stamp('Approved', C.approve, C.approveBg)}</td>
    </tr></table>`,
  ),
});

export const expenseRejectedEmail = (opts: {
  firstName: string | null;
  reason: string;
  expenseId: string;
  occurredAt?: string;
}) => ({
  subject: `Expense declined · ${reference(opts.expenseId)}`,
  html: document(
    `Declined · ${reference(opts.expenseId)} · action needed`,
    `
    ${sealHeader('✕', 'Expense declined', C.decline, C.declineBg, fmtDate(opts.occurredAt))}
    <p style="font:400 15px/1.6 ${SANS};color:${C.soft};margin:0 0 18px;">
      Hi ${esc(opts.firstName ?? 'there')}, this expense was reviewed and could not be approved.
    </p>
    <div style="background:${C.declineBg};border:1px solid #ecd4cb;border-radius:10px;padding:16px 18px;margin:0 0 22px;">
      <div style="font:700 11px/1 ${SANS};letter-spacing:0.14em;text-transform:uppercase;color:${C.decline};margin:0 0 8px;">Reviewer note</div>
      <div style="font:400 15px/1.55 ${SANS};color:${C.ink};">${esc(opts.reason)}</div>
    </div>
    <div style="height:1px;background:${C.hair};margin:0 0 4px;"></div>
    ${row('Reference', reference(opts.expenseId))}
    <div style="height:1px;background:${C.hair};"></div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="padding:13px 0;font:400 13px/1.4 ${SANS};color:${C.muted};">Status</td>
      <td align="right" style="padding:13px 0;">${stamp('Declined', C.decline, C.declineBg)}</td>
    </tr></table>
    <p style="font:400 14px/1.6 ${SANS};color:${C.soft};margin:18px 0 0;">
      You can edit this expense and resubmit it for review from your dashboard.
    </p>`,
  ),
});

export const userInvitedEmail = (opts: {
  orgName: string;
  role: string;
  inviteToken: string;
}) => {
  const link = `${process.env.APP_BASE_URL ?? 'http://localhost:3000'}/invitations/${opts.inviteToken}`;
  const roleLabel = opts.role.charAt(0) + opts.role.slice(1).toLowerCase();
  return {
    subject: `You've been invited to ${opts.orgName}`,
    html: document(
      `Join ${opts.orgName} as ${roleLabel}`,
      `
      ${eyebrow('Invitation', C.ink)}
      <h1 style="font:600 26px/1.25 ${SANS};color:${C.ink};margin:0 0 12px;letter-spacing:-0.01em;">Join ${esc(opts.orgName)}</h1>
      <p style="font:400 15px/1.6 ${SANS};color:${C.soft};margin:0 0 18px;">
        You've been invited to collaborate on expenses for <strong style="color:${C.ink};">${esc(opts.orgName)}</strong>.
        Your role will be:
      </p>
      <span style="display:inline-block;font:600 12px/1 ${SANS};letter-spacing:0.06em;color:${C.ink};background:#f0ece3;border:1px solid ${C.hair};border-radius:999px;padding:8px 14px;margin:0 0 26px;">${esc(roleLabel)}</span>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 22px;"><tr>
        <td style="background:${C.ink};border-radius:10px;">
          <a href="${esc(link)}" style="display:inline-block;font:600 15px/1 ${SANS};color:${C.card};text-decoration:none;padding:15px 28px;">Accept invitation</a>
        </td>
      </tr></table>
      <div style="height:1px;background:${C.hair};margin:0 0 16px;"></div>
      <div style="font:400 12px/1.5 ${SANS};color:${C.muted};">If the button doesn't work, paste this link into your browser:</div>
      <div style="font:400 12px/1.5 ${MONO};color:${C.soft};word-break:break-all;margin:6px 0 0;">${esc(link)}</div>`,
    ),
  };
};
