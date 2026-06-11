// Reminder content (push + email), in Hebrew. The email links to the web confirm
// page; Section 8.8 adds the per-member one-tap confirm token to that link.
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
  to: string,
  firstName: string,
  groupName: string,
  formKind: FormKind,
  date: string,
  webUrl: string,
): EmailMessage {
  const link = `${webUrl}/confirm?date=${date}&kind=${formKind}`;
  return {
    to,
    subject: `תזכורת נוכחות — ${groupName}`,
    text: `שלום ${firstName},\nזוהי תזכורת לאשר את הנוכחות של היום (${groupName}).\nלאישור: ${link}`,
    html: `<div dir="rtl"><p>שלום ${firstName},</p><p>זוהי תזכורת לאשר את הנוכחות של היום (${groupName}).</p><p><a href="${link}">לאישור נוכחות</a></p></div>`,
  };
}
