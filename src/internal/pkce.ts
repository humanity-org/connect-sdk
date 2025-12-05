import { createHash, randomBytes } from 'crypto';

function base64UrlEncode(input: Buffer): string {
  return input
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export function generateCodeVerifier(length = 64): string {
  if (length < 43 || length > 128) {
    throw new RangeError('PKCE code verifier length must be between 43 and 128 characters');
  }
  const byteLength = Math.ceil((length * 3) / 4);
  const verifier = base64UrlEncode(randomBytes(byteLength));
  return verifier.substring(0, length);
}

export function deriveCodeChallenge(verifier: string): string {
  if (!verifier) {
    throw new Error('Code verifier is required to derive code challenge');
  }
  const hash = createHash('sha256').update(verifier).digest();
  return base64UrlEncode(hash);
}

