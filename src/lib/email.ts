import { Resend } from 'resend';
import { getSubscribersForRegion } from './db';

const resend = new Resend(process.env.RESEND_API_KEY);

const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'friedewald@gmail.com';
const FROM_EMAIL = 'IllinoisTrivia.com <noreply@illinoistrivia.com>';

interface EventEmailData {
  name: string;
  date_time: string;
  venue: string;
  address: string;
  cost: string;
  description: string;
  contact_name?: string | null;
  contact_email?: string | null;
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
}

function extractCity(address: string): string {
  const parts = address.split(',');
  return parts.length >= 2 ? parts[parts.length - 2].trim() : address;
}

export async function notifySubscribers(event: { id: number; name: string; date_time: string; venue: string; address: string; cost: string }) {
  const city = extractCity(event.address);
  const subscribers = getSubscribersForRegion(city);
  if (subscribers.length === 0) return;

  const eventDate = new Date(event.date_time).toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });

  for (const sub of subscribers) {
    const unsubUrl = `https://illinoistrivia.com/unsubscribe?token=${sub.unsubscribe_token}`;
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: sub.email,
        subject: `New Trivia Night Event: ${event.name}`,
        html: `
          <h2>New Trivia Night Event Near You!</h2>
          <table style="border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 6px 12px; font-weight: bold; color: #58595B;">Event</td><td style="padding: 6px 12px;">${event.name}</td></tr>
            <tr><td style="padding: 6px 12px; font-weight: bold; color: #58595B;">Date</td><td style="padding: 6px 12px;">${eventDate}</td></tr>
            <tr><td style="padding: 6px 12px; font-weight: bold; color: #58595B;">Venue</td><td style="padding: 6px 12px;">${event.venue}</td></tr>
            <tr><td style="padding: 6px 12px; font-weight: bold; color: #58595B;">Address</td><td style="padding: 6px 12px;">${event.address}</td></tr>
            <tr><td style="padding: 6px 12px; font-weight: bold; color: #58595B;">Cost</td><td style="padding: 6px 12px;">${event.cost}</td></tr>
          </table>
          <p style="margin-top: 20px;">
            <a href="https://illinoistrivia.com/events/${event.id}" style="background-color: #ED1C24; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              View Event Details
            </a>
          </p>
          <p style="margin-top: 24px; color: #999; font-size: 12px;">
            You're receiving this because you subscribed to IllinoisTrivia.com event alerts.
            <a href="${unsubUrl}" style="color: #999;">Unsubscribe</a>
          </p>
        `,
      });
    } catch (err) {
      console.error(`Failed to notify subscriber ${sub.email}:`, err);
    }
  }
}

export async function sendSubmissionEmails(event: EventEmailData) {
  const eventDate = new Date(event.date_time).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  // Send admin notification
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `New Event Submission: ${event.name}`,
      html: `
        <h2>New Event Submitted for Review</h2>
        <p>A new trivia night event has been submitted on IllinoisTrivia.com and is awaiting your approval.</p>
        <table style="border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 6px 12px; font-weight: bold; color: #58595B;">Event</td><td style="padding: 6px 12px;">${event.name}</td></tr>
          <tr><td style="padding: 6px 12px; font-weight: bold; color: #58595B;">Date</td><td style="padding: 6px 12px;">${eventDate}</td></tr>
          <tr><td style="padding: 6px 12px; font-weight: bold; color: #58595B;">Venue</td><td style="padding: 6px 12px;">${event.venue}</td></tr>
          <tr><td style="padding: 6px 12px; font-weight: bold; color: #58595B;">Address</td><td style="padding: 6px 12px;">${event.address}</td></tr>
          <tr><td style="padding: 6px 12px; font-weight: bold; color: #58595B;">Cost</td><td style="padding: 6px 12px;">${event.cost}</td></tr>
          ${event.contact_name ? `<tr><td style="padding: 6px 12px; font-weight: bold; color: #58595B;">Contact</td><td style="padding: 6px 12px;">${event.contact_name}${event.contact_email ? ` (${event.contact_email})` : ''}</td></tr>` : ''}
        </table>
        <p style="color: #666;">${event.description}</p>
        <p style="margin-top: 20px;">
          <a href="https://illinoistrivia.com/admin" style="background-color: #ED1C24; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Review in Admin Dashboard
          </a>
        </p>
      `,
    });
  } catch (err) {
    console.error('Failed to send admin notification email:', err);
  }

  // Send confirmation to submitter (if they provided an email)
  if (event.contact_email) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: event.contact_email,
        subject: `Event Received: ${event.name}`,
        html: `
          <h2>Thanks for Submitting Your Event!</h2>
          <p>We've received your trivia night event submission on <a href="https://illinoistrivia.com">IllinoisTrivia.com</a>. Here's a summary:</p>
          <table style="border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 6px 12px; font-weight: bold; color: #58595B;">Event</td><td style="padding: 6px 12px;">${event.name}</td></tr>
            <tr><td style="padding: 6px 12px; font-weight: bold; color: #58595B;">Date</td><td style="padding: 6px 12px;">${eventDate}</td></tr>
            <tr><td style="padding: 6px 12px; font-weight: bold; color: #58595B;">Venue</td><td style="padding: 6px 12px;">${event.venue}</td></tr>
            <tr><td style="padding: 6px 12px; font-weight: bold; color: #58595B;">Address</td><td style="padding: 6px 12px;">${event.address}</td></tr>
            <tr><td style="padding: 6px 12px; font-weight: bold; color: #58595B;">Cost</td><td style="padding: 6px 12px;">${event.cost}</td></tr>
          </table>
          <p>Your event is pending review and will appear on the site once approved. You'll typically hear back within 24-48 hours.</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            &mdash; Illinois Trivia Nights
          </p>
        `,
      });
    } catch (err) {
      console.error('Failed to send submitter confirmation email:', err);
    }
  }
}
