import crypto from 'crypto';

const COOKIE_NAME = 'admin_session';

function getSecret(): string {
  return process.env.ADMIN_PASSWORD || 'default-password';
}

export function verifyPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return crypto.timingSafeEqual(
    Buffer.from(password),
    Buffer.from(expected)
  );
}

export function createSessionToken(): string {
  const hmac = crypto.createHmac('sha256', getSecret());
  hmac.update('authenticated');
  return hmac.digest('hex');
}

export function verifySessionToken(token: string): boolean {
  const expected = createSessionToken();
  try {
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

export { COOKIE_NAME };
