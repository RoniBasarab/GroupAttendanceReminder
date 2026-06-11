import { buildFormBody, type AttendancePerson, type SubmittableForm } from './buildFormBody';

/** POSTs the attendance to the Google Form. Throws on a non-2xx response. */
export async function submitGoogleForm(form: SubmittableForm, person: AttendancePerson): Promise<void> {
  const response = await fetch(form.formResponseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: buildFormBody(form, person).toString(),
  });
  if (!response.ok) {
    throw new Error(`Form submission failed (HTTP ${response.status}).`);
  }
}
