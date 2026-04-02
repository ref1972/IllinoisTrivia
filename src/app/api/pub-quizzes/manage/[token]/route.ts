import { NextRequest, NextResponse } from 'next/server';
import { getPubQuizByManageToken } from '@/lib/db';
import { sendEmail } from '@/lib/email';

const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'friedewald@gmail.com';

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const quiz = getPubQuizByManageToken(params.token);
  if (!quiz || quiz.status !== 'approved') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(quiz);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const quiz = getPubQuizByManageToken(params.token);
  if (!quiz || quiz.status !== 'approved') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json();
  const type: 'update' | 'delete' = body.type;

  const adminUrl = `${process.env.NEXTAUTH_URL || 'https://illinoistrivia.com'}/admin/pub-quizzes`;

  if (type === 'delete') {
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `Pub Quiz Removal Request: ${quiz.venue} (${quiz.city})`,
      html: `
        <h2>Pub Quiz Removal Request</h2>
        <p>The submitter of <strong>${quiz.venue}</strong> in ${quiz.city} has requested removal of their listing.</p>
        <p style="margin-top: 20px;">
          <a href="${adminUrl}" style="background-color: #C83803; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Review in Admin Dashboard
          </a>
        </p>
      `,
    });
  } else {
    const changes: Record<string, string> = body.changes || {};
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `Pub Quiz Update Request: ${quiz.venue} (${quiz.city})`,
      html: `
        <h2>Pub Quiz Update Request</h2>
        <p>The submitter of <strong>${quiz.venue}</strong> in ${quiz.city} has requested changes.</p>
        <table style="border-collapse: collapse; margin: 16px 0;">
          ${Object.entries(changes).map(([k, v]) =>
            `<tr><td style="padding: 6px 12px; font-weight: bold; color: #0B1C3A;">${k}</td><td style="padding: 6px 12px;">${v}</td></tr>`
          ).join('')}
        </table>
        <p style="margin-top: 20px;">
          <a href="${adminUrl}" style="background-color: #C83803; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Review in Admin Dashboard
          </a>
        </p>
      `,
    });
  }

  return NextResponse.json({ success: true });
}
