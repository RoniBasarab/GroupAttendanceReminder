// Shared domain types used across app, api, and worker.

/** Which attendance form a study day maps to. */
export type FormKind = 'morning' | 'evening';

/** One lesson question on a Google Form (a radio: present / absent). */
export type LessonField = {
  /** Google Forms field name, e.g. "entry.1810085234". */
  entryId: string;
  /** The Hebrew lesson label as shown on the form. */
  label: string;
};

/** Everything needed to submit one attendance Google Form. */
export type FormConfig = {
  kind: FormKind;
  /** Form title as shown to the user (Hebrew). */
  title: string;
  /** POST target: the form's /formResponse endpoint. */
  formResponseUrl: string;
  /** Field name for the first-name text input. */
  firstNameField: string;
  /** Field name for the last-name text input. */
  lastNameField: string;
  /** Lesson radios; all submitted as "present" on a one-tap confirm. */
  lessons: LessonField[];
};
