import type { LocalClockParts, PrayerDashboardModel } from './dashboard';
import type { JumuahSession, PrayerSourceMode } from './mosqueTimetable';
import type { ObligatoryPrayerName, PrayerName } from './prayerEngine';
import type { SourcedPrayerDashboard } from './sourcedDashboard';
import type { Locale } from '../i18n/translations';

export const PRAYER_BOARD_TEMPLATE_CONFIG_VERSION = 1 as const;
export const PRAYER_BOARD_DATA_VERSION = 1 as const;

export type PrayerBoardTemplateId =
  | 'heritage-classic'
  | 'minimal-modern'
  | 'bold-countdown-focus'
  | 'structured-split-board'
  | 'scenic-spiritual'
  | 'family-classroom';

export type PrayerBoardModuleId =
  | 'current-time'
  | 'dates'
  | 'next-prayer'
  | 'countdown'
  | 'prayer-timetable'
  | 'jumuah'
  | 'sunrise-sunset'
  | 'mosque-branding'
  | 'announcements'
  | 'weather';

export type PrayerBoardTimeFormat = 'h12' | 'h23';
export type PrayerBoardLanguageMode = 'single' | 'en-ar';
export type PrayerBoardAccentPreset = 'emerald' | 'midnight' | 'sandstone' | 'neutral' | 'jewel';
export type PrayerBoardImageMimeType = 'image/png' | 'image/jpeg' | 'image/webp';
export type PrayerBoardArtworkId =
  | 'geometric-heritage'
  | 'quiet-grid'
  | 'countdown-field'
  | 'structured-lines'
  | 'scenic-gradient'
  | 'classroom-pattern';

export const PRAYER_BOARD_CORE_MODULES: readonly PrayerBoardModuleId[] = Object.freeze([
  'current-time',
  'next-prayer',
  'countdown',
  'prayer-timetable',
]);

export const PRAYER_BOARD_ALL_MODULES: readonly PrayerBoardModuleId[] = Object.freeze([
  'current-time',
  'dates',
  'next-prayer',
  'countdown',
  'prayer-timetable',
  'jumuah',
  'sunrise-sunset',
  'mosque-branding',
  'announcements',
  'weather',
]);

export const PRAYER_BOARD_LOCALES: readonly Locale[] = Object.freeze(['en', 'ar', 'tr', 'id']);

export interface PrayerBoardTemplateDefinition {
  readonly id: PrayerBoardTemplateId;
  readonly version: 1;
  readonly label: string;
  readonly supportedLocales: readonly Locale[];
  readonly supportsEnglishArabicBilingual: boolean;
  readonly supportedModules: readonly PrayerBoardModuleId[];
  readonly defaultVisibleModules: readonly PrayerBoardModuleId[];
  readonly fallbackArtworkId: PrayerBoardArtworkId;
}

const ALL_MODULES = PRAYER_BOARD_ALL_MODULES;
const COMMON_VISIBLE_MODULES: readonly PrayerBoardModuleId[] = Object.freeze([
  'current-time',
  'dates',
  'next-prayer',
  'countdown',
  'prayer-timetable',
  'jumuah',
  'sunrise-sunset',
  'mosque-branding',
  'announcements',
]);

function definition(
  id: PrayerBoardTemplateId,
  label: string,
  fallbackArtworkId: PrayerBoardArtworkId,
): PrayerBoardTemplateDefinition {
  return Object.freeze({
    id,
    version: PRAYER_BOARD_TEMPLATE_CONFIG_VERSION,
    label,
    supportedLocales: PRAYER_BOARD_LOCALES,
    supportsEnglishArabicBilingual: true,
    supportedModules: ALL_MODULES,
    defaultVisibleModules: COMMON_VISIBLE_MODULES,
    fallbackArtworkId,
  });
}

