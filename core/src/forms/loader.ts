// Loads the real Google Form configs. The actual URLs/field IDs are never published:
//  - production (Vercel): from the FORMS_CONFIG_JSON env var (the file isn't deployed)
//  - local dev: from the gitignored core/forms.local.json
// Section 8.x reads these once at group creation to seed the `form_configs` table.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { FormConfig, FormKind } from '../types';

const here = dirname(fileURLToPath(import.meta.url)); // core/src/forms
const dataPath = resolve(here, '../../forms.local.json'); // core/forms.local.json

export function loadForms(): Record<FormKind, FormConfig> {
  const fromEnv = process.env.FORMS_CONFIG_JSON;
  if (fromEnv) {
    return JSON.parse(fromEnv) as Record<FormKind, FormConfig>;
  }
  try {
    return JSON.parse(readFileSync(dataPath, 'utf8')) as Record<FormKind, FormConfig>;
  } catch {
    throw new Error(
      'Form configs not found. Set FORMS_CONFIG_JSON, or create core/forms.local.json from core/forms.example.json.',
    );
  }
}
