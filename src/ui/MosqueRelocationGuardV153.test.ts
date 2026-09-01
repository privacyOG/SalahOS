import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const todaySource = fs.readFileSync(path.resolve('src/ui/TodayScreen.tsx'), 'utf8');
const directorySource = fs.readFileSync(
  path.resolve('src/domain/australianMosqueDirectory.ts'),
  'utf8',
);

describe('v1.5.3 selected-mosque relocation guard', () => {
  it('separates mosque context from calculation-location adoption', () => {
    expect(todaySource).toContain('MOSQUE_LOCATION_ADOPTION_THRESHOLD_KILOMETERS');
    expect(todaySource).toContain('selectedMosqueDistanceKilometers');
    expect(todaySource).toContain('directoryMosqueLocationAdopted');
    expect(todaySource).toContain('selectedMosqueFarAway');
    expect(todaySource).toContain(
      'applyAustralianMosqueCongregationTimes(sourced, activeDirectoryMosque)',
    );
    expect(todaySource).toContain(
      "data-selected-mosque-distance={selectedMosqueFarAway ? 'far' : 'near'}",
    );
  });

  it('labels far-away selected-mosque distance in every supported UI locale', () => {
    expect(todaySource).toContain("far: 'Far'");
    expect(todaySource).toContain("far: 'بعيد'");
    expect(todaySource).toContain("far: 'Uzak'");
    expect(todaySource).toContain("far: 'Jauh'");
    expect(todaySource).toContain('destinationLabels[locale].far');
  });

  it('reuses the shared domain distance primitive for Australian directory ordering', () => {
    expect(directorySource).toContain(
      "import { greatCircleDistanceKilometers } from './greatCircleDistance';",
    );
    expect(directorySource).toContain('return greatCircleDistanceKilometers(from, mosque);');
  });
});
