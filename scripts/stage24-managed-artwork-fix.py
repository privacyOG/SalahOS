from pathlib import Path


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text()
    if old not in text:
        raise SystemExit(f'missing {label}')
    path.write_text(text.replace(old, new, 1))


template_path = Path('src/domain/prayerBoardTemplate.ts')
replace_once(
    template_path,
    "const LOCALES = new Set<Locale>(PRAYER_BOARD_LOCALES);",
    """const LOCALES = new Set<Locale>(PRAYER_BOARD_LOCALES);
const BUILTIN_ARTWORK_IDS = new Set<PrayerBoardArtworkId>(
  prayerBoardTemplateRegistry.map((template) => template.fallbackArtworkId),
);""",
    'artwork allowlist insertion point',
)
replace_once(
    template_path,
    """function normalizeBackground(
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
}""",
    """function normalizeBackground(
  value: unknown,
  templateId: PrayerBoardTemplateId,
): PrayerBoardBackground {
  if (!isRecord(value)) return builtinBackground(templateId);
  if (value.kind === 'builtin') {
    const artworkId = value.artworkId;
    return typeof artworkId === 'string' && BUILTIN_ARTWORK_IDS.has(artworkId as PrayerBoardArtworkId)
      ? Object.freeze({ kind: 'builtin', artworkId: artworkId as PrayerBoardArtworkId })
      : builtinBackground(templateId);
  }
  if (value.kind !== 'local-image') return builtinBackground(templateId);
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
}""",
    'background normalization block',
)

protocol_path = Path('src/domain/managedAdminProtocol.ts')
replace_once(
    protocol_path,
    """export function createManagedPrayerBoardAssignmentConfig(
  input: PrayerBoardTemplateConfig,
): PrayerBoardTemplateConfig {
  const normalized = parsePrayerBoardTemplateConfig(input);
  const fallbackArtworkId = getPrayerBoardTemplate(normalized.templateId).fallbackArtworkId;
  return parsePrayerBoardTemplateConfig({
    ...normalized,
    branding: {
      mosqueName: normalized.branding.mosqueName,
      logo: null,
    },
    background: {
      kind: 'builtin',
      artworkId: fallbackArtworkId,
    },
  });
}""",
    """export function createManagedPrayerBoardAssignmentConfig(
  input: PrayerBoardTemplateConfig,
): PrayerBoardTemplateConfig {
  const normalized = parsePrayerBoardTemplateConfig(input);
  const fallbackArtworkId = getPrayerBoardTemplate(normalized.templateId).fallbackArtworkId;
  const managedBackground =
    normalized.background.kind === 'builtin'
      ? normalized.background
      : { kind: 'builtin' as const, artworkId: fallbackArtworkId };
  return parsePrayerBoardTemplateConfig({
    ...normalized,
    branding: {
      mosqueName: normalized.branding.mosqueName,
      logo: null,
    },
    background: managedBackground,
  });
}""",
    'managed assignment block',
)

test_path = Path('src/domain/prayerBoardTemplate.test.ts')
marker = "  it('rejects remote-looking image identifiers from imported configuration', () => {"
addition = """  it('preserves allowlisted built-in artwork and rejects unknown built-in artwork', () => {
    const selected = parsePrayerBoardTemplateConfig({
      version: 1,
      templateId: 'scenic-spiritual',
      background: { kind: 'builtin', artworkId: 'geometric-heritage' },
    });
    expect(selected.background).toEqual({ kind: 'builtin', artworkId: 'geometric-heritage' });

    const unknown = parsePrayerBoardTemplateConfig({
      version: 1,
      templateId: 'scenic-spiritual',
      background: { kind: 'builtin', artworkId: 'remote-artwork' },
    });
    expect(unknown.background).toEqual({ kind: 'builtin', artworkId: 'scenic-gradient' });
  });

"""
replace_once(test_path, marker, addition + marker, 'template test insertion point')

Path('src/domain/managedAdminProtocol.stage24.test.ts').write_text("""import { describe, expect, it } from 'vitest';

import { createManagedPrayerBoardAssignmentConfig } from './managedAdminProtocol';
import { parsePrayerBoardTemplateConfig } from './prayerBoardTemplate';

describe('managed prayer-board presentation media', () => {
  it('preserves allowlisted built-in artwork while removing device-local logo media', () => {
    const config = parsePrayerBoardTemplateConfig({
      version: 1,
      templateId: 'scenic-spiritual',
      background: { kind: 'builtin', artworkId: 'geometric-heritage' },
      branding: {
        mosqueName: { en: 'Example Masjid' },
        logo: {
          assetId: 'logo-1',
          mimeType: 'image/png',
          byteSize: 4096,
          width: 256,
          height: 256,
        },
      },
    });

    const managed = createManagedPrayerBoardAssignmentConfig(config);
    expect(managed.background).toEqual({ kind: 'builtin', artworkId: 'geometric-heritage' });
    expect(managed.branding).toEqual({ mosqueName: { en: 'Example Masjid' }, logo: null });
  });

  it('replaces device-local background media with the selected template fallback', () => {
    const config = parsePrayerBoardTemplateConfig({
      version: 1,
      templateId: 'scenic-spiritual',
      background: {
        kind: 'local-image',
        asset: {
          assetId: 'background-1',
          mimeType: 'image/webp',
          byteSize: 200000,
          width: 1920,
          height: 1080,
        },
        focalPoint: { x: 0.5, y: 0.5 },
      },
    });

    const managed = createManagedPrayerBoardAssignmentConfig(config);
    expect(managed.background).toEqual({ kind: 'builtin', artworkId: 'scenic-gradient' });
  });
});
""")
