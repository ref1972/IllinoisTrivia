export async function verifyRecaptcha(token: string, expectedAction: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) return false;

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: secretKey, response: token }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    return data.success
      && data.action === expectedAction
      && typeof data.score === 'number'
      && data.score >= 0.5;
  } catch {
    return false;
  }
}
