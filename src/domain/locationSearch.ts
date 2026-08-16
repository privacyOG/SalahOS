import principalLocations from '../data/ianaPrincipalLocations.json';
import { createCoordinates, type Coordinates } from './coordinates';

interface PrincipalLocationRecord {
  readonly city: string;
  readonly countryCodes: readonly string[];
  readonly timeZone: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly comments: string;
}

export interface LocationSearchResult {
  readonly id: string;
  readonly city: string;
  readonly countryCodes: readonly string[];
  readonly countryNames: readonly string[];
  readonly timeZone: string;
  readonly coordinates: Coordinates;
  readonly comments: string;
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('en')
    .replace(/[_/,-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function displayCountryNames(countryCodes: readonly string[], locale: string): readonly string[] {
  const displayNames = new Intl.DisplayNames([locale], { type: 'region' });
  return countryCodes.map((code) => displayNames.of(code) ?? code);
}

function resultFromRecord(record: PrincipalLocationRecord, locale: string): LocationSearchResult {
  return {
    id: record.timeZone,
    city: record.city,
    countryCodes: record.countryCodes,
    countryNames: displayCountryNames(record.countryCodes, locale),
    timeZone: record.timeZone,
    coordinates: createCoordinates(record.latitude, record.longitude),
    comments: record.comments,
  };
}

function matchScore(record: PrincipalLocationRecord, query: string, locale: string): number | null {
  const city = normalizeSearchText(record.city);
  const timeZone = normalizeSearchText(record.timeZone);
  const comments = normalizeSearchText(record.comments);
  const countryCodes = record.countryCodes.map(normalizeSearchText);
  const countryNames = displayCountryNames(record.countryCodes, locale).map(normalizeSearchText);

  if (city === query) return 0;
  if (city.startsWith(query)) return 1;
  if (city.includes(query)) return 2;
  if (countryNames.some((name) => name === query)) return 3;
  if (countryNames.some((name) => name.startsWith(query))) return 4;
  if (countryNames.some((name) => name.includes(query))) return 5;
  if (countryCodes.some((code) => code === query)) return 6;
  if (timeZone.includes(query)) return 7;
  if (comments.includes(query)) return 8;
  return null;
}

export function searchLocations(
  rawQuery: string,
  options: { readonly locale?: string; readonly limit?: number } = {},
): readonly LocationSearchResult[] {
  const query = normalizeSearchText(rawQuery);
  if (query.length < 2) return [];

  const locale = options.locale ?? 'en';
  const limit = Math.max(1, Math.min(20, Math.trunc(options.limit ?? 8)));

  return (principalLocations as readonly PrincipalLocationRecord[])
    .map((record) => ({ record, score: matchScore(record, query, locale) }))
    .filter(
      (entry): entry is { readonly record: PrincipalLocationRecord; readonly score: number } =>
        entry.score !== null,
    )
    .sort(
      (left, right) =>
        left.score - right.score ||
        left.record.city.localeCompare(right.record.city, locale, { sensitivity: 'base' }),
    )
    .slice(0, limit)
    .map(({ record }) => resultFromRecord(record, locale));
}

export function getLocationSearchCatalogueSize(): number {
  return principalLocations.length;
}