export const prayerBoardTemplateRegistry: readonly PrayerBoardTemplateDefinition[] = Object.freeze([
  definition('heritage-classic', 'Heritage Classic', 'geometric-heritage'),
  definition('minimal-modern', 'Minimal Modern', 'quiet-grid'),
  definition('bold-countdown-focus', 'Bold Countdown Focus', 'countdown-field'),
  definition('structured-split-board', 'Structured Split Board', 'structured-lines'),
  definition('scenic-spiritual', 'Scenic Spiritual', 'scenic-gradient'),
  definition('family-classroom', 'Family & Classroom', 'classroom-pattern'),
]);

const TEMPLATE_BY_ID = new Map(
  prayerBoardTemplateRegistry.map((template) => [template.id, template] as const),
);
const ACCENT_PRESETS = new Set<PrayerBoardAccentPreset>([
  'emerald',
  'midnight',
  'sandstone',
  'neutral',
  'jewel',
]);
const LOCALES = new Set<Locale>(PRAYER_BOARD_LOCALES);

export interface PrayerBoardImageAsset {
  readonly assetId: string;
  readonly mimeType: PrayerBoardImageMimeType;
  readonly byteSize: number;
  readonly width: number;
  readonly height: number;
}

export interface PrayerBoardFocalPoint {
  readonly x: number;
  readonly y: number;
}

export type PrayerBoardBackground =
  | Readonly<{
      kind: 'builtin';
      artworkId: PrayerBoardArtworkId;
    }>
  | Readonly<{
      kind: 'local-image';
      asset: PrayerBoardImageAsset;
      crop: 'cover';
      focalPoint: PrayerBoardFocalPoint;
      contrastScrim: 'auto';
    }>;

export interface PrayerBoardBranding {
  readonly mosqueName: Readonly<Partial<Record<Locale, string>>> | null;
  readonly logo: PrayerBoardImageAsset | null;
}

