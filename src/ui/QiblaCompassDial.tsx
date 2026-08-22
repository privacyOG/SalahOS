import { normalizeBearing } from '../domain/qiblaGuidance';

interface QiblaCompassDialProps {
  readonly bearingDegrees: number;
  readonly headingDegrees: number | null;
  readonly aligned: boolean;
  readonly label: string;
}

const ticks = Array.from({ length: 72 }, (_, index) => index * 5);
const degreeLabels = Array.from({ length: 12 }, (_, index) => index * 30);
const cardinals = [
  { label: 'N', degrees: 0 },
  { label: 'E', degrees: 90 },
  { label: 'S', degrees: 180 },
  { label: 'W', degrees: 270 },
] as const;
const intercardinals = [
  { label: 'NE', degrees: 45 },
  { label: 'SE', degrees: 135 },
  { label: 'SW', degrees: 225 },
  { label: 'NW', degrees: 315 },
] as const;

export function QiblaCompassDial({
  bearingDegrees,
  headingDegrees,
  aligned,
  label,
}: QiblaCompassDialProps) {
  const dialRotation = headingDegrees === null ? 0 : -normalizeBearing(headingDegrees);

  return (
    <div className={`qibla-compass-dial${aligned ? ' is-aligned' : ''}`} aria-label={label}>
      <svg viewBox="0 0 400 400" role="img" aria-label={label}>
        <circle className="qibla-dial-bezel" cx="200" cy="200" r="194" />
        <circle className="qibla-dial-face" cx="200" cy="200" r="184" />
        <circle className="qibla-dial-inner-ring" cx="200" cy="200" r="137" />
        <g
          className="qibla-dial-rotating"
          style={{ transform: `rotate(${String(dialRotation)}deg)` }}
        >
          {ticks.map((degrees) => {
            const major = degrees % 30 === 0;
            const medium = !major && degrees % 10 === 0;
            return (
              <line
                key={degrees}
                className={
                  major
                    ? 'qibla-tick qibla-tick-major'
                    : medium
                      ? 'qibla-tick qibla-tick-medium'
                      : 'qibla-tick'
                }
                x1="200"
                y1="17"
                x2="200"
                y2={major ? '38' : medium ? '32' : '27'}
                transform={`rotate(${String(degrees)} 200 200)`}
              />
            );
          })}

          {degreeLabels.map((degrees) => {
            const radians = ((degrees - 90) * Math.PI) / 180;
            const x = 200 + Math.cos(radians) * 151;
            const y = 200 + Math.sin(radians) * 151;
            return (
              <text
                key={degrees}
                className="qibla-degree-label"
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${String(degrees)} ${String(x)} ${String(y)})`}
              >
                {degrees}
              </text>
            );
          })}

          {cardinals.map(({ label: cardinal, degrees }) => {
            const radians = ((degrees - 90) * Math.PI) / 180;
            const x = 200 + Math.cos(radians) * 112;
            const y = 200 + Math.sin(radians) * 112;
            return (
              <text
                key={cardinal}
                className="qibla-cardinal-label"
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${String(degrees)} ${String(x)} ${String(y)})`}
              >
                {cardinal}
              </text>
            );
          })}

          {intercardinals.map(({ label: cardinal, degrees }) => {
            const radians = ((degrees - 90) * Math.PI) / 180;
            const x = 200 + Math.cos(radians) * 116;
            const y = 200 + Math.sin(radians) * 116;
            return (
              <text
                key={cardinal}
                className="qibla-intercardinal-label"
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${String(degrees)} ${String(x)} ${String(y)})`}
              >
                {cardinal}
              </text>
            );
          })}

          <g
            className="qibla-bearing-arrow"
            transform={`rotate(${String(bearingDegrees)} 200 200)`}
            aria-hidden="true"
          >
            <path d="M 193 201 L 200 66 L 207 201 L 200 185 Z" />
            <circle cx="200" cy="200" r="8" />
          </g>

          <g
            className="qibla-kaaba-marker"
            transform={`rotate(${String(bearingDegrees)} 200 200) translate(200 42)`}
          >
            <rect x="-18" y="-18" width="36" height="36" rx="4" />
            <rect className="qibla-kaaba-band" x="-18" y="-5" width="36" height="6" />
            <path className="qibla-kaaba-roof" d="M -18 -18 L 0 -28 L 18 -18 L 0 -10 Z" />
          </g>
        </g>

        <g className="qibla-device-needle" aria-hidden="true">
          <path className="qibla-needle-tail" d="M 190 205 L 200 318 L 210 205 Z" />
          <path className="qibla-needle-head" d="M 188 195 L 200 72 L 212 195 Z" />
          <circle className="qibla-needle-hub" cx="200" cy="200" r="22" />
          <circle className="qibla-needle-hub-inner" cx="200" cy="200" r="13" />
        </g>

        <g className="qibla-heading-index" aria-hidden="true">
          <path d="M 190 8 L 200 25 L 210 8 Z" />
          <line x1="200" y1="25" x2="200" y2="40" />
        </g>
      </svg>
    </div>
  );
}
