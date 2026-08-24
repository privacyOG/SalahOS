import { createCoordinates, type Coordinates } from '../domain/coordinates';
import { clampQiblaMapZoom } from '../domain/qiblaMap';
import { KAABA_COORDINATES } from '../domain/qibla';

const GOOGLE_MAPS_JAVASCRIPT_ROOT = 'https://maps.googleapis.com/maps/api/js';
const GOOGLE_MAPS_TERMS_URL = 'https://www.google.com/help/terms_maps/';
const GOOGLE_MAPS_SCRIPT_ATTRIBUTE = 'data-salahos-qibla-google-maps';

export type QiblaGoogleMapType = 'roadmap' | 'satellite' | 'hybrid';

export interface QiblaGoogleLineStyle {
  readonly color: string;
  readonly weight: number;
  readonly haloColor: string;
  readonly haloWeight: number;
}

export interface QiblaGoogleMapSession {
  readonly setCoordinates: (coordinates: Coordinates) => void;
  readonly setZoom: (zoom: number) => void;
  readonly setMapType: (mapType: QiblaGoogleMapType) => void;
  readonly setAligned: (aligned: boolean) => void;
  readonly fitRoute: () => void;
  readonly stop: () => void;
}

export interface CreateQiblaGoogleMapSessionOptions {
  readonly element: HTMLElement;
  readonly apiKey: string;
  readonly coordinates: Coordinates;
  readonly zoom: number;
  readonly mapType: QiblaGoogleMapType;
  readonly aligned: boolean;
  readonly onDropPin: (coordinates: Coordinates) => void;
  readonly onZoomChange?: (zoom: number) => void;
}

interface GoogleLatLng {
  lat(): number;
  lng(): number;
}

interface GoogleMapMouseEvent {
  readonly latLng?: GoogleLatLng | null;
}

interface GoogleMapsEventListener {
  remove(): void;
}

interface GoogleMapInstance {
  addListener(
    eventName: string,
    listener: (event?: GoogleMapMouseEvent) => void,
  ): GoogleMapsEventListener;
  fitBounds(bounds: GoogleLatLngBoundsInstance, padding?: number): void;
  getZoom(): number | undefined;
  setCenter(position: GoogleLatLngLiteral): void;
  setMapTypeId(mapType: QiblaGoogleMapType): void;
  setZoom(zoom: number): void;
}

interface GoogleMarkerInstance {
  setMap(map: GoogleMapInstance | null): void;
  setPosition(position: GoogleLatLngLiteral): void;
}

interface GooglePolylineInstance {
  setMap(map: GoogleMapInstance | null): void;
  setOptions(options: GooglePolylineOptions): void;
  setPath(path: readonly GoogleLatLngLiteral[]): void;
}

interface GoogleLatLngBoundsInstance {
  extend(position: GoogleLatLngLiteral): GoogleLatLngBoundsInstance;
}

interface GoogleLatLngLiteral {
  readonly lat: number;
  readonly lng: number;
}

interface GooglePolylineOptions {
  readonly map?: GoogleMapInstance;
  readonly path?: readonly GoogleLatLngLiteral[];
  readonly geodesic?: boolean;
  readonly clickable?: boolean;
  readonly strokeColor?: string;
  readonly strokeOpacity?: number;
  readonly strokeWeight?: number;
  readonly zIndex?: number;
}

interface GoogleMapsApi {
  readonly Map: new (
    element: HTMLElement,
    options: {
      readonly center: GoogleLatLngLiteral;
      readonly zoom: number;
      readonly mapTypeId: QiblaGoogleMapType;
      readonly disableDefaultUI: boolean;
      readonly clickableIcons: boolean;
      readonly gestureHandling: string;
      readonly keyboardShortcuts: boolean;
    },
  ) => GoogleMapInstance;
  readonly Marker: new (options: {
    readonly map: GoogleMapInstance;
    readonly position: GoogleLatLngLiteral;
    readonly title: string;
    readonly label?: string;
    readonly zIndex?: number;
  }) => GoogleMarkerInstance;
  readonly Polyline: new (options: GooglePolylineOptions) => GooglePolylineInstance;
  readonly LatLngBounds: new () => GoogleLatLngBoundsInstance;
}

let googleMapsLoadPromise: Promise<GoogleMapsApi> | null = null;

export function qiblaGoogleMapsJavaScriptUrl(apiKey: string): string {
  const key = apiKey.trim();
  if (key.length < 1) throw new TypeError('Google Maps API key is required');

  const url = new URL(GOOGLE_MAPS_JAVASCRIPT_ROOT);
  url.searchParams.set('key', key);
  url.searchParams.set('v', 'weekly');
  url.searchParams.set('loading', 'async');
  return url.toString();
}

export function qiblaGoogleLineStyle(
  mapType: QiblaGoogleMapType,
  aligned: boolean,
): QiblaGoogleLineStyle {
  return Object.freeze({
    color: aligned ? '#15803d' : mapType === 'roadmap' ? '#1267d6' : '#e53e30',
    weight: aligned ? 7 : 6,
    haloColor: '#ffffff',
    haloWeight: aligned ? 11 : 10,
  });
}

