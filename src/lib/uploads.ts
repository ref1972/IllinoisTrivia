import path from 'path';

// UPLOAD_DIR env var allows overriding the upload path on the server (useful if
// process.cwd() is unreliable under PM2). Set in .env.local on the Droplet:
//   UPLOAD_DIR=/var/www/IllinoisTrivia/public/uploads
export const UPLOAD_DIR =
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'public', 'uploads');
