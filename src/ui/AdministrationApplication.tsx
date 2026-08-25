import { AdminDisplayThemeManagement } from './AdminDisplayThemeManagement';
import { AdminOverviewDashboard } from './AdminOverviewDashboard';
import { AdminShell } from './AdminShell';
import { CommunityUpdatesPanel } from './CommunityUpdatesPanel';
import { ManagedDisplayConnectionSettings } from './ManagedDisplayConnectionSettings';
import { ManagedDisplayRemoteController } from './ManagedDisplayRemoteController';
import { PrayerBoardAnnouncementSettings } from './PrayerBoardAnnouncementSettings';
import { PrayerBoardWeatherSettings } from './PrayerBoardWeatherSettings';
import { RamadanModePanel } from './RamadanModePanel';
import { TaraweehPanel } from './TaraweehPanel';
import type { AdminDestination } from './applicationRoute';

type AdminSectionLandingProps = Readonly<{
  title: string;
  description: string;
  note: string;
}>;

function AdminSectionLanding({ title, description, note }: AdminSectionLandingProps) {
  return (
    <section className="admin-section-landing">
      <p className="admin-overview__eyebrow">SalahOS</p>
      <h2>{title}</h2>
      <p>{description}</p>
      <aside>{note}</aside>
    </section>
  );
}

function AdministrationRoute({
  destination,
  navigate,
}: Readonly<{
  destination: AdminDestination;
  navigate: (destination: AdminDestination) => void;
}>) {
  switch (destination) {
    case 'prayer-iqamah':
      return (
        <AdminSectionLanding
          title="Prayer & Iqamah"
          description="The administration workspace keeps mosque publishing separate from personal prayer settings."
          note="The existing managed prayer-publication domain remains authoritative for draft, publication and rollback provenance. The Stage 24 overview reports that state without changing local prayer calculations."
        />
      );
    case 'jumuah-ramadan':
      return (
        <div className="admin-section-stack">
          <AdminSectionLanding
            title="Jumu'ah & Ramadan"
            description="Seasonal and Friday context has its own administration destination instead of increasing daily prayer-setting density."
            note="Current Ramadan and Taraweeh tools remain local-first while the managed publication workflow is progressively migrated into this surface."
          />
          <RamadanModePanel />
          <TaraweehPanel />
        </div>
      );
    case 'community':
      return (
        <div className="admin-section-stack">
          <AdminSectionLanding
            title="Community content"
            description="Prepare announcements and events away from the congregation reading experience."
            note="Published content continues to use the existing validated local community-content library and display-surface rules."
          />
          <CommunityUpdatesPanel />
        </div>
      );
    case 'displays':
      return (
        <div className="admin-section-stack admin-section-stack--displays">
          <AdminDisplayThemeManagement />
          <ManagedDisplayConnectionSettings />
          <PrayerBoardWeatherSettings />
          <PrayerBoardAnnouncementSettings />
          <ManagedDisplayRemoteController />
        </div>
      );
    case 'integrations':
      return (
        <AdminSectionLanding
          title="Integrations"
          description="Optional external connections are isolated from prayer calculation and normal congregation use."
          note="Home Assistant, calendar and managed-service integrations retain their existing privacy and network gates while their administration controls are consolidated here."
        />
      );
    case 'members':
      return (
        <AdminSectionLanding
          title="Members & permissions"
          description="Administrative responsibility belongs in a dedicated access-management destination."
          note="Authentication and role enforcement remain separate from the local-first prayer engine; no account is required for core congregation prayer functionality."
        />
      );
    case 'settings':
      return (
        <AdminSectionLanding
          title="Administration settings"
          description="Administration-specific defaults are kept separate from personal SalahOS preferences."
          note="Display credentials, fleet controls and publication tools remain inside the administration surface and are not mounted in congregation pages."
        />
      );
    case 'overview':
    default:
      return <AdminOverviewDashboard navigate={navigate} />;
  }
}

export function AdministrationApplication() {
  return (
    <AdminShell>
      {(destination, navigate) => (
        <AdministrationRoute destination={destination} navigate={navigate} />
      )}
    </AdminShell>
  );
}
