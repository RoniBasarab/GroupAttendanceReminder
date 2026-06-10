// Node-only loader for the real Google Form configs. The actual URLs and field IDs
// live in core/forms.local.json, which is gitignored and never published.
// Section 8.3 replaces this with a Supabase `form_configs` table seeded from that file.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { FormConfig, FormKind } from '../types';

const here = dirname(fileURLToPath(import.meta.url)); // core/src/forms
const dataPath = resolve(here, '../../forms.local.json'); // core/forms.local.json

export function loadForms(): Record<FormKind, FormConfig> {
  let raw: string;
  try {
    raw = readFileSync(dataPath, 'utf8');
  } catch {
    throw new Error(
      `Missing ${dataPath}. Copy core/forms.example.json to core/forms.local.json and fill in the real form configs.`,
    );
  }
  return JSON.parse(raw) as Record<FormKind, FormConfig>;
}