export interface PrayerBoardTemplateConfig {
  readonly version: 1;
  readonly templateId: PrayerBoardTemplateId;
  readonly primaryLocale: Locale;
  readonly languageMode: PrayerBoardLanguageMode;
  readonly timeFormat: PrayerBoardTimeFormat;
  readonly accentPreset: PrayerBoardAccentPreset;
  readonly moduleVisibility: Readonly<Record<PrayerBoardModuleId, boolean>>;
  readonly branding: PrayerBoardBranding;
  readonly background: PrayerBoardBackground;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseTemplateId(value: unknown): PrayerBoardTemplateId {
  return typeof value === 'string' && TEMPLATE_BY_ID.has(value as PrayerBoardTemplateId)
    ? (value as PrayerBoardTemplateId)
    : 'heritage-classic';
}

function parseLocale(value: unknown): Locale {
  return typeof value === 'string' && LOCALES.has(value as Locale) ? (value as Locale) : 'en';
}

function parseLanguageMode(value: unknown): PrayerBoardLanguageMode {
  return value === 'en-ar' ? 'en-ar' : 'single';
}

function parseTimeFormat(value: unknown): PrayerBoardTimeFormat {
  return value === 'h12' ? 'h12' : 'h23';
}

function parseAccentPreset(value: unknown): PrayerBoardAccentPreset {
  return typeof value === 'string' && ACCENT_PRESETS.has(value as PrayerBoardAccentPreset)
    ? (value as PrayerBoardAccentPreset)
    : 'emerald';
}

function normalizeAsset(value: unknown): PrayerBoardImageAsset | null {
  if (!isRecord(value)) return null;
  const assetId = typeof value.assetId === 'string' ? value.assetId.trim() : '';
  const mimeType = value.mimeType;
  const byteSize = Number(value.byteSize);
  const width = Number(value.width);
  const height = Number(value.height);
  if (
    assetId.length < 1 ||
    assetId.length > 160 ||
    !/^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(assetId) ||
    !['image/png', 'image/jpeg', 'image/webp'].includes(String(mimeType)) ||
    !Number.isInteger(byteSize) ||
    byteSize < 1 ||
    byteSize > 25_000_000 ||
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1 ||
    width > 8192 ||
    height > 8192
  ) {
    return null;
  }
  return Object.freeze({
    assetId,
    mimeType: mimeType as PrayerBoardImageMimeType,
    byteSize,
    width,
    height,
  });
}

function normalizeLocalizedMosqueName(
  value: unknown,
): Readonly<Partial<Record<Locale, string>>> | null {
  if (!isRecord(value)) return null;
  const output: Partial<Record<Locale, string>> = {};
  for (const locale of PRAYER_BOARD_LOCALES) {
    const raw = value[locale];
    if (typeof raw !== 'string') continue;
    const text = raw.trim().replace(/\s+/gu, ' ');
    if (text.length > 0 && text.length <= 160) output[locale] = text;
  }
  return Object.keys(output).length === 0 ? null : Object.freeze(output);
}

function normalizeBranding(value: unknown): PrayerBoardBranding {
  if (!isRecord(value)) return Object.freeze({ mosqueName: null, logo: null });
  return Object.freeze({
    mosqueName: normalizeLocalizedMosqueName(value.mosqueName),
    logo: normalizeAsset(value.logo),
  });
}

function normalizeFocalCoordinate(value: unknown, fallback: number): number {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 1 ? number : fallback;
}

function builtinBackground(templateId: PrayerBoardTemplateId): PrayerBoardBackground {
  const definition = TEMPLATE_BY_ID.get(templateId);
  if (definition === undefined) throw new Error(`Missing prayer-board template: ${templateId}`);
  return Object.freeze({ kind: 'builtin', artworkId: definition.fallbackArtworkId });
}

function normalizeBackground(
  value: unknown,
  templateId: PrayerBoardTemplateId,
): PrayerBoardBackground {
  if (!isRecord(value) || value.kind !== 'local-image') return builtinBackground(templateId);
  const asset = normalizeAsset(value.asset);
  if (asset === null) return builtinBackground(templateId);
  const focalPoint = isRecord(value.focalPoint) ? value.focalPoint : {};
  return Object.freeze({
    kind: 'local-image',
    asset,
    crop: 'cover',
    focalPoint: Object.freeze({
      x: normalizeFocalCoordinate(focalPoint.x, 0.5),
      y: normalizeFocalCoordinate(focalPoint.y, 0.5),
    }),
    contrastScrim: 'auto',
  });
}

function normalizeModuleVisibility(
  value: unknown,
  template: PrayerBoardTemplateDefinition,
): Readonly<Record<PrayerBoardModuleId, boolean>> {
  const requested = isRecord(value) ? value : {};
  const defaults = new Set(template.defaultVisibleModules);
  const supported = new Set(template.supportedModules);
  const required = new Set(PRAYER_BOARD_CORE_MODULES);
  const result = {} as Record<PrayerBoardModuleId, boolean>;
  for (const moduleId of PRAYER_BOARD_ALL_MODULES) {
    const enabled =
      required.has(moduleId) ||
      (supported.has(moduleId) &&
        (typeof requested[moduleId] === 'boolean'
          ? requested[moduleId]
          : defaults.has(moduleId)));
    result[moduleId] = enabled;
  }
  return Object.freeze(result);
}

export function getPrayerBoardTemplate(id: PrayerBoardTemplateId): PrayerBoardTemplateDefinition {
  const template = TEMPLATE_BY_ID.get(id);
  if (template === undefined) throw new Error(`Unknown prayer-board template: ${id}`);
  return template;
}

export function parsePrayerBoardTemplateConfig(value: unknown): PrayerBoardTemplateConfig {
  const source =
    isRecord(value) && value.version === PRAYER_BOARD_TEMPLATE_CONFIG_VERSION ? value : {};
  const templateId = parseTemplateId(source.templateId);
  const template = getPrayerBoardTemplate(templateId);
  const primaryLocale = parseLocale(source.primaryLocale);
  const requestedLanguageMode = parseLanguageMode(source.languageMode);
  const languageMode =
    requestedLanguageMode === 'en-ar' && template.supportsEnglishArabicBilingual
      ? 'en-ar'
      : 'single';

  return Object.freeze({
    version: PRAYER_BOARD_TEMPLATE_CONFIG_VERSION,
    templateId,
    primaryLocale,
    languageMode,
    timeFormat: parseTimeFormat(source.timeFormat),
    accentPreset: parseAccentPreset(source.accentPreset),
    moduleVisibility: normalizeModuleVisibility(source.moduleVisibility, template),
    branding: normalizeBranding(source.branding),
    background: normalizeBackground(source.background, templateId),
  });
}

export const defaultPrayerBoardTemplateConfig: PrayerBoardTemplateConfig =
  parsePrayerBoardTemplateConfig({
    version: PRAYER_BOARD_TEMPLATE_CONFIG_VERSION,
    templateId: 'heritage-classic',
    primaryLocale: 'en',
    languageMode: 'single',
    timeFormat: 'h23',
    accentPreset: 'emerald',
  });

export interface PrayerBoardPrayerRow {
  readonly name: PrayerName;
  readonly startLocalMinutes: number | null;
  readonly iqamahLocalMinutes: number | null;
  readonly source: PrayerSourceMode;
  readonly available: boolean;
  readonly isCurrent: boolean;
  readonly isNext: boolean;
}

export interface PrayerBoardNextPrayer {
  readonly name: ObligatoryPrayerName;
  readonly dayOffset: 0 | 1;
  readonly startLocalMinutes: number;
  readonly iqamahLocalMinutes: number | null;
  readonly secondsUntil: number;
}

export interface PrayerBoardAnnouncement {
  readonly id: string;
  readonly title: string;
  readonly body: string | null;
  readonly expiresAtIso: string | null;
}

export type PrayerBoardWeatherState = 'loading' | 'ready' | 'stale' | 'error';

export interface PrayerBoardWeatherSnapshot {
  readonly state: PrayerBoardWeatherState;
  readonly temperatureC: number | null;
  readonly summary: string | null;
  readonly observedAtIso: string | null;
}

export interface PrayerBoardData {
  readonly version: 1;
  readonly generatedAtIso: string;
  readonly clock: LocalClockParts;
  readonly civilDateIso: string;
  readonly gregorian: PrayerDashboardModel['gregorian'];
  readonly hijri: PrayerDashboardModel['hijri'];
  readonly timeZone: string;
  readonly sourceMode: PrayerSourceMode;
  readonly mosqueName: string | null;
  readonly prayers: readonly PrayerBoardPrayerRow[];
  readonly currentPrayer: ObligatoryPrayerName | null;
  readonly nextPrayer: PrayerBoardNextPrayer | null;
  readonly solarEvents: Readonly<{
    sunriseLocalMinutes: number | null;
    sunsetLocalMinutes: number | null;
  }>;
  readonly jumuahSessions: readonly JumuahSession[];
  readonly offline: boolean;
  readonly stale: boolean;
  readonly announcements: readonly PrayerBoardAnnouncement[];
  readonly weather: PrayerBoardWeatherSnapshot | null;
}

function civilDateIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function normalizeAnnouncement(value: PrayerBoardAnnouncement): PrayerBoardAnnouncement {
  const id = value.id.trim();
  const title = value.title.trim();
  if (id.length < 1 || id.length > 160 || title.length < 1 || title.length > 240) {
    throw new TypeError('Prayer-board announcement id/title is invalid');
  }
  const body = value.body === null ? null : value.body.trim().slice(0, 2_000) || null;
  const expiresAtIso = value.expiresAtIso;
  if (expiresAtIso !== null && !Number.isFinite(Date.parse(expiresAtIso))) {
    throw new TypeError('Prayer-board announcement expiry must be an ISO date-time');
  }
  return Object.freeze({ id, title, body, expiresAtIso });
}

function normalizeWeather(
  value: PrayerBoardWeatherSnapshot | null | undefined,
): PrayerBoardWeatherSnapshot | null {
  if (value === null || value === undefined) return null;
  const temperatureC =
    value.temperatureC !== null && Number.isFinite(value.temperatureC) ? value.temperatureC : null;
  const summary = value.summary === null ? null : value.summary.trim().slice(0, 160) || null;
  const observedAtIso =
    value.observedAtIso !== null && Number.isFinite(Date.parse(value.observedAtIso))
      ? value.observedAtIso
      : null;
  return Object.freeze({ state: value.state, temperatureC, summary, observedAtIso });
}

export function buildPrayerBoardData(
  input: Readonly<{
    dashboard: SourcedPrayerDashboard;
    offline?: boolean;
    stale?: boolean;
    announcements?: readonly PrayerBoardAnnouncement[];
    weather?: PrayerBoardWeatherSnapshot | null;
  }>,
): PrayerBoardData {
  const prayers = input.dashboard.prayers.map((prayer): PrayerBoardPrayerRow =>
    Object.freeze({
      name: prayer.name,
      startLocalMinutes: prayer.localMinutes,
      iqamahLocalMinutes: prayer.iqamahLocalMinutes,
      source: prayer.source,
      available: prayer.available,
      isCurrent: prayer.isCurrent,
      isNext: prayer.isNext,
    }),
  );
  const nextPrayerRow =
    input.dashboard.nextPrayer === null
      ? undefined
      : prayers.find((prayer) => prayer.name === input.dashboard.nextPrayer);
  const nextPrayer =
    input.dashboard.nextPrayer === null ||
    input.dashboard.nextPrayerDayOffset === null ||
    input.dashboard.nextPrayerLocalMinutes === null ||
    input.dashboard.secondsUntilNextPrayer === null
      ? null
      : Object.freeze({
          name: input.dashboard.nextPrayer,
          dayOffset: input.dashboard.nextPrayerDayOffset,
          startLocalMinutes: input.dashboard.nextPrayerLocalMinutes,
          iqamahLocalMinutes:
            input.dashboard.nextPrayerDayOffset === 0
              ? (nextPrayerRow?.iqamahLocalMinutes ?? null)
              : null,
          secondsUntil: input.dashboard.secondsUntilNextPrayer,
        });
  const announcements = (input.announcements ?? []).map(normalizeAnnouncement);

  return Object.freeze({
    version: PRAYER_BOARD_DATA_VERSION,
    generatedAtIso: input.dashboard.base.generatedAt.toISOString(),
    clock: Object.freeze({ ...input.dashboard.base.clock }),
    civilDateIso: civilDateIso(input.dashboard.base.civilDate),
    gregorian: Object.freeze({ ...input.dashboard.base.gregorian }),
    hijri: Object.freeze({ ...input.dashboard.base.hijri }),
    timeZone: input.dashboard.base.timeZone,
    sourceMode: input.dashboard.sourceMode,
    mosqueName: input.dashboard.mosqueName,
    prayers: Object.freeze(prayers),
    currentPrayer: input.dashboard.currentPrayer,
    nextPrayer,
    solarEvents: Object.freeze({
      sunriseLocalMinutes: input.dashboard.base.today.prayers.sunrise.rawLocalMinutes,
      sunsetLocalMinutes: input.dashboard.base.today.prayers.maghrib.rawLocalMinutes,
    }),
    jumuahSessions: Object.freeze(
      input.dashboard.jumuahSessions.map((session) => Object.freeze({ ...session })),
    ),
    offline: input.offline ?? false,
    stale: input.stale ?? false,
    announcements: Object.freeze(announcements),
    weather: normalizeWeather(input.weather),
  });
}
