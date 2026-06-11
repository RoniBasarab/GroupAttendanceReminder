// Reminder content (push + email), in Hebrew. The email's one-tap link carries an
// HMAC confirm token so a recipient who isn't logged in can still confirm.
import { signConfirmToken } from '../auth/confirmToken';
import type { EmailMessage } from '../notify/email';
import type { PushMessage } from '../notify/push';
import type { FormKind } from '../types';

export function buildReminderPush(groupName: string, formKind: FormKind, date: string): PushMessage {
  return {
    title: 'תזכורת נוכחות',
    body: `הקש/י לאישור הנוכחות של היום — ${groupName}`,
    data: { type: 'attendance-reminder', formKind, date },
  };
}

export function buildReminderEmail(
  member: { id: string; email: string; firstName: string },
  groupName: string,
  date: string,
  webUrl: string,
): EmailMessage {
  const token = signConfirmToken(member.id, date);
  const link = `${webUrl}/api/attendance/confirm-email?token=${encodeURIComponent(token)}`;
  return {
    to: member.email,
    subject: `תזכורת נוכחות — ${groupName}`,
    text: `שלום ${member.firstName},\nזוהי תזכורת לאשר את הנוכחות של היום (${groupName}).\nלאישור בלחיצה אחת: ${link}`,
    html: `<div dir="rtl"><p>שלום ${member.firstName},</p><p>זוהי תזכורת לאשר את הנוכחות של היום (${groupName}).</p><p><a href="${link}">לאישור נוכחות</a></p></div>`,
  };
}
