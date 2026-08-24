import { useEffect, useRef, useState, type MouseEvent } from 'react';

import type { Coordinates } from '../domain/coordinates';
import { coordinatesForMapPoint, qiblaBearingRayEndpoint } from '../domain/qiblaMap';
import type { QiblaFinderCopy } from '../i18n/qiblaFinderTranslations';
import {
  createQiblaGoogleMapSession,
  qiblaGoogleMapsTermsUrl,
  type QiblaGoogleMapSession,
  type QiblaGoogleMapType,
} from '../platform/qiblaGoogleMaps';

import '../qibla-google-map.css';

interface QiblaMapViewProps {
  readonly coordinates: Coordinates;
  readonly bearingDegrees: number;
  readonly aligned: boolean;
  readonly zoom: number;
  readonly tilesEnabled: boolean;
  readonly text: QiblaFinderCopy;
  readonly onZoomChange: (zoom: number) => void;
  readonly onEnableTiles: () => void;
  readonly onDropPin: (coordinates: Coordinates) => void;
}

type ProviderState = 'loading' | 'ready' | 'unconfigured' | 'error';

interface QiblaMapLocalCopy {
  readonly roadmap: string;
  readonly satellite: string;
  readonly hybrid: string;
  readonly fitRoute: string;
  readonly loading: string;
  readonly unconfigured: string;
  readonly retry: string;
  readonly fallback: string;
}

const localCopy: Readonly<Record<'en' | 'ar' | 'tr' | 'id', QiblaMapLocalCopy>> = {
  en: {
    roadmap: 'Map',
    satellite: 'Satellite',
    hybrid: 'Hybrid',
    fitRoute: 'Show full Qiblah route',
    loading: 'Loading Google Maps…',
    unconfigured: 'Google Maps is not configured for this build.',
    retry: 'Retry Google Maps',
    fallback: 'The local bearing view remains available without sending map requests.',
  },
  ar: {
    roadmap: 'الخريطة',
    satellite: 'القمر الصناعي',
    hybrid: 'هجين',
    fitRoute: 'إظهار مسار القبلة كاملاً',
    loading: 'جارٍ تحميل خرائط Google…',
    unconfigured: 'خرائط Google غير مهيأة في هذا الإصدار.',
    retry: 'إعادة محاولة خرائط Google',
    fallback: 'يبقى عرض الاتجاه المحلي متاحاً من دون إرسال طلبات خرائط.',
  },
  tr: {
    roadmap: 'Harita',
    satellite: 'Uydu',
    hybrid: 'Hibrit',
    fitRoute: 'Tam Kıble rotasını göster',
    loading: 'Google Haritalar yükleniyor…',
    unconfigured: 'Google Haritalar bu derleme için yapılandırılmamış.',
    retry: 'Google Haritaları yeniden dene',
    fallback: 'Yerel yön görünümü harita isteği göndermeden kullanılabilir.',
  },
  id: {
    roadmap: 'Peta',
    satellite: 'Satelit',
    hybrid: 'Hibrida',
    fitRoute: 'Tampilkan rute Kiblat penuh',
    loading: 'Memuat Google Maps…',
    unconfigured: 'Google Maps belum dikonfigurasi untuk build ini.',
    retry: 'Coba Google Maps lagi',
    fallback: 'Tampilan arah lokal tetap tersedia tanpa mengirim permintaan peta.',
  },
};

