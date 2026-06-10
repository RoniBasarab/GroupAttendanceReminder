// Canonical Google Form configs — single source of truth (planning.md Section 7).
// Both forms are anonymous and shared by the whole group; the only per-member data
// is first + last name. A one-tap confirm submits every lesson as PRESENT_VALUE.

import type { FormConfig, FormKind } from './types';

/** Hebrew radio value meaning "present". */
export const PRESENT_VALUE = 'נוכח';
/** Hebrew radio value meaning "absent". */
export const ABSENT_VALUE = 'לא נוכח';

export const MORNING_FORM: FormConfig = {
  kind: 'morning',
  title: 'דף נוכחות בוקר',
  formResponseUrl:
    'https://docs.google.com/forms/d/e/REDACTED_FORM_ID/formResponse',
  firstNameField: 'entry.777652418',
  lastNameField: 'entry.1085557563',
  lessons: [
    { entryId: 'entry.1810085234', label: 'שיעור ראשון 08:00-09:30' },
    { entryId: 'entry.908715477', label: 'שיעור שני 09:45-11:15' },
    { entryId: 'entry.389358252', label: 'שיעור שלישי 11:30-13:00' },
    { entryId: 'entry.1545309801', label: 'שיעור רביעי 13:30-15:00' },
    { entryId: 'entry.2131515473', label: 'שיעור חמישי 15:15-16:45' },
    { entryId: 'entry.500329780', label: 'שיעור שישי 17:00-18:30' },
  ],
};

export const EVENING_FORM: FormConfig = {
  kind: 'evening',
  title: 'דף נוכחות ערב',
  formResponseUrl:
    'https://docs.google.com/forms/d/e/REDACTED_FORM_ID/formResponse',
  firstNameField: 'entry.188601349',
  lastNameField: 'entry.1995583696',
  lessons: [
    { entryId: 'entry.2003200752', label: 'שיעור ראשון 15:30-17:00' },
    { entryId: 'entry.1828778968', label: 'שיעור שני 17:15-18:45' },
    { entryId: 'entry.1640252669', label: 'שיעור שלישי 19:00-20:30' },
  ],
};

export const FORMS: Record<FormKind, FormConfig> = {
  morning: MORNING_FORM,
  evening: EVENING_FORM,
};
