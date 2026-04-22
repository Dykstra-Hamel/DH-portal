// ─── Types ───────────────────────────────────────────────────────────────────

export type MapPestStampType = 'ant' | 'termite' | 'cockroach' | 'spider' | 'mosquito' | 'rodent' | 'wasp' | 'bed-bug' | 'dynamic-pest';
export type MapObjectStampType = 'door' | 'window' | 'sentricon-bait-station';
export type MapElementStampType = 'house' | 'garage' | 'patio' | 'deck' | 'fence' | 'water' | 'yard';
export type MapConditionStampType = 'excessive-moisture' | 'faulty-grade' | 'earth-wood-contact' | 'inaccessible-areas' | 'other-condition';
export type MapStationStampType = 'rodent-station' | 'bird-spikes' | 'bird-netting' | 'smart-defense';
export type MapStampType = MapPestStampType | MapObjectStampType | MapElementStampType | MapConditionStampType | MapStationStampType;
export type MapLegacyStampType = 'activity' | 'entry' | 'nest' | 'recommendation';
export type MapStampCategory = 'pest' | 'object' | 'element' | 'condition' | 'station';
export type MapDrawTool = 'stamp' | 'outline';
export type MapBackgroundMode = 'satellite' | 'blank-grid';

export interface MapPlotStamp {
  id: string;
  x: number;
  y: number;
  lat?: number;
  lng?: number;
  xGrid?: number;
  yGrid?: number;
  type: MapStampType;
  rotation?: number;
  notes?: string;
  photoUrls?: string[];
  // Dynamic pest metadata (set when type === 'dynamic-pest')
  pestId?: string;
  pestSlug?: string;
  displayLabel?: string;
  // Condition metadata (set for condition stamp types)
  customConditionText?: string;
}

export interface MapOutlinePoint {
  x: number;
  y: number;
  lat?: number;
  lng?: number;
  xGrid?: number;
  yGrid?: number;
}

export interface MapElementOutline {
  id: string;
  type: MapElementStampType;
  points: MapOutlinePoint[];
  isClosed: boolean;
  sqft?: number;      // set by canvas; matches displayed label exactly
  linearFt?: number;  // set by canvas; matches displayed label exactly
}

export interface MapPlotData {
  addressInput: string;
  addressComponents: { latitude?: number; longitude?: number; [key: string]: unknown } | null;
  centerLat: number | null;
  centerLng: number | null;
  zoom: number;
  heading: number;
  tilt: number;
  isViewSet: boolean;
  drawTool: MapDrawTool;
  selectedStampType: MapStampType;
  selectedPestType: MapPestStampType;
  selectedObjectType: MapObjectStampType;
  selectedElementType: MapElementStampType;
  selectedConditionType: MapConditionStampType;
  selectedStationStampType: MapStationStampType;
  backgroundMode: MapBackgroundMode;
  stamps: MapPlotStamp[];
  outlines: MapElementOutline[];
  activeOutlineId: string | null;
  updatedAt: string | null;
  gridRefWidth: number | null;
  gridRefHeight: number | null;
  housePhotos: string[];
}

