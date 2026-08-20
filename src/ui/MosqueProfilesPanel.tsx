import { useEffect, useMemo, useState } from 'react';

import type { Locale } from '../i18n/translations';
import { getApplicationStorage } from '../platform/applicationStorage';
import { MOSQUE_PROFILE_LIBRARY_CHANGE_EVENT } from '../platform/mosqueProfileEvents';
import {
  loadMosqueProfileLibrary,
  parseMosqueProfileLibrary,
  removeMosqueProfile,
  saveMosqueProfileLibrary,
  selectMosqueProfile,
  serializeMosqueProfileLibrary,
  type MosqueProfileLibraryState,
} from '../platform/mosqueProfileLibrary';
import { loadPersistedSettings } from '../platform/settingsStorage';
import { smartDisplayModeRequested } from './SmartDisplay';

const copy = {
  en: {
    title: 'Mosque profiles',
    subtitle: 'Keep multiple mosque profiles on this device and choose the active community context.',
    none: 'All mosques',
    selected: 'Selected',
    select: 'Select profile',
    remove: 'Remove',
    address: 'Address',
    timezone: 'Timezone',
    facilities: 'Facilities',
    contact: 'Contact',
    noProfiles: 'No mosque profiles are stored on this device yet.',
    manage: 'Local profile import / export',
    manageHelp: 'Import a validated SalahOS mosque-profile-library JSON bundle or export the local library.',
    payload: 'Mosque profile library JSON',
    import: 'Import profiles',
    export: 'Prepare export',
    imported: 'Mosque profiles imported and saved locally.',
    exported: 'Current mosque profiles are ready in the JSON field.',
    invalid: 'The profile bundle is invalid and was not saved.',
  },
  ar: {
    title: 'ملفات المساجد',
    subtitle: 'احفظ عدة ملفات للمساجد على هذا الجهاز واختر سياق المجتمع النشط.',
    none: 'كل المساجد',
    selected: 'محدد',
    select: 'اختيار الملف',
    remove: 'حذف',
    address: 'العنوان',
    timezone: 'المنطقة الزمنية',
    facilities: 'المرافق',
    contact: 'التواصل',
    noProfiles: 'لا توجد ملفات مساجد محفوظة على هذا الجهاز بعد.',
    manage: 'استيراد / تصدير الملفات المحلية',
    manageHelp: 'استورد حزمة JSON صالحة لملفات المساجد أو صدّر المكتبة المحلية.',
    payload: 'JSON لمكتبة ملفات المساجد',
    import: 'استيراد الملفات',
    export: 'تجهيز التصدير',
    imported: 'تم استيراد ملفات المساجد وحفظها محلياً.',
    exported: 'ملفات المساجد الحالية جاهزة في حقل JSON.',
    invalid: 'حزمة الملفات غير صالحة ولم يتم حفظها.',
  },
} as const;

function readLocale(): Locale {
  try {
    return loadPersistedSettings(getApplicationStorage()).locale;
  } catch {
    return 'en';
  }
}

function readLibrary(): MosqueProfileLibraryState {
  try {
    return loadMosqueProfileLibrary(getApplicationStorage());
  } catch {
    return { profiles: [], selectedProfileId: null };
  }
}

function localizedText(
  value: Readonly<{ en?: string; ar?: string }> | null,
  locale: Locale,
): string | null {
  if (value === null) return null;
  return locale === 'ar' ? (value.ar ?? value.en ?? null) : (value.en ?? value.ar ?? null);
}

