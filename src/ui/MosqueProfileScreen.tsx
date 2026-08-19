import './mosque-profile-screen.css';

export interface MosqueProfilePrayerRow {
  readonly name: string;
  readonly start: string;
  readonly iqamah: string | null;
  readonly active?: boolean;
}

export interface MosqueProfileJumuahSession {
  readonly label: string;
  readonly khutbah: string | null;
  readonly start: string;
}

export interface MosqueProfileCommunityItem {
  readonly id: string;
  readonly kind: 'announcement' | 'event';
  readonly title: string;
  readonly meta: string | null;
}

export interface MosqueProfileFacility {
  readonly id: string;
  readonly label: string;
}

interface MosqueProfileScreenProps {
  readonly mosqueName: string;
  readonly address: string;
  readonly sourceLabel: string;
  readonly freshnessLabel: string;
  readonly nextPrayerName: string;
  readonly nextPrayerCountdown: string;
  readonly prayers: readonly MosqueProfilePrayerRow[];
  readonly jumuahSessions: readonly MosqueProfileJumuahSession[];
  readonly communityItems: readonly MosqueProfileCommunityItem[];
  readonly facilities: readonly MosqueProfileFacility[];
  readonly contactLabel?: string | null;
  readonly timetableUrl?: string | null;
  readonly supportUrl?: string | null;
}

export function MosqueProfileScreen({
  mosqueName,
  address,
  sourceLabel,
  freshnessLabel,
  nextPrayerName,
  nextPrayerCountdown,
  prayers,
  jumuahSessions,
  communityItems,
  facilities,
  contactLabel = null,
  timetableUrl = null,
  supportUrl = null,
}: MosqueProfileScreenProps) {
  return (
    <main className="mosque-profile-screen">
      <header className="mosque-profile-screen__hero">
        <p className="mosque-profile-screen__eyebrow">Mosque profile</p>
        <h1>{mosqueName}</h1>
        <p>{address}</p>
        <div className="mosque-profile-screen__provenance" aria-label="Prayer data status">
          <span>{sourceLabel}</span>
          <span>{freshnessLabel}</span>
        </div>
      </header>

      <section className="mosque-profile-screen__next" aria-labelledby="next-prayer-title">
        <div>
          <p id="next-prayer-title">Next prayer</p>
          <h2>{nextPrayerName}</h2>
        </div>
        <strong>{nextPrayerCountdown}</strong>
      </section>

      <section aria-labelledby="today-prayers-title">
        <h2 id="today-prayers-title">Today</h2>
        <div className="mosque-profile-screen__prayers" role="list">
          {prayers.map((prayer) => (
            <article
              className="mosque-profile-screen__prayer"
              data-active={prayer.active ? 'true' : 'false'}
              key={prayer.name}
              role="listitem"
            >
              <h3>{prayer.name}</h3>
              <div>
                <span>Start</span>
                <strong>{prayer.start}</strong>
              </div>
              <div>
                <span>Iqamah</span>
                <strong>{prayer.iqamah ?? '—'}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      {jumuahSessions.length > 0 ? (
        <section aria-labelledby="jumuah-title">
          <h2 id="jumuah-title">Jumu’ah</h2>
          <div className="mosque-profile-screen__cards">
            {jumuahSessions.map((session) => (
              <article key={`${session.label}-${session.start}`}>
                <h3>{session.label}</h3>
                {session.khutbah ? <p>Khutbah {session.khutbah}</p> : null}
                <strong>{session.start}</strong>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {communityItems.length > 0 ? (
        <section aria-labelledby="community-title">
          <h2 id="community-title">Community</h2>
          <div className="mosque-profile-screen__cards">
            {communityItems.map((item) => (
              <article key={item.id}>
                <p className="mosque-profile-screen__eyebrow">{item.kind}</p>
                <h3>{item.title}</h3>
                {item.meta ? <p>{item.meta}</p> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="details-title">
        <h2 id="details-title">Mosque details</h2>
        {facilities.length > 0 ? (
          <ul className="mosque-profile-screen__facilities">
            {facilities.map((facility) => (
              <li key={facility.id}>{facility.label}</li>
            ))}
          </ul>
        ) : null}
        {contactLabel ? <p>{contactLabel}</p> : null}
        <div className="mosque-profile-screen__actions">
          {timetableUrl ? <a href={timetableUrl}>Monthly timetable</a> : null}
          {supportUrl ? <a href={supportUrl}>Support this mosque</a> : null}
        </div>
      </section>
    </main>
  );
}