export interface MapStampOption {
  type: MapStampType;
  label: string;
  category: MapStampCategory;
  color: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const OUTLINE_SNAP_GRID_PX = 8;
export const BLANK_GRID_MIN_SCALE = 1;
export const BLANK_GRID_MAX_SCALE = 20;
export const MAP_MIN_ZOOM = 16;
export const DEFAULT_PEST_STAMP_TYPE: MapPestStampType = 'ant';
export const DEFAULT_OBJECT_STAMP_TYPE: MapObjectStampType = 'door';
export const DEFAULT_ELEMENT_STAMP_TYPE: MapElementStampType = 'house';
export const DEFAULT_CONDITION_TYPE: MapConditionStampType = 'excessive-moisture';
export const DEFAULT_STATION_STAMP_TYPE: MapStationStampType = 'rodent-station';

export const MAP_PEST_STAMP_OPTIONS: MapStampOption[] = [
  { type: 'ant', label: 'Ant', category: 'pest', color: '#b91c1c' },
  { type: 'termite', label: 'Termite', category: 'pest', color: '#d97706' },
  { type: 'cockroach', label: 'Cockroach', category: 'pest', color: '#7c2d12' },
  { type: 'spider', label: 'Spider', category: 'pest', color: '#374151' },
  { type: 'mosquito', label: 'Mosquito', category: 'pest', color: '#0f766e' },
  { type: 'rodent', label: 'Rodent', category: 'pest', color: '#4b5563' },
  { type: 'wasp', label: 'Wasp', category: 'pest', color: '#f59e0b' },
  { type: 'bed-bug', label: 'Bed Bug', category: 'pest', color: '#be123c' },
];

export const MAP_OBJECT_STAMP_OPTIONS: MapStampOption[] = [
  { type: 'door', label: 'Door', category: 'object', color: '#1d4ed8' },
  { type: 'window', label: 'Window', category: 'object', color: '#1d4ed8' },
  { type: 'sentricon-bait-station', label: 'Sentricon', category: 'object', color: '#0075de' },
];

export const MAP_ELEMENT_STAMP_OPTIONS: MapStampOption[] = [
  { type: 'house', label: 'Home', category: 'element', color: '#1d4ed8' },
  { type: 'garage', label: 'Garage', category: 'element', color: '#4338ca' },
  { type: 'deck', label: 'Deck/Patio', category: 'element', color: '#7c3aed' },
  { type: 'yard', label: 'Yard', category: 'element', color: '#16a34a' },
  { type: 'water', label: 'Water', category: 'element', color: '#0284c7' },
  { type: 'fence', label: 'Fence', category: 'element', color: '#92400e' },
];

export const MAP_STATION_STAMP_OPTIONS: MapStampOption[] = [
  { type: 'rodent-station', label: 'Rodent Station', category: 'station', color: '#1d4ed8' },
  { type: 'bird-spikes', label: 'Bird Spikes', category: 'station', color: '#1d4ed8' },
  { type: 'bird-netting', label: 'Bird Netting', category: 'station', color: '#1d4ed8' },
  { type: 'smart-defense', label: 'Smart Defense', category: 'station', color: '#1d4ed8' },
];

export const MAP_CONDITION_STAMP_OPTIONS: MapStampOption[] = [
  { type: 'excessive-moisture', label: 'Excessive Moisture', category: 'condition', color: '#0369a1' },
  { type: 'faulty-grade', label: 'Faulty Grade', category: 'condition', color: '#92400e' },
  { type: 'earth-wood-contact', label: 'Earth-Wood Contact', category: 'condition', color: '#65a30d' },
  { type: 'inaccessible-areas', label: 'Inaccessible Areas', category: 'condition', color: '#6b7280' },
  { type: 'other-condition', label: 'Other', category: 'condition', color: '#9333ea' },
];

export const MAP_STAMP_OPTIONS: MapStampOption[] = [
  ...MAP_PEST_STAMP_OPTIONS,
  ...MAP_OBJECT_STAMP_OPTIONS,
  ...MAP_ELEMENT_STAMP_OPTIONS,
  ...MAP_STATION_STAMP_OPTIONS,
];

export const LEGACY_MAP_STAMP_TYPE_MAP: Record<MapLegacyStampType, MapStampType> = {
  activity: 'ant',
  entry: 'house',
  nest: 'house',
  recommendation: 'deck',
};

export const DEFAULT_MAP_PLOT_DATA: MapPlotData = {
  addressInput: '',
  addressComponents: null,
  centerLat: null,
  centerLng: null,
  zoom: 20,
  heading: 0,
  tilt: 0,
  isViewSet: false,
  drawTool: 'outline',
  selectedStampType: DEFAULT_PEST_STAMP_TYPE,
  selectedPestType: DEFAULT_PEST_STAMP_TYPE,
  selectedObjectType: DEFAULT_OBJECT_STAMP_TYPE,
  selectedElementType: DEFAULT_ELEMENT_STAMP_TYPE,
  selectedConditionType: DEFAULT_CONDITION_TYPE,
  selectedStationStampType: DEFAULT_STATION_STAMP_TYPE,
  backgroundMode: 'satellite',
  stamps: [],
  outlines: [],
  activeOutlineId: null,
  updatedAt: null,
  gridRefWidth: null,
  gridRefHeight: null,
  housePhotos: [],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function clampNormalized(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function getMetersPerPixel(latitude: number, zoom: number): number {
  const latRadians = (latitude * Math.PI) / 180;
  return (156543.03392 * Math.cos(latRadians)) / Math.pow(2, zoom);
}

export function getPolygonAreaInPixels(points: MapOutlinePoint[], width: number, height: number): number {
  if (points.length < 3 || width <= 0 || height <= 0) return 0;
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    const x1 = current.x * width;
    const y1 = current.y * height;
    const x2 = next.x * width;
    const y2 = next.y * height;
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum / 2);
}

export function getPolygonCentroidNormalized(points: MapOutlinePoint[]): { x: number; y: number } | null {
  if (points.length < 3) return null;
  let areaFactor = 0;
  let centroidX = 0;
  let centroidY = 0;
  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    const cross = current.x * next.y - next.x * current.y;
    areaFactor += cross;
    centroidX += (current.x + next.x) * cross;
    centroidY += (current.y + next.y) * cross;
  }
  if (Math.abs(areaFactor) < 1e-9) {
    const avgX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const avgY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    return { x: avgX, y: avgY };
  }
  const factor = 1 / (3 * areaFactor);
  return { x: centroidX * factor, y: centroidY * factor };
}

export function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const full = normalized.length === 3
    ? normalized.split('').map(c => `${c}${c}`).join('')
    : normalized;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return `rgba(59, 130, 246, ${alpha})`;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function isMapPestStampType(value: unknown): value is MapPestStampType {
  return typeof value === 'string' && (MAP_PEST_STAMP_OPTIONS.some(o => o.type === value) || value === 'dynamic-pest');
}
export function isMapObjectStampType(value: unknown): value is MapObjectStampType {
  return typeof value === 'string' && MAP_OBJECT_STAMP_OPTIONS.some(o => o.type === value);
}
export function isMapElementStampType(value: unknown): value is MapElementStampType {
  return typeof value === 'string' && MAP_ELEMENT_STAMP_OPTIONS.some(o => o.type === value);
}
export function isMapConditionStampType(value: unknown): value is MapConditionStampType {
  return typeof value === 'string' && MAP_CONDITION_STAMP_OPTIONS.some(o => o.type === value);
}
export function isMapStationStampType(value: unknown): value is MapStationStampType {
  return typeof value === 'string' && MAP_STATION_STAMP_OPTIONS.some(o => o.type === value);
}
export function isMapStampType(value: unknown): value is MapStampType {
  return isMapPestStampType(value) || isMapObjectStampType(value) || isMapElementStampType(value) || isMapConditionStampType(value) || isMapStationStampType(value);
}

export function normalizeMapStampType(value: unknown): MapStampType | null {
  if (isMapStampType(value)) return value;
  if (typeof value === 'string' && value in LEGACY_MAP_STAMP_TYPE_MAP) {
    return LEGACY_MAP_STAMP_TYPE_MAP[value as MapLegacyStampType];
  }
  return null;
}

export function getMapStampOption(type: MapStampType): MapStampOption {
  return (
    MAP_CONDITION_STAMP_OPTIONS.find(o => o.type === type) ??
    MAP_STATION_STAMP_OPTIONS.find(o => o.type === type) ??
    MAP_STAMP_OPTIONS.find(o => o.type === type) ??
    MAP_STAMP_OPTIONS[0]
  );
}

export function getMapLatitude(data: MapPlotData | null): number | null {
  if (!data) return null;
  if (typeof data.centerLat === 'number') return data.centerLat;
  if (!data.addressComponents?.latitude) return null;
  return Number(data.addressComponents.latitude);
}

export function getMapLongitude(data: MapPlotData | null): number | null {
  if (!data) return null;
  if (typeof data.centerLng === 'number') return data.centerLng;
  if (!data.addressComponents?.longitude) return null;
  return Number(data.addressComponents.longitude);
}

export function getMapPlotSummaryLines(data: MapPlotData | null): string[] {
  if (!data) return [];
  const pestLabels = [...new Set(
    data.stamps
      .filter(s => isMapPestStampType(s.type))
      .map(s => s.displayLabel || getMapStampOption(s.type).label)
  )];
  const elementTypes = [...new Set(data.outlines.map(o => MAP_ELEMENT_STAMP_OPTIONS.find(e => e.type === o.type)?.label ?? o.type))];
  const lines: string[] = [];
  if (pestLabels.length > 0) lines.push(`Pests: ${pestLabels.join(', ')}`);
  if (elementTypes.length > 0) lines.push(`Elements: ${elementTypes.join(', ')}`);
  if (data.stamps.length > 0) lines.push(`${data.stamps.length} stamp${data.stamps.length !== 1 ? 's' : ''} placed`);
  if (data.outlines.length > 0) lines.push(`${data.outlines.length} outline${data.outlines.length !== 1 ? 's' : ''} drawn`);
  return lines;
}