export function MosqueProfilesPanel() {
  const [locale, setLocale] = useState<Locale>(readLocale);
  const [library, setLibrary] = useState<MosqueProfileLibraryState>(readLibrary);
  const [payload, setPayload] = useState('');
  const [message, setMessage] = useState<'imported' | 'exported' | 'invalid' | null>(null);
  const text = copy[locale];
  const selectedProfile = useMemo(
    () => library.profiles.find((profile) => profile.id === library.selectedProfileId) ?? null,
    [library],
  );

  useEffect(() => {
    const refresh = () => {
      setLocale(readLocale());
      setLibrary(readLibrary());
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    window.addEventListener('focus', refresh);
    window.addEventListener(MOSQUE_PROFILE_LIBRARY_CHANGE_EVENT, refresh);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener(MOSQUE_PROFILE_LIBRARY_CHANGE_EVENT, refresh);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, []);

  if (smartDisplayModeRequested(window.location.search)) return null;

  const persist = (next: MosqueProfileLibraryState) => {
    saveMosqueProfileLibrary(getApplicationStorage(), next);
    setLibrary(next);
    window.dispatchEvent(new Event(MOSQUE_PROFILE_LIBRARY_CHANGE_EVENT));
  };

  const importProfiles = () => {
    try {
      const parsed = parseMosqueProfileLibrary(payload);
      persist(parsed);
      setMessage('imported');
    } catch {
      setMessage('invalid');
    }
  };

  const prepareExport = () => {
    setPayload(serializeMosqueProfileLibrary(library));
    setMessage('exported');
  };

  return (
    <section
      className="mosque-profiles-panel"
      aria-labelledby="mosque-profiles-title"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      <header className="mosque-profiles-panel__heading">
        <div>
          <p className="mosque-profiles-panel__eyebrow">SalahOS</p>
          <h2 id="mosque-profiles-title">{text.title}</h2>
        </div>
        <p>{text.subtitle}</p>
      </header>

      <div className="mosque-profiles-panel__selection" role="list" aria-label={text.title}>
        <button
          type="button"
          className="mosque-profile-choice"
          aria-pressed={library.selectedProfileId === null}
          onClick={() => {
            persist(selectMosqueProfile(library, null));
          }}
        >
          <strong>{text.none}</strong>
          {library.selectedProfileId === null && <span>{text.selected}</span>}
        </button>
        {library.profiles.map((profile) => {
          const selected = profile.id === library.selectedProfileId;
          return (
            <article className="mosque-profile-choice mosque-profile-choice--profile" key={profile.id}>
              <div>
                <strong>{localizedText(profile.name, locale)}</strong>
                <small>{profile.address.formatted}</small>
              </div>
              <div className="mosque-profile-choice__actions">
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    persist(selectMosqueProfile(library, profile.id));
                  }}
                >
                  {selected ? text.selected : text.select}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    persist(removeMosqueProfile(library, profile.id));
                  }}
                >
                  {text.remove}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {library.profiles.length === 0 && <p className="mosque-profiles-panel__empty">{text.noProfiles}</p>}

      {selectedProfile !== null && (
        <article className="mosque-profile-details">
          <div>
            <h3>{localizedText(selectedProfile.name, locale)}</h3>
            {localizedText(selectedProfile.description, locale) !== null && (
              <p>{localizedText(selectedProfile.description, locale)}</p>
            )}
          </div>
          <dl>
            <div>
              <dt>{text.address}</dt>
              <dd>{selectedProfile.address.formatted}</dd>
            </div>
            <div>
              <dt>{text.timezone}</dt>
              <dd dir="ltr">{selectedProfile.timeZone}</dd>
            </div>
            <div>
              <dt>{text.facilities}</dt>
              <dd>{selectedProfile.facilities.length === 0 ? '—' : selectedProfile.facilities.join(', ')}</dd>
            </div>
            <div>
              <dt>{text.contact}</dt>
              <dd>{selectedProfile.contact.email ?? selectedProfile.contact.phone ?? '—'}</dd>
            </div>
          </dl>
        </article>
      )}

      <details className="mosque-profiles-panel__manage">
        <summary>{text.manage}</summary>
        <p>{text.manageHelp}</p>
        <label>
          <span>{text.payload}</span>
          <textarea
            value={payload}
            onChange={(event) => {
              setPayload(event.target.value);
            }}
            rows={8}
          />
        </label>
        <div className="mosque-profiles-panel__manage-actions">
          <button type="button" onClick={importProfiles}>
            {text.import}
          </button>
          <button type="button" onClick={prepareExport}>
            {text.export}
          </button>
        </div>
        {message !== null && (
          <p className="mosque-profiles-panel__message" role="status">
            {text[message]}
          </p>
        )}
      </details>
    </section>
  );
}
