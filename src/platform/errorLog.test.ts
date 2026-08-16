import { describe, expect, it } from 'vitest';
import { createStructuredErrorLogger } from './errorLog';
import type { StructuredErrorEvent, StructuredErrorSink } from './errorLog';

describe('createStructuredErrorLogger', () => {
  it('emits a fixed structured event for invalid system time', () => {
    const events: StructuredErrorEvent[] = [];
    const sink: StructuredErrorSink = { write: (event) => events.push(event) };

    createStructuredErrorLogger(sink).log('invalid-system-time');

    expect(events).toEqual([
      { component: 'runtime-clock', code: 'invalid-system-time', severity: 'error' },
    ]);
  });

  it('emits a fixed structured event for calculation failure', () => {
    const events: StructuredErrorEvent[] = [];
    const sink: StructuredErrorSink = { write: (event) => events.push(event) };

    createStructuredErrorLogger(sink).log('prayer-calculation-unavailable');

    expect(events).toEqual([
      {
        component: 'prayer-calculation',
        code: 'prayer-calculation-unavailable',
        severity: 'error',
      },
    ]);
  });

  it('classifies notification scheduling failure separately from prayer calculation', () => {
    const events: StructuredErrorEvent[] = [];
    const sink: StructuredErrorSink = { write: (event) => events.push(event) };

    createStructuredErrorLogger(sink).log('notification-scheduling-unavailable');

    expect(events).toEqual([
      {
        component: 'notification-scheduling',
        code: 'notification-scheduling-unavailable',
        severity: 'error',
      },
    ]);
  });

  it('exposes no field for coordinates, location labels, mosque names or raw exception data', () => {
    const events: StructuredErrorEvent[] = [];
    const sink: StructuredErrorSink = { write: (event) => events.push(event) };
    const logger = createStructuredErrorLogger(sink);

    logger.log('prayer-calculation-unavailable');

    const serialized = JSON.stringify(events[0]);
    expect(serialized).not.toContain('latitude');
    expect(serialized).not.toContain('longitude');
    expect(serialized).not.toContain('location');
    expect(serialized).not.toContain('mosque');
    expect(serialized).not.toContain('message');
    expect(serialized).not.toContain('stack');
    expect(Object.keys(events[0] ?? {}).sort()).toEqual(['code', 'component', 'severity']);
  });
});
