import { PRESENT_VALUE } from '../constants';

export type SubmittableForm = {
  formResponseUrl: string;
  firstNameField: string;
  lastNameField: string;
  lessons: { entryId: string }[];
};

export type AttendancePerson = { firstName: string; lastName: string };

/** Builds the x-www-form-urlencoded body: first/last name + every lesson marked present. */
export function buildFormBody(form: SubmittableForm, person: AttendancePerson): URLSearchParams {
  const body = new URLSearchParams();
  body.set(form.firstNameField, person.firstName);
  body.set(form.lastNameField, person.lastName);
  for (const lesson of form.lessons) {
    body.set(lesson.entryId, PRESENT_VALUE);
  }
  // Mimic a real single-page Google Forms submit.
  body.set('fvv', '1');
  body.set('pageHistory', '0');
  return body;
}
