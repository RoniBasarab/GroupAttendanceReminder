// Email sender (Nodemailer over Gmail SMTP). Node-only; reached via "@gar/core/notify".
import nodemailer, { type Transporter } from 'nodemailer';

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

let transporter: Transporter | null = null;

function getTransport(): Transporter {
  if (transporter) return transporter;
  const port = Number(process.env.SMTP_PORT ?? 465);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  await getTransport().sendMail({
    from: { name: 'Attendance Reminder', address: process.env.EMAIL_FROM ?? process.env.SMTP_USER ?? '' },
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}
