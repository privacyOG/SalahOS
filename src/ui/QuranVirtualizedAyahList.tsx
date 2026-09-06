import { type ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import type { QuranOfflineSearchResult } from '../domain/quranOfflineLibrary';

export const QURAN_VIRTUAL_ESTIMATED_ROW_HEIGHT = 280;
export const QURAN_VIRTUAL_OVERSCAN_ROWS = 4;

export interface QuranVirtualWindow {
  readonly start: number;
  readonly end: number;
  readonly beforeHeight: number;
  readonly afterHeight: number;
}

function rowHeight(
  items: readonly QuranOfflineSearchResult[],
  index: number,
  measured: ReadonlyMap<string, number>,
): number {
  return measured.get(items[index]?.ayah.key ?? '') ?? QURAN_VIRTUAL_ESTIMATED_ROW_HEIGHT;
}

function offsetBefore(
  items: readonly QuranOfflineSearchResult[],
  index: number,
  measured: ReadonlyMap<string, number>,
): number {
  let offset = 0;
  for (let cursor = 0; cursor < index; cursor += 1) {
    offset += rowHeight(items, cursor, measured);
  }
  return offset;
}

export function quranVirtualWindow(
  items: readonly QuranOfflineSearchResult[],
  scrollTop: number,
  viewportHeight: number,
  measured: ReadonlyMap<string, number> = new Map(),
): QuranVirtualWindow {
  if (items.length === 0) return { start: 0, end: 0, beforeHeight: 0, afterHeight: 0 };
  const safeTop = Math.max(0, scrollTop);
  const safeViewport = Math.max(1, viewportHeight);
  let cursorOffset = 0;
  let firstVisible = 0;
  while (
    firstVisible < items.length - 1 &&
    cursorOffset + rowHeight(items, firstVisible, measured) <= safeTop
  ) {
    cursorOffset += rowHeight(items, firstVisible, measured);
    firstVisible += 1;
  }

  let lastVisible = firstVisible;
  let visibleBottom = cursorOffset;
  while (lastVisible < items.length && visibleBottom < safeTop + safeViewport) {
    visibleBottom += rowHeight(items, lastVisible, measured);
    lastVisible += 1;
  }

  const start = Math.max(0, firstVisible - QURAN_VIRTUAL_OVERSCAN_ROWS);
  const end = Math.min(items.length, lastVisible + QURAN_VIRTUAL_OVERSCAN_ROWS);
  const beforeHeight = offsetBefore(items, start, measured);
  let afterHeight = 0;
  for (let index = end; index < items.length; index += 1) {
    afterHeight += rowHeight(items, index, measured);
  }
  return { start, end, beforeHeight, afterHeight };
}

export function QuranVirtualizedAyahList(
  props: Readonly<{
    items: readonly QuranOfflineSearchResult[];
    surahNumber: number;
    initialScrollTop: number;
    targetAyahKey: string | null;
    ariaLabel: string;
    onScrollTopChange: (scrollTop: number) => void;
    renderItem: (result: QuranOfflineSearchResult) => ReactNode;
  }>,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const measuredHeightsRef = useRef(new Map<string, number>());
  const [scrollTop, setScrollTop] = useState(props.initialScrollTop);
  const [viewportHeight, setViewportHeight] = useState(720);
  const [measurementVersion, setMeasurementVersion] = useState(0);

  const window = useMemo(
    () => quranVirtualWindow(props.items, scrollTop, viewportHeight, measuredHeightsRef.current),
    [measurementVersion, props.items, scrollTop, viewportHeight],
  );
  const visible = props.items.slice(window.start, window.end);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTop = props.initialScrollTop;
    setScrollTop(props.initialScrollTop);
    setViewportHeight(Math.max(1, container.clientHeight));
  }, [props.initialScrollTop, props.surahNumber]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || props.targetAyahKey === null) return;
    const index = props.items.findIndex((result) => result.ayah.key === props.targetAyahKey);
    if (index < 0) return;
    const targetTop = offsetBefore(props.items, index, measuredHeightsRef.current);
    container.scrollTo({ top: Math.max(0, targetTop - container.clientHeight * 0.25) });
  }, [props.items, props.targetAyahKey]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      let changed = false;
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        const key = element.dataset.quranVirtualKey;
        const height = entry.borderBoxSize[0]?.blockSize ?? element.getBoundingClientRect().height;
        if (!key || !Number.isFinite(height) || height <= 0) continue;
        if (Math.abs((measuredHeightsRef.current.get(key) ?? 0) - height) < 1) continue;
        measuredHeightsRef.current.set(key, height);
        changed = true;
      }
      if (changed) setMeasurementVersion((current) => current + 1);
      setViewportHeight(Math.max(1, container.clientHeight));
    });
    container.querySelectorAll<HTMLElement>('[data-quran-virtual-key]').forEach((element) => {
      observer.observe(element);
    });
    observer.observe(container);
    return () => {
      observer.disconnect();
    };
  }, [visible]);

  return (
    <div
      ref={containerRef}
      className="quran-offline-reader__virtual-scroll"
      data-quran-virtual-scroll
      aria-label={props.ariaLabel}
      onScroll={(event) => {
        const next = event.currentTarget.scrollTop;
        setScrollTop(next);
        props.onScrollTopChange(next);
      }}
    >
      <div aria-hidden="true" style={{ blockSize: `${String(window.beforeHeight)}px` }} />
      {visible.map((result) => (
        <div key={result.ayah.key} data-quran-virtual-key={result.ayah.key}>
          {props.renderItem(result)}
        </div>
      ))}
      <div aria-hidden="true" style={{ blockSize: `${String(window.afterHeight)}px` }} />
    </div>
  );
}
