import type { MosqueDirectoryResult } from '../domain/mosqueDirectory';

import './mosque-directory-results.css';

interface MosqueDirectoryResultsProps {
  readonly results: readonly MosqueDirectoryResult[];
  readonly onFollowChange?: (mosqueId: string, followed: boolean) => void;
  readonly onOpenMosque?: (mosqueId: string) => void;
}

function displayName(result: MosqueDirectoryResult): string {
  return result.name.en ?? result.name.ar ?? 'Mosque';
}

export function MosqueDirectoryResults({
  results,
  onFollowChange,
  onOpenMosque,
}: MosqueDirectoryResultsProps) {
  if (results.length === 0) {
    return (
      <section className="mosque-directory" aria-label="Mosque search results">
        <p className="mosque-directory__empty">No mosques matched this search.</p>
      </section>
    );
  }

  return (
    <section className="mosque-directory" aria-label="Mosque search results">
      <div className="mosque-directory__list">
        {results.map((result) => (
          <article className="mosque-directory__card" key={result.mosqueId}>
            <button
              className="mosque-directory__primary"
              type="button"
              onClick={() => onOpenMosque?.(result.mosqueId)}
            >
              <span className="mosque-directory__name">{displayName(result)}</span>
              <span>{result.areaLabel}</span>
              <span>{result.addressLabel}</span>
            </button>

            <div className="mosque-directory__meta">
              <span>{result.prayerSourceLabel}</span>
              <span>
                {result.synchronizedAt === null
                  ? 'Not synchronized yet'
                  : `Updated ${result.synchronizedAt}`}
              </span>
            </div>

            <button
              className="mosque-directory__follow"
              type="button"
              aria-pressed={result.followed}
              onClick={() => onFollowChange?.(result.mosqueId, !result.followed)}
            >
              {result.followed ? 'Following' : 'Follow'}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
