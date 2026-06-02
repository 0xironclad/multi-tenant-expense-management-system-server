import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

console.log(
  resend
    ? `[email] Resend enabled (from: ${FROM}).`
    : "[email] RESEND_API_KEY not set — log-only mode (no real emails sent).",
);

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({
  to,
  subject,
  html,
}: EmailMessage): Promise<void> => {
  if (!resend) {
    return;
  }

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(
      `Resend send failed for "${subject}" → ${to}: ${error.name}: ${error.message}`,
    );
  }

  console.log(
    `[email] sent "${subject}" to ${to} (id: ${data?.id ?? "unknown"})`,
  );
};