function googleMapsApiKey(): string | null {
  const value: unknown = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

export function QiblaMapView({
  coordinates,
  bearingDegrees,
  aligned,
  zoom,
  text,
  onZoomChange,
  onDropPin,
}: QiblaMapViewProps) {
  const googleKey = googleMapsApiKey();
  const copy = localCopy[documentLocale()];
  const [mapType, setMapType] = useState<QiblaGoogleMapType>('satellite');
  const [providerState, setProviderState] = useState<ProviderState>(
    googleKey === null ? 'unconfigured' : 'loading',
  );
  const [retryGeneration, setRetryGeneration] = useState(0);
  const mapElementRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<QiblaGoogleMapSession | null>(null);
  const sessionGenerationRef = useRef(0);
  const onDropPinRef = useRef(onDropPin);
  const onZoomChangeRef = useRef(onZoomChange);
  onDropPinRef.current = onDropPin;
  onZoomChangeRef.current = onZoomChange;

  useEffect(() => {
    const element = mapElementRef.current;
    if (googleKey === null || element === null) {
      setProviderState('unconfigured');
      return;
    }

    const generation = ++sessionGenerationRef.current;
    setProviderState('loading');
    void sessionRef.current?.stop();
    sessionRef.current = null;

    void createQiblaGoogleMapSession({
      element,
      apiKey: googleKey,
      coordinates,
      zoom,
      mapType,
      aligned,
      onDropPin: (nextCoordinates) => {
        onDropPinRef.current(nextCoordinates);
      },
      onZoomChange: (nextZoom) => {
        onZoomChangeRef.current(nextZoom);
      },
    })
      .then((session) => {
        if (generation !== sessionGenerationRef.current) {
          session.stop();
          return;
        }
        sessionRef.current = session;
        setProviderState('ready');
      })
      .catch(() => {
        if (generation === sessionGenerationRef.current) {
          sessionRef.current = null;
          setProviderState('error');
        }
      });

    return () => {
      if (generation === sessionGenerationRef.current) {
        sessionGenerationRef.current += 1;
      }
      sessionRef.current?.stop();
      sessionRef.current = null;
    };
  }, [googleKey, retryGeneration]);

  useEffect(() => {
    sessionRef.current?.setCoordinates(coordinates);
  }, [coordinates]);

  useEffect(() => {
    sessionRef.current?.setZoom(zoom);
  }, [zoom]);

  useEffect(() => {
    sessionRef.current?.setMapType(mapType);
  }, [mapType]);

  useEffect(() => {
    sessionRef.current?.setAligned(aligned);
  }, [aligned]);

  const fallbackEndpoint = qiblaBearingRayEndpoint(bearingDegrees, 100, 100);
  const fallbackVisible = providerState === 'unconfigured' || providerState === 'error';

  const dropFallbackPin = (event: MouseEvent<HTMLDivElement>) => {
    const rectangle = event.currentTarget.getBoundingClientRect();
    onDropPin(
      coordinatesForMapPoint(coordinates, zoom, rectangle.width, rectangle.height, {
        x: event.clientX - rectangle.left,
        y: event.clientY - rectangle.top,
      }),
    );
  };

  const selectMapType = (nextMapType: QiblaGoogleMapType) => {
    setMapType(nextMapType);
    sessionRef.current?.setMapType(nextMapType);
  };

  return (
    <div
      className="qibla-map-shell qibla-google-map-shell"
      data-map-provider={providerState === 'ready' ? `google-${mapType}` : 'local-fallback'}
      data-google-map-state={providerState}
      data-google-map-type={mapType}
    >
      <div className="qibla-map-toolbar" aria-label={text.mapView}>
        <div className="qibla-google-map-types" role="group" aria-label={text.mapView}>
          {(['roadmap', 'satellite', 'hybrid'] as const).map((type) => (
            <button
              type="button"
              key={type}
              aria-pressed={mapType === type}
              disabled={googleKey === null}
              onClick={() => {
                selectMapType(type);
              }}
            >
              {type === 'roadmap'
                ? copy.roadmap
                : type === 'satellite'
                  ? copy.satellite
                  : copy.hybrid}
            </button>
          ))}
        </div>
        <div className="qibla-google-map-actions">
          <button
            type="button"
            disabled={providerState !== 'ready'}
            onClick={() => {
              sessionRef.current?.fitRoute();
            }}
          >
            {copy.fitRoute}
          </button>
          <div className="qibla-map-zoom">
            <button
              type="button"
              aria-label={text.zoomOut}
              onClick={() => {
                onZoomChange(zoom - 1);
              }}
            >
              −
            </button>
            <span aria-hidden="true">{zoom}</span>
            <button
              type="button"
              aria-label={text.zoomIn}
              onClick={() => {
                onZoomChange(zoom + 1);
              }}
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div
        className={`qibla-map-viewport qibla-google-map-viewport${aligned ? ' is-aligned' : ''}`}
        role="group"
        aria-label={text.dropPin}
      >
        <div
          ref={mapElementRef}
          className="qibla-google-map-canvas"
          aria-hidden={providerState !== 'ready'}
        />

        {providerState === 'loading' && (
          <div className="qibla-google-map-status" role="status">
            <strong>{copy.loading}</strong>
          </div>
        )}

        {fallbackVisible && (
          <div
            className="qibla-google-map-fallback"
            onClick={dropFallbackPin}
            role="presentation"
            data-qibla-map-fallback
          >
            <svg
              className="qibla-map-bearing-overlay qibla-map-bearing-overlay--fallback"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <line x1="50" y1="50" x2={fallbackEndpoint.x} y2={fallbackEndpoint.y} />
            </svg>
            <div className="qibla-map-user-marker" aria-hidden="true">
              <span className="qibla-map-marker-dot" />
            </div>
            <div className="qibla-map-kaaba-chip" aria-hidden="true">
              ◼
            </div>
            <div className="qibla-google-map-status qibla-google-map-status--fallback">
              <strong>
                {providerState === 'unconfigured' ? copy.unconfigured : text.mapUnavailable}
              </strong>
              <span>{copy.fallback}</span>
              {providerState === 'error' && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setRetryGeneration((value) => value + 1);
                  }}
                >
                  {copy.retry}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <p className="qibla-map-drop-help">{text.dropPin}</p>
      {googleKey !== null && (
        <p className="qibla-map-attribution">
          <a href={qiblaGoogleMapsTermsUrl()} target="_blank" rel="noopener noreferrer">
            Google Maps
          </a>
        </p>
      )}
    </div>
  );
}

function documentLocale(): 'en' | 'ar' | 'tr' | 'id' {
  const locale = document.documentElement.lang.toLowerCase().split('-')[0];
  return locale === 'ar' || locale === 'tr' || locale === 'id' ? locale : 'en';
}
