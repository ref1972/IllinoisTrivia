import { Event } from './types';
import { markEventNotified, updateEvent, upsertVenue } from './db';
import { geocodeAddress } from './geocode';
import { isImminent, notifySubscribers, sendApprovalEmail } from './email';

/**
 * Everything that must happen when an event becomes approved, regardless of
 * whether that came from the admin queue's Approve button or from setting the
 * status dropdown on the edit page. Previously only the queue button ran these,
 * so events approved via the edit form went live with no coordinates (invisible
 * on the map), no approval email to the submitter, and no subscriber notice.
 *
 * Safe to call more than once: geocoding is skipped when coordinates exist and
 * notified_at stops a second subscriber blast.
 */
export async function applyApprovalSideEffects(event: Event): Promise<void> {
  if (!event.latitude || !event.longitude) {
    const coords = await geocodeAddress(event.address);
    if (coords) {
      updateEvent(event.id, { latitude: coords.lat, longitude: coords.lng } as Partial<Event>);
    }
  }

  upsertVenue(event.venue, event.address, event.venue_website);

  // Events happening soon go out straight away; the rest wait for the weekly
  // digest so subscribers get one email instead of one per event.
  if (!event.notified_at && isImminent(event.date_time)) {
    markEventNotified(event.id);
    notifySubscribers(event).catch(err => console.error('Failed to notify subscribers:', err));
  }

  if (event.contact_email && event.manage_token) {
    sendApprovalEmail({
      name: event.name,
      id: event.id,
      contact_email: event.contact_email,
      manage_token: event.manage_token,
    }).catch(err => console.error('Failed to send approval email:', err));
  }
}
