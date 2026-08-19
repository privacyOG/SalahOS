import type { MosqueAnnouncement } from '../domain/mosqueAnnouncement';
import type { MosqueEvent } from '../domain/mosqueEvent';
import './community-publishing-preview.css';

export type PublishingPreviewSurface = 'phone' | 'web' | 'tv';
export type PublishingPreviewLocale = 'en' | 'ar';

type AnnouncementPreviewProps = Readonly<{
  kind: 'announcement';
  announcement: MosqueAnnouncement;
  surface: PublishingPreviewSurface;
  locale: PublishingPreviewLocale;
}>;

type EventPreviewProps = Readonly<{
  kind: 'event';
  event: MosqueEvent;
  surface: PublishingPreviewSurface;
  locale: PublishingPreviewLocale;
}>;

export type CommunityPublishingPreviewProps = AnnouncementPreviewProps | EventPreviewProps;

function targetForSurface(surface: PublishingPreviewSurface): 'mobile' | 'web' | 'display' {
  if (surface === 'phone') return 'mobile';
  if (surface === 'tv') return 'display';
  return 'web';
}

function previewLabel(surface: PublishingPreviewSurface): string {
  if (surface === 'phone') return 'Phone preview';
  if (surface === 'tv') return 'TV preview';
  return 'Web preview';
}

function renderAnnouncement({
  announcement,
  surface,
  locale,
}: AnnouncementPreviewProps) {
  const content = locale === 'ar' ? announcement.arabic ?? announcement.english : announcement.english ?? announcement.arabic;
  if (content === null) return null;

  const targeted = announcement.surfaces.includes(targetForSurface(surface));
  const direction = locale === 'ar' && announcement.arabic !== null ? 'rtl' : 'ltr';

  return (
    <article
      className="community-publishing-preview"
      data-kind="announcement"
      data-surface={surface}
      data-targeted={String(targeted)}
      dir={direction}
    >
      <header className="community-publishing-preview__header">
        <span className="community-publishing-preview__surface">{previewLabel(surface)}</span>
        <span className="community-publishing-preview__kind">Announcement</span>
      </header>
      {!targeted && (
        <p className="community-publishing-preview__warning" role="status">
          This announcement is not targeted to this surface.
        </p>
      )}
      {announcement.imageUrl !== null && (
        <img
          className="community-publishing-preview__image"
          src={announcement.imageUrl}
          alt=""
          loading="lazy"
        />
      )}
      <div className="community-publishing-preview__content">
        <div className="community-publishing-preview__badges">
          {announcement.pinned && <span>Pinned</span>}
          {announcement.priority === 'priority' && <span>Priority</span>}
          {announcement.recurrence !== 'none' && <span>{announcement.recurrence}</span>}
        </div>
        <h2>{content.title}</h2>
        <p>{content.body}</p>
        {announcement.callToActionUrl !== null && (
          <a href={announcement.callToActionUrl} rel="noreferrer">
            Open link
          </a>
        )}
      </div>
    </article>
  );
}

function renderEvent({ event, surface, locale }: EventPreviewProps) {
  const content = locale === 'ar' ? event.arabic ?? event.english : event.english ?? event.arabic;
  if (content === null) return null;

  const targeted = event.surfaces.includes(targetForSurface(surface));
  const direction = locale === 'ar' && event.arabic !== null ? 'rtl' : 'ltr';

  return (
    <article
      className="community-publishing-preview"
      data-kind="event"
      data-surface={surface}
      data-targeted={String(targeted)}
      dir={direction}
    >
      <header className="community-publishing-preview__header">
        <span className="community-publishing-preview__surface">{previewLabel(surface)}</span>
        <span className="community-publishing-preview__kind">Event</span>
      </header>
      {!targeted && (
        <p className="community-publishing-preview__warning" role="status">
          This event is not targeted to this surface.
        </p>
      )}
      {event.imageUrl !== null && (
        <img
          className="community-publishing-preview__image"
          src={event.imageUrl}
          alt=""
          loading="lazy"
        />
      )}
      <div className="community-publishing-preview__content">
        <div className="community-publishing-preview__badges">
          {event.allDay && <span>All day</span>}
          {event.recurrence !== 'none' && <span>{event.recurrence}</span>}
        </div>
        <h2>{content.title}</h2>
        <p>{content.description}</p>
        <dl className="community-publishing-preview__details">
          <div>
            <dt>Starts</dt>
            <dd>
              <time dateTime={event.startsAt}>{event.startsAt}</time>
            </dd>
          </div>
          <div>
            <dt>Venue</dt>
            <dd>{event.venue}</dd>
          </div>
        </dl>
        {event.registrationUrl !== null && (
          <a href={event.registrationUrl} rel="noreferrer">
            Registration / information
          </a>
        )}
      </div>
    </article>
  );
}

export function CommunityPublishingPreview(props: CommunityPublishingPreviewProps) {
  return props.kind === 'announcement' ? renderAnnouncement(props) : renderEvent(props);
}
