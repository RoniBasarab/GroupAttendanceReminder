import { randomInt } from 'node:crypto';

// Unambiguous alphabet: no 0/O/1/I/L to avoid confusion when shared verbally.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateJoinCode(length = 6): string {
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}