export async function createQiblaGoogleMapSession(
  options: CreateQiblaGoogleMapSessionOptions,
): Promise<QiblaGoogleMapSession> {
  const maps = await loadGoogleMapsApi(options.apiKey);
  let coordinates = options.coordinates;
  let mapType = options.mapType;
  let aligned = options.aligned;
  const center = toGooglePosition(coordinates);
  const kaaba = toGooglePosition(KAABA_COORDINATES);
  const map = new maps.Map(options.element, {
    center,
    zoom: clampQiblaMapZoom(options.zoom),
    mapTypeId: mapType,
    disableDefaultUI: true,
    clickableIcons: false,
    gestureHandling: 'greedy',
    keyboardShortcuts: true,
  });
  const userMarker = new maps.Marker({
    map,
    position: center,
    title: 'Current location',
    label: '●',
    zIndex: 4,
  });
  const kaabaMarker = new maps.Marker({
    map,
    position: kaaba,
    title: 'Kaaba, Makkah',
    label: 'K',
    zIndex: 5,
  });
  const initialStyle = qiblaGoogleLineStyle(mapType, aligned);
  const routeHalo = new maps.Polyline({
    map,
    path: [center, kaaba],
    geodesic: true,
    clickable: false,
    strokeColor: initialStyle.haloColor,
    strokeOpacity: 0.94,
    strokeWeight: initialStyle.haloWeight,
    zIndex: 1,
  });
  const routeLine = new maps.Polyline({
    map,
    path: [center, kaaba],
    geodesic: true,
    clickable: false,
    strokeColor: initialStyle.color,
    strokeOpacity: 1,
    strokeWeight: initialStyle.weight,
    zIndex: 2,
  });

  const applyLineStyle = () => {
    const style = qiblaGoogleLineStyle(mapType, aligned);
    routeHalo.setOptions({
      strokeColor: style.haloColor,
      strokeOpacity: 0.94,
      strokeWeight: style.haloWeight,
    });
    routeLine.setOptions({
      strokeColor: style.color,
      strokeOpacity: 1,
      strokeWeight: style.weight,
    });
  };

  const fitRoute = () => {
    const bounds = new maps.LatLngBounds();
    bounds.extend(toGooglePosition(coordinates));
    bounds.extend(kaaba);
    map.fitBounds(bounds, 56);
  };

  const clickListener = map.addListener('click', (event) => {
    const latLng = event?.latLng;
    if (latLng === null || latLng === undefined) return;
    options.onDropPin(createCoordinates(latLng.lat(), latLng.lng()));
  });
  const zoomListener = map.addListener('zoom_changed', () => {
    const zoom = map.getZoom();
    if (zoom !== undefined && Number.isFinite(zoom)) {
      options.onZoomChange?.(clampQiblaMapZoom(zoom));
    }
  });

  fitRoute();

  return Object.freeze({
    setCoordinates: (nextCoordinates: Coordinates) => {
      coordinates = nextCoordinates;
      const position = toGooglePosition(coordinates);
      userMarker.setPosition(position);
      routeHalo.setPath([position, kaaba]);
      routeLine.setPath([position, kaaba]);
      map.setCenter(position);
    },
    setZoom: (zoom: number) => {
      map.setZoom(clampQiblaMapZoom(zoom));
    },
    setMapType: (nextMapType: QiblaGoogleMapType) => {
      mapType = nextMapType;
      map.setMapTypeId(nextMapType);
      applyLineStyle();
    },
    setAligned: (nextAligned: boolean) => {
      aligned = nextAligned;
      applyLineStyle();
    },
    fitRoute,
    stop: () => {
      clickListener.remove();
      zoomListener.remove();
      userMarker.setMap(null);
      kaabaMarker.setMap(null);
      routeHalo.setMap(null);
      routeLine.setMap(null);
    },
  });
}

export function qiblaGoogleMapsTermsUrl(): string {
  return GOOGLE_MAPS_TERMS_URL;
}

async function loadGoogleMapsApi(apiKey: string): Promise<GoogleMapsApi> {
  const existing = readGoogleMapsApi();
  if (existing !== null) return existing;
  if (typeof document === 'undefined') {
    throw new Error('Google Maps requires a browser document');
  }

  googleMapsLoadPromise ??= new Promise<GoogleMapsApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.setAttribute(GOOGLE_MAPS_SCRIPT_ATTRIBUTE, 'true');
    script.async = true;
    script.src = qiblaGoogleMapsJavaScriptUrl(apiKey);
    script.addEventListener(
      'load',
      () => {
        const loaded = readGoogleMapsApi();
        if (loaded === null) {
          googleMapsLoadPromise = null;
          reject(new Error('Google Maps loaded without a usable maps namespace'));
          return;
        }
        resolve(loaded);
      },
      { once: true },
    );
    script.addEventListener(
      'error',
      () => {
        googleMapsLoadPromise = null;
        reject(new Error('Google Maps failed to load'));
      },
      { once: true },
    );
    document.head.append(script);
  });

  return googleMapsLoadPromise;
}

function readGoogleMapsApi(): GoogleMapsApi | null {
  const googleValue = Reflect.get(globalThis, 'google') as unknown;
  if (typeof googleValue !== 'object' || googleValue === null) return null;
  const maps = Reflect.get(googleValue, 'maps') as unknown;
  if (typeof maps !== 'object' || maps === null) return null;
  if (
    typeof Reflect.get(maps, 'Map') !== 'function' ||
    typeof Reflect.get(maps, 'Marker') !== 'function' ||
    typeof Reflect.get(maps, 'Polyline') !== 'function' ||
    typeof Reflect.get(maps, 'LatLngBounds') !== 'function'
  ) {
    return null;
  }
  return maps as GoogleMapsApi;
}

function toGooglePosition(coordinates: Coordinates): GoogleLatLngLiteral {
  return Object.freeze({ lat: coordinates.latitude, lng: coordinates.longitude });
}
