'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  UserPlus,
  TrendingUp,
  ChevronDown,
  X,
  ArrowLeft,
  ArrowRight,
  MapPinned,
  LocateFixed,
  Keyboard,
  Lock,
  Unlock,
  Move3d,
  Ruler,
  Undo2,
  Trash2,
  DoorClosed,
  DoorOpen,
  AppWindow,
  Droplet,
  Fence,
  Grid2x2,
  Warehouse,
  House,
  Map as MapIcon,
  Grid3x3,
  List,
} from 'lucide-react';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import { useRouter } from 'next/navigation';
import SignatureCanvas from 'react-signature-canvas';
import { useCompany } from '@/contexts/CompanyContext';
import { useWizard } from '@/contexts/WizardContext';
import { useRecentTechLeadCustomers, type RecentCustomer } from '@/hooks/useRecentTechLeadCustomers';
import { AddressAutocomplete, type AddressComponents } from '@/components/Common/AddressAutocomplete/AddressAutocomplete';
import { createClient } from '@/lib/supabase/client';
import styles from './NewOpportunityWizard.module.scss';

// ─── Types ────────────────────────────────────────────────────────────────────

type LeadType = 'new-lead' | 'upsell';

type StepId =
  | 'type-select'
  | 'new-lead-path'
  | 'map-address'
  | 'photos'
  | 'ai-review'
  | 'new-customer'
  | 'map-plot'
  | 'select-site'
  | 'service-plan-select'
  | 'service-details'
  | 'review'
  | 'service-today-confirm';

const STEP_ID_LABELS: Record<StepId, string> = {
  'type-select': 'Type',
  'new-lead-path': 'Path',
  'map-address': 'Address',
  'photos': 'Photos',
  'ai-review': 'AI Review',
  'new-customer': 'Customer',
  'map-plot': 'Map',
  'select-site': 'Site',
  'service-plan-select': 'Plan',
  'service-details': 'Services',
  'review': 'Review',
  'service-today-confirm': 'Confirm',
};

type NewLeadPathMode = 'standard' | 'map-plot';

type MapPestStampType = 'ant' | 'termite' | 'cockroach' | 'spider' | 'mosquito' | 'rodent' | 'wasp' | 'bed-bug';
type MapObjectStampType = 'door' | 'window';
type MapElementStampType = 'house' | 'garage' | 'patio' | 'deck' | 'fence' | 'water';
type MapStampType = MapPestStampType | MapObjectStampType | MapElementStampType;
type MapLegacyStampType = 'activity' | 'entry' | 'nest' | 'recommendation';
type MapStampCategory = 'pest' | 'object' | 'element';
type MapDrawTool = 'stamp' | 'outline';
type MapBackgroundMode = 'satellite' | 'blank-grid';
const OUTLINE_SNAP_GRID_PX = 8;
const BLANK_GRID_MIN_SCALE = 1;
const BLANK_GRID_MAX_SCALE = 20;

interface MapPlotStamp {
  id: string;
  x: number; // normalized 0..1
  y: number; // normalized 0..1
  lat?: number; // geographic anchor for satellite mode
  lng?: number; // geographic anchor for satellite mode
  type: MapStampType;
}

interface MapOutlinePoint {
  x: number; // normalized 0..1
  y: number; // normalized 0..1
  lat?: number; // geographic anchor for satellite mode
  lng?: number; // geographic anchor for satellite mode
}

interface MapElementOutline {
  id: string;
  type: MapElementStampType;
  points: MapOutlinePoint[];
  isClosed: boolean;
}

interface MapPlotData {
  addressInput: string;
  addressComponents: AddressComponents | null;
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
  backgroundMode: MapBackgroundMode;
  stamps: MapPlotStamp[];
  outlines: MapElementOutline[];
  activeOutlineId: string | null;
  updatedAt: string | null;
}

interface MapStampOption {
  type: MapStampType;
  label: string;
  category: MapStampCategory;
  color: string;
}

const DEFAULT_PEST_STAMP_TYPE: MapPestStampType = 'ant';
const DEFAULT_OBJECT_STAMP_TYPE: MapObjectStampType = 'door';
const DEFAULT_ELEMENT_STAMP_TYPE: MapElementStampType = 'house';
const MAP_MIN_ZOOM = 16;

const MAP_PEST_STAMP_OPTIONS: MapStampOption[] = [
  { type: 'ant', label: 'Ant', category: 'pest', color: '#b91c1c' },
  { type: 'termite', label: 'Termite', category: 'pest', color: '#d97706' },
  { type: 'cockroach', label: 'Cockroach', category: 'pest', color: '#7c2d12' },
  { type: 'spider', label: 'Spider', category: 'pest', color: '#374151' },
  { type: 'mosquito', label: 'Mosquito', category: 'pest', color: '#0f766e' },
  { type: 'rodent', label: 'Rodent', category: 'pest', color: '#4b5563' },
  { type: 'wasp', label: 'Wasp', category: 'pest', color: '#f59e0b' },
  { type: 'bed-bug', label: 'Bed Bug', category: 'pest', color: '#be123c' },
];

const MAP_OBJECT_STAMP_OPTIONS: MapStampOption[] = [
  { type: 'door', label: 'Door', category: 'object', color: '#1d4ed8' },
  { type: 'window', label: 'Window', category: 'object', color: '#1d4ed8' },
];

const MAP_ELEMENT_STAMP_OPTIONS: MapStampOption[] = [
  { type: 'house', label: 'Home', category: 'element', color: '#1d4ed8' },
  { type: 'garage', label: 'Garage', category: 'element', color: '#4338ca' },
  { type: 'patio', label: 'Patio', category: 'element', color: '#0f766e' },
  { type: 'deck', label: 'Deck', category: 'element', color: '#7c3aed' },
  { type: 'fence', label: 'Fence', category: 'element', color: '#64748b' },
  { type: 'water', label: 'Body of Water', category: 'element', color: '#0284c7' },
];

const MAP_STAMP_OPTIONS: MapStampOption[] = [...MAP_PEST_STAMP_OPTIONS, ...MAP_OBJECT_STAMP_OPTIONS, ...MAP_ELEMENT_STAMP_OPTIONS];

const LEGACY_MAP_STAMP_TYPE_MAP: Record<MapLegacyStampType, MapStampType> = {
  activity: 'ant',
  entry: 'house',
  nest: 'house',
  recommendation: 'deck',
};

const DEFAULT_MAP_PLOT_DATA: MapPlotData = {
  addressInput: '',
  addressComponents: null,
  centerLat: null,
  centerLng: null,
  zoom: 20,
  heading: 0,
  tilt: 0,
  isViewSet: false,
  drawTool: 'stamp',
  selectedStampType: DEFAULT_PEST_STAMP_TYPE,
  selectedPestType: DEFAULT_PEST_STAMP_TYPE,
  selectedObjectType: DEFAULT_OBJECT_STAMP_TYPE,
  selectedElementType: DEFAULT_ELEMENT_STAMP_TYPE,
  backgroundMode: 'satellite',
  stamps: [],
  outlines: [],
  activeOutlineId: null,
  updatedAt: null,
};

interface NewCustomerForm {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  addressInput: string;
  addressComponents: AddressComponents | null;
}

interface PestPacClientResult {
  clientId: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  primaryAddress: { street: string; city: string; state: string; zip: string } | null;
}

interface PhotoPreview {
  file: File;
  dataUrl: string;
  base64: string;
  mimeType: string;
}

interface AIResult {
  issue_detected: string;
  service_category: string;
  ai_summary: string;
  suggested_pest_type: string | null;
  matched_pest_option: string | null;
  severity: 'low' | 'medium' | 'high' | null;
}

interface PestOption {
  id: string;
  name: string;
  slug: string;
}

interface ServiceAddress {
  id: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude?: number;
  longitude?: number;
}

interface CustomerResult {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  pestpac_client_id?: string | null;
  // Direct customer address fields
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  // Nested primary service address from the search API
  primary_service_address?: Array<{ service_address: ServiceAddress }>;
}

interface ServicePlan {
  id: string;
  plan_name: string;
  plan_description: string | null;
  initial_price: number | null;
  recurring_price: number | null;
  billing_frequency: string | null;
  plan_features: string[] | null;
  plan_terms: string | null;
  plan_disclaimer: string | null;
  highlight_badge: string | null;
  display_order: number | null;
}

const OTHER_PEST_OPTION_VALUE = '__other__';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<{ base64: string; dataUrl: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      resolve({ base64, dataUrl, mimeType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}


function getCustomerDisplayName(c: CustomerResult): string {
  const parts = [c.first_name, c.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : c.email ?? `Customer #${c.id.slice(0, 8)}`;
}

function getPrimaryAddress(c: CustomerResult): ServiceAddress | null {
  // Prefer the nested primary service address from the search API
  if (c.primary_service_address?.length) {
    return c.primary_service_address[0].service_address ?? null;
  }
  // Fall back to direct customer address fields
  if (c.address) {
    return {
      id: c.id,
      street_address: c.address,
      city: c.city ?? '',
      state: c.state ?? '',
      zip_code: c.zip_code ?? '',
    };
  }
  return null;
}

function getMapLatitude(mapPlotData: MapPlotData | null): number | null {
  if (!mapPlotData) return null;
  if (typeof mapPlotData.centerLat === 'number') return mapPlotData.centerLat;
  if (!mapPlotData.addressComponents?.latitude) return null;
  return Number(mapPlotData.addressComponents.latitude);
}

function getMapLongitude(mapPlotData: MapPlotData | null): number | null {
  if (!mapPlotData) return null;
  if (typeof mapPlotData.centerLng === 'number') return mapPlotData.centerLng;
  if (!mapPlotData.addressComponents?.longitude) return null;
  return Number(mapPlotData.addressComponents.longitude);
}

function clampNormalized(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function getMetersPerPixel(latitude: number, zoom: number): number {
  const latRadians = (latitude * Math.PI) / 180;
  return (156543.03392 * Math.cos(latRadians)) / Math.pow(2, zoom);
}

function getPolygonAreaInPixels(points: MapOutlinePoint[], width: number, height: number): number {
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

function getPolygonCentroidNormalized(points: MapOutlinePoint[]): { x: number; y: number } | null {
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
    const avgX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
    const avgY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
    return { x: avgX, y: avgY };
  }

  const factor = 1 / (3 * areaFactor);
  return {
    x: centroidX * factor,
    y: centroidY * factor,
  };
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const full = normalized.length === 3
    ? normalized.split('').map(char => `${char}${char}`).join('')
    : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    return `rgba(59, 130, 246, ${alpha})`;
  }

  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function isMapPestStampType(value: unknown): value is MapPestStampType {
  return typeof value === 'string' && MAP_PEST_STAMP_OPTIONS.some(option => option.type === value);
}

function isMapObjectStampType(value: unknown): value is MapObjectStampType {
  return typeof value === 'string' && MAP_OBJECT_STAMP_OPTIONS.some(option => option.type === value);
}

function isMapElementStampType(value: unknown): value is MapElementStampType {
  return typeof value === 'string' && MAP_ELEMENT_STAMP_OPTIONS.some(option => option.type === value);
}

function isMapStampType(value: unknown): value is MapStampType {
  return isMapPestStampType(value) || isMapObjectStampType(value) || isMapElementStampType(value);
}

function normalizeMapStampType(value: unknown): MapStampType | null {
  if (isMapStampType(value)) return value;

  if (typeof value === 'string' && value in LEGACY_MAP_STAMP_TYPE_MAP) {
    return LEGACY_MAP_STAMP_TYPE_MAP[value as MapLegacyStampType];
  }

  return null;
}

function getMapStampOption(type: MapStampType): MapStampOption {
  return MAP_STAMP_OPTIONS.find(option => option.type === type) ?? MAP_STAMP_OPTIONS[0];
}

function getMapPlotSummaryLines(mapPlotData: MapPlotData | null): string[] {
  if (!mapPlotData) return [];

  const lat = getMapLatitude(mapPlotData);
  const lng = getMapLongitude(mapPlotData);

  const grouped = mapPlotData.stamps.reduce<Record<MapStampType, number>>(
    (acc, stamp) => {
      acc[stamp.type] = (acc[stamp.type] ?? 0) + 1;
      return acc;
    },
    Object.fromEntries(MAP_STAMP_OPTIONS.map(option => [option.type, 0])) as Record<MapStampType, number>
  );

  const typeSummary = MAP_STAMP_OPTIONS
    .filter(option => grouped[option.type] > 0)
    .map(option => `${option.label}: ${grouped[option.type]}`);
  const totalOutlinePoints = mapPlotData.outlines.reduce((sum, outline) => sum + outline.points.length, 0);
  const closedOutlines = mapPlotData.outlines.filter(outline => outline.isClosed).length;

  const lines = [
    `Address: ${mapPlotData.addressComponents?.formatted_address || mapPlotData.addressInput || 'N/A'}`,
    lat !== null && lng !== null
      ? `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
      : 'Coordinates: Not available',
    `Background: ${mapPlotData.backgroundMode === 'blank-grid' ? 'Blank Grid' : 'Satellite'}`,
    `View: ${mapPlotData.isViewSet ? 'Set' : 'Not Set'}`,
    `Camera: zoom ${mapPlotData.zoom}, heading ${Math.round(mapPlotData.heading)}°, tilt ${Math.round(mapPlotData.tilt)}°`,
    `Outlines: ${mapPlotData.outlines.length} (${closedOutlines} closed)`,
    `Outline Points: ${totalOutlinePoints}`,
    `Stamp Points: ${mapPlotData.stamps.length}`,
  ];

  if (typeSummary.length > 0) {
    lines.push(`Breakdown: ${typeSummary.join(' | ')}`);
  }

  return lines;
}

function buildMapPlotNote(mapPlotData: MapPlotData | null): string | null {
  if (!mapPlotData) return null;
  const lines = getMapPlotSummaryLines(mapPlotData);
  if (lines.length === 0) return null;
  return `Map & Plot:\n${lines.join('\n')}`;
}

function PestGlyph({
  type,
  color,
}: {
  type: MapPestStampType;
  color?: string;
}) {
  const iconStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: color ?? 'currentColor',
    flexShrink: 0,
  };
  const glyphSize = 32;

  switch (type) {
    case 'ant':
      return (
        <span style={iconStyle} aria-hidden="true">
          <svg width={glyphSize} height={glyphSize} viewBox="0 0 88 88" fill="none">
            <path d="M72.8234 15.9515C72.3984 16.953 72.1435 18.2189 71.9923 19.2015C71.8412 20.3919 71.8035 21.5633 71.8224 22.7537C71.8035 22.7537 71.7846 22.7537 71.7657 22.7537C71.7374 22.7537 71.7185 22.7632 71.6618 22.7537C71.4068 22.7726 71.133 22.7726 70.8213 22.7632H70.7269C70.2358 22.7632 69.7164 22.7159 69.1875 22.6687C69.0175 22.6593 68.857 22.6404 68.687 22.6309C68.517 22.6309 68.347 22.612 68.177 22.6026C67.9504 22.5931 67.7143 22.5742 67.4782 22.5742C67.4782 23.604 67.3365 24.5771 67.0815 25.4463C67.601 25.3707 68.1298 25.3329 68.6776 25.2856C69.3858 25.229 70.0941 25.1723 70.8496 25.0967C71.2368 25.0495 71.6146 25.0022 72.0301 24.8889C72.2284 24.8605 72.474 24.7755 72.7101 24.6621L73.1162 24.4637C73.2767 24.3409 73.4467 24.1992 73.5789 24.0575L73.8906 23.689L73.8056 23.245C73.5506 22.0263 73.4656 20.628 73.5411 19.3243C73.6639 18.115 73.9945 16.764 74.6366 15.6681L74.7027 15.5264C74.8727 15.1202 74.7027 14.6761 74.3061 14.5061C73.9189 14.3171 73.4089 14.5722 73.2862 14.9029L72.8329 15.9515H72.8234Z" fill="currentColor"/>
            <path d="M57.118 15.4796C57.1652 16.037 57.203 16.5566 57.2219 17.0856C58.0435 16.7266 58.9784 16.4054 59.9889 16.2259C59.9512 16.0748 59.9228 15.9142 59.885 15.763C59.8378 15.5268 59.7812 15.2812 59.7151 15.0544C59.5451 14.3648 59.3845 13.6846 59.2523 13.061C59.1768 12.7398 59.139 12.4186 59.1107 12.1446V11.9935C60.2911 11.8328 61.4338 11.5683 62.5765 11.2471C64.0309 10.7842 65.3814 10.1229 66.5808 9.26313C66.9302 9.0175 67.0341 8.52624 66.7885 8.17668C66.543 7.82713 66.0519 7.72319 65.7025 7.96883L65.5703 8.05386C65.4664 8.12944 65.3625 8.20502 65.2586 8.29004C64.862 8.58292 64.4748 8.88524 63.9837 9.0553C63.5209 9.29148 63.011 9.45209 62.4916 9.62215C62.3782 9.65994 62.2555 9.69772 62.1421 9.73551C60.8767 10.0378 59.4979 10.1795 58.2324 10.1134L57.7696 10.0851L57.458 10.4535C56.9197 11.2188 56.948 12.428 56.948 13.3255C56.9952 14.0813 57.0519 14.7899 57.1086 15.4985L57.118 15.4796Z" fill="currentColor"/>
            <path d="M53.5674 40.7701C54.4929 39.4096 55.0878 38.3326 55.475 37.3973L55.5128 37.4257L58.8843 36.9344C60.0648 36.7549 61.2452 36.651 62.4257 36.5376C63.0112 36.4809 63.6062 36.4337 64.1917 36.3676C65.3817 36.207 66.6471 36.1881 67.9221 36.1692C68.4887 36.1692 69.0553 36.1503 69.622 36.1314C69.7731 36.1219 69.9147 36.1503 70.0469 36.2353L70.0941 36.2825C72.1529 37.5768 74.3344 38.7956 76.5443 39.8442C77.6587 40.3638 78.7636 40.8457 79.9158 41.2236C80.4918 41.3936 81.0585 41.5637 81.644 41.6581C82.1917 41.7526 82.7584 41.7715 83.2589 41.6865L83.3344 41.6676C83.7122 41.592 84.0805 41.8377 84.1372 42.2061C84.2033 42.5746 83.9483 42.9336 83.58 42.9997C83.5517 42.9997 83.5328 43.0186 83.5328 43.0186C82.7773 43.0942 82.0784 43.1036 81.4268 42.9997C80.7657 42.8958 80.133 42.7635 79.5002 42.5935C78.2631 42.2628 77.0637 41.8093 75.8738 41.3464C73.6073 40.43 71.4635 39.3719 69.3198 38.2098C68.7342 38.276 68.1582 38.3137 67.5821 38.3515C66.5338 38.4271 65.495 38.5027 64.4089 38.7105C63.8423 38.805 63.2662 38.89 62.6902 38.9751C61.5569 39.1451 60.4142 39.3152 59.2904 39.5419L54.2568 40.5717L53.5768 40.7701H53.5674Z" fill="currentColor"/>
            <path d="M44.3493 16.9531C44.3871 17.4727 44.4249 17.9923 44.4721 18.512C44.5666 19.6079 44.6704 20.7132 44.6515 21.8847C44.6515 22.5555 44.6515 23.2357 44.6704 23.9065C44.6893 24.974 44.7082 26.0322 44.6704 27.0903L44.4816 32.2297L44.3966 32.9383C45.577 31.814 46.5687 31.0582 47.4092 30.5103L47.343 27.0997C47.3242 25.8999 47.2392 24.719 47.1542 23.538C47.1164 22.9523 47.0692 22.3571 47.0408 21.7619C46.9936 20.6093 46.8236 19.4095 46.6442 18.2191C46.5498 17.5956 46.4648 16.972 46.3892 16.3579C46.3798 16.2068 46.3231 16.0651 46.2192 15.9517L46.172 15.9139C44.5666 14.0905 43.0178 12.116 41.6295 10.0943C40.9401 9.07393 40.2979 8.04416 39.7313 6.98604C39.1363 5.94682 38.9002 4.41633 38.5036 3.43379C38.2014 2.91418 37.6631 3.037 37.4837 3.55661C37.172 6.19245 38.9286 8.61101 40.2129 10.9823C41.4879 13.0702 42.8761 15.0258 44.3682 16.9531H44.3493Z" fill="currentColor"/>
            <path d="M42.6402 73.9216C42.4136 74.2995 42.1964 74.6679 41.9508 75.0458L41.0914 87.2803C41.0631 87.7149 40.6853 88.0266 40.2793 87.9983C39.8732 87.97 39.5615 87.6204 39.5615 87.2142V87.0441L39.8637 74.7624C39.8637 74.649 39.8826 74.5545 39.9204 74.4601C40.0526 74.205 40.1848 73.9499 40.3265 73.6854C40.7798 72.8257 41.2425 71.9376 41.7147 71.1912L43.5752 68.2153L47.0411 62.8775L46.0306 59.3535L45.4734 57.3601C45.3695 56.8783 45.1806 56.4059 45.0012 55.9336C44.9256 55.7446 44.8501 55.5557 44.784 55.3667L43.2163 51.2193C44.0474 50.813 44.9634 50.2745 45.9267 49.5093L47.551 54.3653C47.6077 54.5259 47.6549 54.677 47.7116 54.8377C47.891 55.3573 48.0704 55.8674 48.1838 56.4248L48.7221 58.5694L49.7609 62.868C49.8364 63.1892 49.7609 63.5199 49.5909 63.7844L49.5531 63.8317L45.5584 69.5001L43.6224 72.3627C43.2446 72.9012 42.9424 73.4114 42.6402 73.9216Z" fill="currentColor"/>
            <path d="M67.1281 70.7092L60.423 61.2806L57.5709 48.6493C57.5048 48.3943 57.3726 48.1675 57.1554 47.988L54.8983 46.0702H54.8794C54.1333 45.4561 53.3778 44.8326 52.594 44.2846C52.3579 44.0862 52.0935 43.9067 51.8196 43.7178C51.7252 43.6516 51.6307 43.5949 51.5363 43.5288C50.9413 44.2563 50.2991 45.0593 49.5342 45.9001C49.5814 45.9474 49.6381 45.9852 49.6947 46.0135C49.7797 46.0607 49.8647 46.1174 49.9497 46.1647C50.2519 46.3442 50.5636 46.5331 50.8469 46.7598C51.5741 47.2417 52.3107 47.7802 53.0284 48.3092L53.104 48.3659L55.0116 49.8114L58.3642 62.0175L58.402 62.0459C58.402 62.0459 58.4681 62.3009 58.5531 62.4049L65.8248 71.7106C66.0893 72.0507 66.5898 72.1263 66.9392 71.8807C67.3075 71.6162 67.3831 71.1154 67.1281 70.747V70.7186V70.7092Z" fill="currentColor"/>
            <path d="M22.6668 31.6634H22.6479C22.5063 31.6445 22.3835 31.5973 22.2796 31.5406L11.9292 25.8627C11.542 25.6454 11.3909 25.1447 11.6081 24.7573C11.8253 24.37 12.288 24.2188 12.6847 24.4078L23.0635 29.5094L35.9638 30.2747C36.2282 30.303 36.4832 30.4069 36.691 30.577L38.9481 32.4948C39.6658 33.1372 40.3741 33.7891 41.0824 34.4788C41.3846 34.7622 41.6868 35.0834 41.9984 35.3952L39.9963 37.7665C39.9585 37.7098 39.9113 37.6626 39.8641 37.6248L39.7602 37.5114C39.4864 37.2091 39.2314 36.9068 38.9386 36.6139C38.3059 35.9337 37.6542 35.2913 36.9932 34.6394L35.2555 32.9955L22.6763 31.6729L22.6668 31.6634Z" fill="currentColor"/>
            <path d="M35.7652 44.8419C36.0296 43.9539 36.4168 42.9523 37.0118 41.8848L31.9499 41.0818C31.7893 41.0535 31.6193 41.0251 31.4588 40.9968C30.9205 40.9023 30.3916 40.8078 29.8155 40.7889L27.6151 40.6094L23.2143 40.2788C22.8837 40.2599 22.5721 40.3638 22.3266 40.6094L22.2982 40.6472L17.3685 45.5127L14.8659 47.884C14.3937 48.3375 13.9404 48.7248 13.4965 49.1027C13.166 49.3862 12.8355 49.6601 12.4955 49.9719L0.586793 52.7494C0.19015 52.8438 -0.0553902 53.2313 0.0107169 53.6375C0.0957117 54.0532 0.48291 54.3271 0.89844 54.2515L1.06843 54.2233L13.1188 51.937L13.2227 51.9086C13.2227 51.9086 13.3454 51.8708 13.4021 51.833C13.6288 51.663 13.8649 51.4835 14.1009 51.304C14.8753 50.7182 15.6781 50.1135 16.3297 49.5278L18.9551 47.2038L23.6581 42.9145L27.294 43.3398L29.3433 43.5665C29.8344 43.6043 30.3444 43.7082 30.8638 43.8121C31.0527 43.8499 31.2416 43.8876 31.421 43.9254L35.7557 44.8041L35.7746 44.8514L35.7652 44.8419Z" fill="currentColor"/>
            <path d="M22.5261 68.1017C22.5261 68.1017 22.5067 68.1017 22.4971 68.092L22.5454 68.1404C22.5454 68.1404 22.5357 68.121 22.5261 68.1114V68.1017Z" fill="currentColor"/>
            <path d="M35.718 65.1924C32.8943 68.5179 28.5029 70.7097 22.5249 68.1022C19.0118 62.6415 20.4472 57.9367 23.2615 54.6112C27.5207 49.5946 30.5238 49.5473 33.2059 49.5096C34.5186 49.4907 35.7557 49.4718 37.0212 48.8766C37.0212 48.8199 37.0212 48.7537 37.0307 48.6876C37.1062 47.1666 37.2668 44.2095 40.1283 40.5628C46.7956 32.0601 49.3266 31.3893 51.1304 30.9075C51.9236 30.6996 52.5847 30.5201 53.3969 29.7265C54.0202 29.103 54.4452 28.6495 54.7568 28.3094C54.8135 28.2527 54.8607 28.196 54.9079 28.1488C52.5092 26.1081 51.5176 24.058 55.824 20.1562C58.1283 18.0494 62.5385 17.1141 64.4084 18.7013C66.2783 20.2885 66.0894 24.7477 64.3707 27.4213C61.1975 32.3246 59.0349 31.6538 56.6456 29.6226C56.6078 29.6698 56.57 29.7265 56.5228 29.7738C56.23 30.1517 55.8428 30.6524 55.3329 31.3704C54.6813 32.2962 54.6151 32.9765 54.5302 33.7984C54.3507 35.6595 54.1052 38.267 46.8051 46.2313C43.6508 49.6607 40.7799 50.2937 39.2972 50.6149C39.2311 50.6244 39.1744 50.6432 39.1178 50.6527C38.7211 52.0226 38.9006 53.2602 39.0989 54.5639C39.4955 57.2092 39.9394 60.1758 35.6991 65.1829L35.718 65.1924Z" fill="currentColor"/>
          </svg>
        </span>
      );
    case 'termite':
      return (
        <span style={iconStyle} aria-hidden="true">
          <svg width={glyphSize} height={glyphSize} viewBox="0 0 83 86" fill="none">
            <g>
              <path d="M61.9081 1.32898C61.7743 1.57374 61.5583 1.85768 61.2715 2.16836C61.0087 2.4781 60.7 2.83755 60.3081 3.21226C60.1359 3.38749 59.9564 3.56546 59.772 3.74834L59.7709 3.74943L59.7698 3.75054C59.5485 3.96996 59.3199 4.19668 59.0883 4.43392C58.6505 4.85835 58.1803 5.36787 57.7358 5.92426C57.2924 6.50456 56.9389 7.23695 56.7279 7.93976C56.5055 8.655 56.3547 9.3674 56.2155 10.0674C56.0501 10.8748 55.8893 11.6773 55.7322 12.4606C55.4526 13.8556 55.1852 15.1894 54.9268 16.3805C55.4374 16.2765 55.9376 16.2088 56.4407 16.2128C56.661 15.0376 56.8867 13.7376 57.118 12.4051L57.1184 12.4028C57.2384 11.7118 57.3598 11.0121 57.4828 10.3166L57.4866 10.2953C57.7388 8.88045 57.9737 7.56265 58.6984 6.62853C59.073 6.12279 59.4735 5.66393 59.8988 5.22802C60.3118 4.78064 60.7257 4.35716 61.0937 3.9834C61.4617 3.60963 61.8048 3.2129 62.0896 2.8544C62.3993 2.51886 62.6258 2.19859 62.7806 1.88116C63.116 1.29316 63.3061 0.962352 63.3061 0.962352C63.4399 0.717589 63.3556 0.409616 63.1221 0.263198C62.8762 0.105299 62.5683 0.189323 62.4106 0.435031L62.3304 0.522023C62.3304 0.522023 62.1746 0.815549 61.8717 1.31845L61.9081 1.32898Z" fill="currentColor"/>
              <path d="M44.1293 9.06089L38.7823 21.8925L38.6514 22.209L40.6945 31.5512L41.0501 31.166C41.681 30.4825 42.4152 29.9865 43.2031 29.632L41.1726 22.3726L45.7363 9.41638L45.8327 9.13717L45.7513 8.90092L44.5854 5.24725C44.4752 4.89241 44.1078 4.69142 43.7521 4.77734C43.3849 4.87569 43.1603 5.24378 43.2476 5.62348L44.1408 9.04846L44.1293 9.06089Z" fill="currentColor"/>
              <path d="M54.7671 40.3471L54.7722 40.3335L54.7607 40.3459L54.7671 40.3471Z" fill="currentColor"/>
              <path d="M54.7669 40.347C54.4645 41.1445 54.0424 41.9226 53.4152 42.6021L53.0596 42.9874L62.5353 44.2769L62.8403 44.1211L75.2032 37.7649L78.6887 38.3813C79.0502 38.4389 79.4001 38.2094 79.4812 37.847C79.5738 37.4721 79.3431 37.0982 78.9567 37.0177L75.2215 36.1478L74.9794 36.0854L74.7089 36.2039L62.1466 41.7778L54.7669 40.347Z" fill="currentColor"/>
              <path d="M70.7194 26.4989C71.5399 26.2629 72.3831 26.0204 73.2333 25.774C73.9199 25.5792 74.6178 25.372 75.313 25.093C76.0091 24.838 76.711 24.4271 77.2415 23.9271C77.7491 23.4521 78.2309 22.9301 78.6189 22.4598C78.9825 22.0191 79.3368 21.6103 79.6717 21.224L79.6724 21.2232L79.7391 21.1462C80.0813 20.7256 80.4149 20.3891 80.7026 20.1023C80.9894 19.7917 81.255 19.5537 81.4883 19.4007C81.9654 19.0586 82.2206 18.8569 82.2206 18.8569L82.3009 18.7699C82.5342 18.617 82.5934 18.3033 82.4402 18.0699C82.2871 17.8365 81.9495 17.778 81.7162 17.931C81.7162 17.931 81.4016 18.147 80.8423 18.5283C80.5383 18.708 80.2496 18.9708 79.9275 19.2949C79.5929 19.6074 79.2239 19.9573 78.8818 20.3779C78.5352 20.7534 78.1793 21.1613 77.8035 21.5919L77.7367 21.6685C77.3123 22.1283 76.9108 22.5633 76.4367 22.9771C75.5635 23.7742 74.2687 24.1137 72.8786 24.4783L72.8577 24.4837C72.5021 24.5765 72.1458 24.6692 71.7904 24.7618C70.1444 25.1903 68.5174 25.6138 67.076 26.0056C67.1203 26.5068 67.1053 27.0222 67.0186 27.5405L67.0434 27.5635C68.1688 27.2324 69.4159 26.8738 70.7194 26.4989Z" fill="currentColor"/>
              <path d="M47.9937 62.4532L37.0736 78.7022L37.0488 78.6793L37.0486 78.6804C36.6873 80.6936 36.3259 82.7076 35.9885 84.7199C35.9408 85.0212 35.6617 85.2238 35.3604 85.1758C35.083 85.127 34.8801 84.8476 34.9163 84.5588C35.0752 83.3635 35.2179 82.1609 35.3607 80.9571L35.3608 80.956L35.361 80.9547C35.4654 80.0743 35.5699 79.1934 35.6809 78.3143L35.7 78.1938L35.7898 78.0466L45.7074 61.5858L44.2457 53.8848C44.8772 52.6266 45.6273 51.3397 46.5448 50.0461L48.1635 61.6203L48.2307 62.0966L47.9937 62.4532Z" fill="currentColor"/>
              <path d="M56.9817 73.5566L54.7724 69.8604L56.3982 52.0754L56.4582 51.4863L55.973 51.0385L50.2787 45.8518C49.5073 46.6127 48.8296 47.322 48.2217 47.9807L53.8564 52.583L53.2336 70.0051L53.2203 70.2691L53.3476 70.4556L55.908 74.2457C56.0995 74.5374 56.4859 74.6179 56.7785 74.4507C57.0825 74.2711 57.1856 73.8599 56.9942 73.5681L56.9817 73.5566Z" fill="currentColor"/>
              <path d="M34.1805 38.6342C32.952 39.6407 31.7417 40.5028 30.5256 41.2214L30.5131 41.2099L22.7199 40.3689L7.10504 51.5713L6.96546 51.6726L6.83444 51.6897C6.05471 51.8524 5.27305 52.01 4.49098 52.1676L4.48951 52.1679C3.21177 52.4254 1.93295 52.6832 0.659647 52.9638C0.363201 53.0354 0.0800017 52.843 0.00811189 52.5466C-0.0398677 52.2491 0.128307 51.9671 0.424753 51.8955C1.71029 51.5819 2.98506 51.2488 4.26269 50.9149C4.96474 50.7314 5.66766 50.5477 6.3737 50.3669L21.6849 38.1708L22.0214 37.906L34.1805 38.6342Z" fill="currentColor"/>
              <path d="M37.9255 34.736L38.063 34.5772L32.426 29.3284L31.9408 28.8806L31.3585 28.9875L13.7604 32.0306L9.89939 30.124C9.59422 29.9804 9.21555 30.0912 9.05981 30.3847C8.88113 30.7031 8.99228 31.0818 9.31086 31.2608L13.2935 33.5099L13.4896 33.6218L13.7641 33.599L31.0806 31.5848L36.1189 36.8333L36.1054 36.7979C36.6733 36.1827 37.2795 35.4824 37.9255 34.736Z" fill="currentColor"/>
              <path d="M39.8168 57.176C38.5515 60.3061 37.3349 63.3158 34.9049 66.2294L34.8561 66.2074C26.5666 76.162 13.9736 79.4981 10.6523 76.4326C7.34241 73.3547 9.63662 60.5361 18.9089 51.4884C21.6208 48.8433 24.5185 47.3902 27.5305 45.8797C30.4161 44.4326 33.4066 42.9329 36.4394 40.282C37.6254 39.2423 38.8455 37.8173 40.219 36.2132C41.0817 35.2055 42.005 34.1272 43.0184 33.0292C44.0966 31.861 45.7452 31.4725 47.4486 31.5488C47.7069 30.6172 47.8951 29.7133 48.0756 28.8468C48.5448 26.594 48.9615 24.5935 50.4194 23.0139C52.1284 21.1622 54.6538 18.476 58.015 19.277C58.1496 18.7568 58.3444 18.2462 58.6588 17.7309C58.8394 17.4603 59.1003 17.1027 59.2982 16.9632C59.6233 16.7109 59.9368 16.471 60.3767 16.3937C60.8166 16.3164 61.3246 16.44 61.6212 16.6677C61.9302 16.907 62.0958 17.1518 62.2011 17.3871C62.4004 17.8324 62.4157 18.2313 62.4258 18.4958C62.4263 18.5108 62.4269 18.5254 62.4275 18.5396C62.4506 18.8141 62.3971 18.9719 62.3971 18.9719C62.3971 18.9719 62.2966 18.8561 62.109 18.66C61.9339 18.4753 61.6717 18.2103 61.3876 17.9941L61.3789 17.9875C61.2454 17.8869 61.1009 17.7779 60.9838 17.7825C60.8858 17.7669 60.8448 17.7887 60.7886 17.8184C60.7757 17.8253 60.762 17.8325 60.7467 17.8398C60.6759 17.8666 60.5249 17.9803 60.4092 18.0807L59.9389 18.5902C59.8911 18.6662 59.8414 18.7432 59.7911 18.8213C59.5812 19.1468 59.359 19.4914 59.2003 19.8647C59.5852 20.2813 59.8809 20.8725 60.1729 21.4564C60.3181 21.7466 60.4623 22.0349 60.6161 22.2991C60.8919 22.4313 61.1896 22.5534 61.4893 22.6763C62.092 22.9235 62.7023 23.1738 63.156 23.5157C63.5026 23.3395 63.8308 23.0877 64.1383 22.8518C64.216 22.7922 64.2923 22.7336 64.3673 22.6775L64.8376 22.168C64.9284 22.0447 65.0182 21.8974 65.0507 21.8123C65.0568 21.7964 65.0629 21.7822 65.0687 21.7688C65.0938 21.7105 65.1122 21.6678 65.0888 21.5714C65.0725 21.4642 64.9586 21.3131 64.8457 21.1859C64.6074 20.9199 64.3223 20.6797 64.1242 20.5199C63.9283 20.3797 63.8181 20.2828 63.7949 20.2619C63.8044 20.2638 63.8281 20.2578 63.8644 20.2486C63.9371 20.2302 64.06 20.1992 64.2187 20.1929C64.4932 20.1701 64.8872 20.1425 65.3856 20.3263C65.641 20.424 65.8984 20.5695 66.1615 20.8584C66.4362 21.1349 66.5761 21.6322 66.5342 22.0769C66.4924 22.5216 66.2783 22.8533 66.0643 23.1851C65.9474 23.3827 65.6396 23.6525 65.401 23.8617L65.3627 23.8954C64.8741 24.2499 64.3808 24.485 63.873 24.6607C64.9402 27.9471 62.4646 30.6792 60.7555 32.5309C59.304 34.1036 57.354 34.6808 55.1625 35.3294C54.3061 35.5829 53.4128 35.8473 52.498 36.1863C52.6988 37.8905 52.4549 39.5525 51.3767 40.7207C50.3694 41.8121 49.3726 42.8142 48.4395 43.7524C46.9501 45.2499 45.6228 46.5844 44.6733 47.8587C42.2775 51.0884 41.025 54.1871 39.8168 57.176Z" fill="currentColor"/>
              <path d="M63.79 20.2578C63.79 20.2578 63.7915 20.2592 63.7946 20.2619C63.7916 20.2614 63.7901 20.26 63.79 20.2578Z" fill="currentColor"/>
            </g>
          </svg>
        </span>
      );
    case 'cockroach':
      return (
        <span style={iconStyle} aria-hidden="true">
          <svg width={glyphSize} height={glyphSize} viewBox="0 0 88 88" fill="none">
            <g>
              <path d="M56.2326 46.8709C56.2326 46.8709 56.4485 46.481 56.714 45.8305C57.0063 45.1025 57.1616 44.3264 57.1616 44.3264L62.2819 48.0893L62.6625 48.3761L62.6149 48.866L61.3866 63.7286L63.1385 66.3854C63.2695 66.5985 63.2104 66.93 62.9876 67.1202C62.7482 67.3403 62.4423 67.3392 62.2817 67.1213L60.2527 64.4447L60.1481 64.3131L60.1459 64.0837L60.5846 49.69L56.2266 46.8653L56.2326 46.8709Z" fill="currentColor"/>
              <path d="M39.4638 31.8251C39.4638 31.8251 39.8377 31.5826 40.4681 31.2723C41.1739 30.93 41.9373 30.721 41.9373 30.721L37.8264 25.8756L37.5138 25.5159L37.0283 25.5976L22.2877 27.8596L19.5151 26.2974C19.2934 26.1816 18.9668 26.2636 18.7926 26.4991C18.5897 26.7533 18.6122 27.0584 18.8408 27.2034L21.6524 29.0408L21.791 29.1359L22.02 29.1221L36.348 27.6804L39.4698 31.8308L39.4638 31.8251Z" fill="currentColor"/>
              <path d="M45.3265 75.5496L55.7286 60.2373L55.9521 59.9001L55.8952 59.449L48.6717 57.6245C48.6717 57.6245 48.056 58.3579 47.4371 58.9972C46.8181 59.6366 46.0789 60.3684 46.0789 60.3684L52.9582 60.9283L44.1101 74.9156L44.0267 75.0538L44.0073 75.1721C43.7524 77.1401 42.4892 85.4442 42.2166 87.4069C42.179 87.6788 42.3708 87.9486 42.6371 87.9923C42.9212 88.0412 43.191 87.8494 43.2338 87.5596C43.5616 85.6597 44.9509 77.4277 45.3022 75.527L45.3265 75.5496Z" fill="currentColor"/>
              <path d="M12.2341 44.8952L26.7835 33.4504L27.1044 33.2039L27.5582 33.2292L29.665 40.3213L27.2363 43.0476L26.2932 36.2561L12.9572 46.0584L12.8251 46.1512L12.7084 46.1788C10.763 46.5704 2.56726 48.4097 0.628334 48.8186C0.35968 48.8751 0.0771492 48.7026 0.0150316 48.44C-0.0535775 48.16 0.118931 47.8775 0.405007 47.8145C2.27745 47.355 10.3925 45.3949 12.2641 44.9118L12.2398 44.8892L12.2341 44.8952Z" fill="currentColor"/>
              <path d="M20.729 59.8772C23.8719 56.7141 39.6767 41.4602 48.6961 37.433C48.22 34.7492 45.4688 31.1036 44.8366 31.0257C39.9948 30.3535 31.2506 39.9013 28.3472 43.1854C22.2424 50.1466 19.2189 56.9001 18.749 61.9761C19.2622 61.3404 19.933 60.6698 20.729 59.8772ZM44.4385 60.3965C40.4019 64.2497 22.322 78.3712 18.9582 64.9339C18.7827 63.781 19.6389 62.8628 21.6858 60.8263C23.2696 59.3473 40.5254 42.5131 49.2392 38.4965C49.9325 38.3017 53.6707 39.7184 56.2174 41.718C56.2174 41.718 56.1729 42.9727 55.753 44.5934C54.1751 49.6139 48.4812 56.549 44.4385 60.3965Z" fill="currentColor"/>
              <path d="M52.4429 27.977C52.4429 27.977 53.6144 29.6834 55.5397 31.4106C57.4649 33.1377 59.0973 34.0573 59.0973 34.0573C59.0973 34.0573 59.1979 35.2539 58.4314 37.5634C57.6648 39.8728 57.0105 41.0134 57.0105 41.0134C57.0105 41.0134 55.136 39.7317 53.8353 39.0417C51.6773 37.8934 49.8478 37.5631 49.8478 37.5631C49.8478 37.5631 49.4608 35.5763 48.1561 33.4275C47.2571 31.941 45.5977 30.2458 45.5977 30.2458C45.5977 30.2458 47.5728 29.1884 48.8446 28.7145C50.8948 27.9546 52.4425 27.9653 52.4425 27.9653L52.4429 27.977Z" fill="currentColor"/>
              <path d="M61.3425 32.1492C60.2196 34.024 58.813 33.1671 56.1827 30.7939C53.413 28.302 52.5865 27.0425 54.1239 25.7474C56.2272 23.9796 58.1128 25.0787 59.8156 26.6665C61.5183 28.2543 62.7262 29.8241 61.3364 32.1435L61.3425 32.1492Z" fill="currentColor"/>
              <path d="M47.422 28.2408L46.4235 22.8985L37.7364 19.4248L36.4825 15.5269C36.4825 15.5269 36.1259 14.751 35.7553 15.2582C35.4014 15.7353 36.795 20.2637 36.795 20.2637L44.9806 24.0313L45.3965 29.0351C45.7324 28.8822 46.5962 28.5167 46.9451 28.3986L47.4337 28.2404L47.422 28.2408Z" fill="currentColor"/>
              <path d="M58.8362 38.8847L64.2352 39.5081L68.3063 47.9318L72.2822 48.9107C72.2822 48.9107 73.0811 49.2123 72.601 49.6173C72.1498 50.0037 67.5352 48.9294 67.5352 48.9294L63.2057 41.0266L58.1851 40.9607C58.3142 40.615 58.6186 39.7277 58.712 39.3715L58.8358 38.873L58.8362 38.8847Z" fill="currentColor"/>
              <path d="M57.9023 24.3111L56.8222 24.0429C56.8222 24.0429 59.036 20.2181 58.0021 14.3651C56.7265 7.14988 52.3209 0.26748 52.3209 0.26748C52.3209 0.26748 52.2195 0.0592275 52.3353 0.0081158C52.4512 -0.042996 52.5879 0.164025 52.5879 0.164025C52.5879 0.164025 56.7452 6.50796 58.2888 11.9607C60.3766 19.3535 57.9084 24.3168 57.9084 24.3168L57.9023 24.3111Z" fill="currentColor"/>
              <path d="M62.1349 28.2582L62.4778 29.3169C62.4778 29.3169 66.139 26.8417 72.0498 27.4648C79.3304 28.2283 86.5094 32.1488 86.5094 32.1488C86.5094 32.1488 86.7242 32.2354 86.7671 32.1163C86.81 31.9971 86.594 31.8752 86.594 31.8752C86.594 31.8752 79.9755 28.1705 74.4284 27.0111C66.9079 25.4441 62.1289 28.2525 62.1289 28.2525L62.1349 28.2582Z" fill="currentColor"/>
            </g>
          </svg>
        </span>
      );
    case 'spider':
      return (
        <span style={iconStyle} aria-hidden="true">
          <svg width={glyphSize} height={glyphSize} viewBox="0 0 88 88" fill="none">
            <g>
              <path d="M15.1176 44.5563C16.8175 41.6683 18.6804 38.5905 20.8957 35.8932C21.9965 34.5784 23.2872 33.2368 24.4552 32.4512C25.5414 31.937 27.3322 32.1564 28.8379 32.4977C31.0897 33.0162 33.1918 33.8194 35.1041 34.6225C38.1983 34.2466 41.305 34.6713 44.1257 35.9776C44.5224 33.5221 45.7062 30.959 47.554 29.0618C47.6912 27.9764 47.8961 26.8233 48.1691 25.6297C48.4148 24.5444 48.7012 23.4457 49.0554 22.3335C49.3824 21.2755 49.8319 20.0142 50.2535 19.2684C50.2425 19.2137 50.4089 19.0705 50.595 18.9104C50.6391 18.8723 50.6847 18.8331 50.729 18.7942L51.3946 18.1845C51.5739 18.0273 51.7465 17.8595 51.9188 17.692C52.1775 17.4405 52.4352 17.1899 52.7124 16.9785C53.0299 16.7457 53.3345 16.5065 53.6368 16.2691C54.214 15.8159 54.7825 15.3694 55.4153 14.9873C57.1573 13.7906 58.9113 12.8266 60.4329 11.9903L60.6705 11.8597C62.2592 11.0069 63.6036 10.2082 64.5135 9.57154C64.8047 9.36655 65.0366 9.15608 65.2294 8.98101C65.3423 8.87847 65.442 8.78807 65.5322 8.71802C65.7497 8.5012 65.8855 8.39282 65.8855 8.39282C66.1029 8.176 66.1576 7.82327 65.9544 7.5652C65.7513 7.30712 65.3578 7.2659 65.0997 7.4691L64.991 7.57752C64.991 7.57752 64.8688 7.6452 64.665 7.82134C64.5892 7.87805 64.5084 7.94633 64.4181 8.02268C64.2494 8.16518 64.0474 8.33586 63.7821 8.51222C62.9266 9.04029 61.6231 9.7442 59.9937 10.5562L59.7493 10.678C58.1732 11.4628 56.3395 12.376 54.4808 13.5343C53.8116 13.913 53.1604 14.3819 52.4951 14.8609C52.1614 15.1012 51.8242 15.344 51.4794 15.5793C51.1634 15.8093 50.8849 16.0555 50.6035 16.3041C50.4375 16.4509 50.2703 16.5987 50.0939 16.7444L49.4011 17.327L49.048 17.6251C48.9664 17.6793 48.7083 17.9639 48.5995 18.1265C48.2175 18.709 48.0117 19.1713 47.7983 19.651C47.7534 19.7519 47.7081 19.8534 47.6609 19.9571C47.4159 20.5267 47.1844 21.1099 46.9802 21.6931C46.5581 22.8459 46.2037 23.9852 45.9037 25.1246C45.2903 27.3628 44.894 29.5197 44.7286 31.4463C44.7122 31.5763 44.7104 31.7015 44.7086 31.8246C44.7074 31.9071 44.7062 31.9888 44.7007 32.0704L43.1179 28.3098L42.9834 27.9779C42.3778 26.4847 41.7677 24.9807 41.2518 23.4768C40.9814 22.6623 40.7246 21.8614 40.5221 21.0605C40.4423 20.7278 40.3818 20.3951 40.3243 20.0788L40.2929 19.9068L40.2529 19.4047C40.253 19.3464 40.2606 19.3106 40.267 19.2801C40.2755 19.2398 40.2822 19.2088 40.2667 19.147L40.3212 19.0114C40.5801 18.2111 40.8932 17.411 41.3013 16.6244C41.4316 16.3348 41.5987 16.0526 41.7646 15.7723C41.824 15.6721 41.8832 15.5719 41.9405 15.4719C42.0961 15.1721 42.2831 14.8882 42.4717 14.602C42.5305 14.5128 42.5895 14.4233 42.6476 14.333C43.6265 12.8417 44.7681 11.4049 45.9505 10.0088L49.606 5.84787C49.7122 5.72272 49.8191 5.59759 49.9265 5.47207C50.4237 4.89064 50.9279 4.30107 51.3863 3.66557C51.5766 3.42158 51.7548 3.14139 51.9331 2.86121C52.0223 2.72111 52.1114 2.58099 52.2021 2.44541L52.5423 1.72669C52.6156 1.52846 52.6569 1.28199 52.6968 1.04293C52.7089 0.971284 52.7207 0.900205 52.7333 0.831387C52.788 0.560077 52.6255 0.288486 52.3678 0.193169C52.0694 0.0842292 51.7436 0.246636 51.6346 0.545013L51.5257 0.843389C51.5007 0.91785 51.4901 0.983806 51.4792 1.05034C51.4664 1.12924 51.4535 1.20895 51.4165 1.3046L51.158 1.83346C51.0996 1.9175 51.0421 2.00231 50.9844 2.08735C50.8001 2.35891 50.6141 2.63282 50.3968 2.89084C49.8396 3.58214 49.2145 4.25978 48.5895 4.91029L44.7714 8.93534C43.5077 10.3042 42.2846 11.7409 41.1699 13.2863L41.1116 13.3676C40.8576 13.722 40.5952 14.0881 40.3678 14.4658C40.2835 14.606 40.1943 14.7446 40.1047 14.8837C39.9344 15.1484 39.7626 15.4152 39.6199 15.6996C39.1576 16.5132 38.7765 17.381 38.4496 18.2762C38.3407 18.6017 38.2452 18.9951 38.2313 19.28L38.2438 20.0806C38.2974 20.5692 38.3647 21.0442 38.4726 21.5057C38.675 22.415 38.8909 23.2838 39.1612 24.1525C39.6746 25.8629 40.2559 27.5326 40.878 29.1889L41.5 30.8179C41.2997 30.6171 41.0882 30.4274 40.8691 30.231C40.7472 30.1218 40.623 30.0105 40.4971 29.8939C38.6675 28.2225 36.5125 26.3066 34.0318 24.363C33.7739 24.1938 33.545 24.021 33.3139 23.8467C32.9135 23.5445 32.5065 23.2373 31.9305 22.9355L31.2661 22.5954C31.2141 22.5745 31.1801 22.5557 31.1441 22.5358C31.0863 22.5037 31.0233 22.4689 30.8727 22.4184L30.5743 22.3638L29.991 22.241L29.2584 22.1586C27.3861 21.9933 25.6624 22.3846 24.0334 22.8981C20.7618 23.9658 17.856 25.6174 15.1809 27.1473C14.0978 27.7776 13.057 28.4014 12.0604 28.9987C10.5953 29.8766 9.22535 30.6977 7.95663 31.3986C5.83835 32.5628 3.96481 33.3474 2.68911 33.5085C1.63206 33.6613 1.10255 33.3771 0.933092 33.2862C0.893687 33.2649 0.873753 33.2543 0.871182 33.2619C0.600013 33.0987 0.247114 33.1797 0.083936 33.4509C-0.0792443 33.722 0.00170906 34.0749 0.272878 34.2381C0.272878 34.2381 0.503395 34.3605 0.923804 34.5375C1.35784 34.6737 2.03611 34.8103 2.82325 34.7028C4.41102 34.5556 6.39312 33.7711 8.61991 32.6343C10.0926 31.9002 11.6784 31.018 13.3612 30.0818C14.2229 29.6024 15.1099 29.1089 16.0202 28.6138C18.7088 27.1791 21.601 25.6766 24.6144 24.812C26.094 24.3934 27.6683 24.124 29.0113 24.3021L29.4863 24.3707L30.0695 24.5207L30.3543 24.5888L30.4628 24.6975L30.8559 24.9287C31.1805 25.1 31.5586 25.4006 31.9329 25.698C32.153 25.873 32.3718 26.0469 32.5776 26.1929C34.8682 28.1091 36.9554 30.0657 38.69 31.7776C39.8012 32.8918 40.7634 33.8564 41.5629 34.6852C40.6001 34.2362 39.5422 33.7735 38.3624 33.2698C35.8264 32.2217 32.8427 31.051 29.3699 30.368C28.5016 30.204 27.5927 30.0807 26.6294 30.0659C25.6659 30.0783 24.621 30.1176 23.5483 30.6996C21.7963 31.9321 20.6819 33.3148 19.513 34.7787C17.2704 37.7203 15.4887 40.9067 13.8837 43.8627C13.503 44.5703 13.1315 45.2672 12.7678 45.9493C11.5985 48.1427 10.5109 50.1826 9.4633 51.9305C8.10344 54.2084 6.78488 56.0385 5.57616 56.8646C4.58662 57.5823 3.88638 57.547 3.68238 57.5367C3.63998 57.5345 3.61902 57.5335 3.62135 57.5405C3.35 57.513 3.10547 57.7298 3.07799 58.0011C3.0505 58.2725 3.26729 58.517 3.53863 58.5445C3.53863 58.5445 3.80998 58.572 4.31212 58.5048C4.8007 58.424 5.47948 58.1807 6.17215 57.6795C7.55749 56.6771 9.01175 54.8472 10.4666 52.556C11.5832 50.8295 12.7312 48.8411 13.9564 46.7187C14.3572 46.0243 14.7664 45.3157 15.1854 44.5971L15.1176 44.5563Z" fill="currentColor"/>
              <path d="M53.722 86.2497C53.722 86.2497 53.3019 85.7471 53.48 84.4311C53.6309 83.1423 54.434 81.2843 55.6036 79.1691C56.3773 77.7444 57.3214 76.1862 58.3341 74.5148L58.3382 74.5079C58.8375 73.684 59.3533 72.8325 59.8736 71.9559C61.4375 69.2848 63.0696 66.3832 64.1457 63.1145C64.65 61.4733 65.0593 59.7641 64.8988 57.8914L64.8184 57.1585L64.697 56.5749L64.6295 56.2899C64.5795 56.1392 64.5449 56.0762 64.513 56.0183C64.4931 55.9823 64.4744 55.9482 64.4536 55.8961L64.1153 55.2309C63.8017 54.6201 63.4753 54.1858 63.1491 53.7519C62.9967 53.5491 62.8442 53.3464 62.6933 53.1258C60.7697 50.6266 58.8457 48.4802 57.1791 46.6462C56.8539 46.293 56.5558 45.9669 56.2577 45.6409L57.8851 46.2672L58.249 46.399C59.7844 46.9556 61.3332 47.5171 62.9171 47.997C63.7716 48.2559 64.6396 48.5013 65.5621 48.6925C66.0098 48.788 66.4846 48.8564 66.9866 48.925L67.7871 48.9395C68.072 48.9263 68.4793 48.8183 68.7915 48.7237C69.6875 48.3992 70.5563 48.0204 71.3711 47.5602C71.6559 47.4182 71.9232 47.2472 72.1883 47.0776C72.3276 46.9883 72.4664 46.8995 72.6068 46.8154C72.9852 46.5892 73.3519 46.3276 73.7068 46.0746L73.7884 46.0164C75.3367 44.9058 76.7766 43.6864 78.1487 42.4263L82.1836 38.6186C82.3143 38.4987 82.4441 38.3788 82.5732 38.2593C83.1153 37.758 83.6484 37.2651 84.2078 36.8166C84.4727 36.593 84.7374 36.4153 85.0023 36.2375C85.0905 36.1783 85.1788 36.119 85.2671 36.0581L85.7967 35.8009C85.8924 35.7643 85.9721 35.7516 86.0511 35.739C86.1176 35.7283 86.1836 35.7177 86.2581 35.693L86.5568 35.5849C86.8147 35.4902 86.9779 35.219 86.924 34.9475C86.8702 34.6218 86.5719 34.4315 86.2598 34.4718C86.191 34.4842 86.12 34.4959 86.0485 34.5076C85.8093 34.547 85.5623 34.5878 85.3639 34.6606L84.6444 34.9989C84.5086 35.0891 84.3697 35.1764 84.231 35.2637C83.9533 35.4382 83.6756 35.6127 83.4221 35.8114C82.7853 36.2682 82.1945 36.7709 81.6117 37.2666C81.486 37.3737 81.3605 37.4804 81.2351 37.5862L77.0647 41.2308C75.6656 42.4095 74.2393 43.5339 72.7319 44.5224C72.6416 44.5804 72.5519 44.6391 72.4625 44.6976C72.1758 44.8855 71.8914 45.0718 71.5912 45.2265C71.4262 45.3117 71.2659 45.4063 71.1063 45.5005C70.8854 45.631 70.6658 45.7607 70.4371 45.8628C69.6495 46.2688 68.8622 46.5664 68.0477 46.8367L67.9119 46.8908C67.9119 46.8908 67.7897 46.9042 67.654 46.904L67.152 46.8626L66.9801 46.8309C66.664 46.7725 66.3315 46.7112 65.9989 46.6305C65.1986 46.426 64.3984 46.1671 63.5846 45.8946C61.9707 45.3362 60.3568 44.6964 58.7565 44.0158L55 42.4234C55.1016 42.4168 55.2066 42.4135 55.3117 42.4102C55.4167 42.407 55.5224 42.4037 55.6241 42.397C57.5376 42.2503 59.682 41.846 61.9489 41.2384C63.0755 40.9277 64.2158 40.5764 65.3832 40.1708C65.967 39.968 66.5371 39.7517 67.1209 39.4946C67.2247 39.4477 67.3264 39.4027 67.4274 39.358C67.9076 39.1458 68.3704 38.9412 68.9539 38.5607C69.1169 38.4524 69.4022 38.1949 69.4565 38.1136L69.7556 37.7612L70.3399 37.07C70.4943 36.8831 70.653 36.7006 70.8126 36.5173C71.0465 36.2485 71.2824 35.9774 71.5086 35.6874C71.7474 35.3374 71.9973 34.9921 72.2459 34.6488C72.7189 33.9955 73.187 33.3491 73.5615 32.6913C74.7738 30.7652 75.7125 28.8777 76.505 27.2844L76.5537 27.1862C77.3565 25.5454 78.0501 24.2572 78.6076 23.4031C78.7897 23.135 78.9606 22.9332 79.0994 22.7694C79.1782 22.6764 79.2466 22.5957 79.3007 22.522C79.4638 22.3323 79.5589 22.2102 79.5589 22.2102L79.6677 22.1019C79.8444 21.8442 79.8313 21.4779 79.5873 21.2605C79.3569 21.0295 78.9499 21.0562 78.7324 21.3001C78.7324 21.3001 78.6101 21.422 78.4063 21.6524C78.3563 21.709 78.2972 21.7713 78.2321 21.8399C78.0322 22.0508 77.7758 22.3213 77.5501 22.669C76.9112 23.5774 76.1225 24.9061 75.252 26.5061C74.3679 28.0925 73.3479 29.923 72.1107 31.7532C71.7558 32.3377 71.3408 32.862 70.9205 33.3932C70.6486 33.7368 70.3743 34.0834 70.1126 34.4508C69.838 34.7856 69.5253 35.1128 69.2144 35.4381C69.11 35.5473 69.0058 35.6564 68.9033 35.7655L68.2918 36.4296C68.2112 36.5099 68.1307 36.5976 68.0591 36.6757C67.9376 36.8082 67.8418 36.9125 67.8162 36.9039C67.0694 37.3235 65.8069 37.7697 64.7482 38.0939C63.6486 38.4318 62.5355 38.7288 61.4497 38.9717C60.2553 39.2415 59.1017 39.4436 58.016 39.5778C56.1275 41.4072 53.5614 42.5844 51.0913 42.9882C52.3767 45.8258 52.8069 48.9201 52.423 52.0134C53.221 53.9276 54.0053 56.0454 54.5317 58.2849C54.8825 59.8052 55.0837 61.583 54.5667 62.6678C53.7917 63.8473 52.4466 65.1347 51.1155 66.2184C48.3988 68.4402 45.3298 70.2816 42.4374 71.974C41.8001 72.3422 41.1694 72.7038 40.5487 73.0597C38.3394 74.3265 36.2581 75.5197 34.4663 76.6722C32.1712 78.1482 30.3376 79.5705 29.3317 80.9533C28.8287 81.6446 28.5836 82.3227 28.5015 82.8111C28.4467 83.2995 28.4599 83.5846 28.4599 83.5846C28.4866 83.856 28.717 84.0598 29.002 84.0466C29.2734 84.0198 29.4909 83.7758 29.4641 83.5044C29.4711 83.5067 29.47 83.4858 29.4681 83.4434C29.4583 83.2394 29.4248 82.539 30.145 81.5514C30.9743 80.3448 32.8079 79.0309 35.0892 77.677C36.6512 76.7463 38.4523 75.7906 40.381 74.7672C41.2858 74.2871 42.2189 73.792 43.1685 73.2776C46.1422 71.6667 49.3332 69.9205 52.267 67.6718C53.734 66.5068 55.133 65.3823 56.3565 63.6471C56.9413 62.5759 56.9834 61.5312 56.9982 60.5678C56.9859 59.6044 56.8649 58.695 56.7033 57.8265C56.0293 54.3519 54.8527 51.3788 53.8247 48.8264C53.3242 47.6453 52.8642 46.5863 52.4177 45.6223C53.2444 46.424 54.2201 47.3751 55.3177 48.5028C57.0252 50.2417 58.9764 52.334 60.8866 54.6296C61.0317 54.8352 61.2064 55.0558 61.382 55.2775C61.6817 55.6559 61.9842 56.0376 62.1463 56.3545L62.3765 56.7483C62.3765 56.7483 62.4712 56.9519 62.4849 56.857L62.5524 57.142L62.7009 57.7257L62.7546 58.2143C62.9292 59.5578 62.6557 61.1315 62.2332 62.6099C61.3608 65.6211 59.851 68.5094 58.4092 71.1942C57.9117 72.1033 57.4159 72.9891 56.9343 73.8494C55.9937 75.5297 55.1074 77.1133 54.3696 78.584C53.2405 80.7943 52.4373 82.788 52.286 84.3753C52.1765 85.1622 52.3384 85.8408 52.4464 86.2752C52.6358 86.7096 52.7441 86.9269 52.7441 86.9269C52.9065 87.1984 53.2593 87.2804 53.5308 87.1179C53.8024 86.9554 53.8843 86.6027 53.7219 86.3311L53.722 86.2497Z" fill="currentColor"/>
              <path d="M63.0667 26.5447C62.6582 27.6026 62.1956 28.6331 61.7329 29.6638L61.57 29.7179C61.3936 29.7584 61.2035 29.8123 61.0134 29.8664C60.6199 29.9609 60.2127 30.0146 59.8056 30.0684L59.792 30.0819C60.1305 30.6387 60.3604 31.2225 60.5361 31.8061C60.8344 31.7524 61.1334 31.6984 61.4454 31.6309C61.6626 31.5769 61.8933 31.5094 62.1377 31.4283C62.1919 31.4067 62.2419 31.3894 62.2919 31.3721C62.3669 31.3461 62.4418 31.3202 62.5313 31.2796L62.7486 31.1713C62.8708 31.1036 62.9795 31.0223 63.0746 30.9275L63.1969 30.8055L63.265 30.6292C63.3915 30.2891 63.5149 29.9501 63.6378 29.6125L63.6382 29.6113C63.9513 28.7511 64.2611 27.8996 64.6129 27.0623L64.6265 27.0488C64.7898 26.6419 64.5733 26.1803 64.1665 26.0169C63.7596 25.8535 63.298 26.0701 63.1346 26.477L63.1073 26.5583L63.0667 26.5447Z" fill="currentColor"/>
              <path d="M55.9051 24.337C55.9731 24.215 56.0547 24.1066 56.1498 24.0117L56.2177 23.944L56.3942 23.8763C56.8126 23.7182 57.2362 23.5653 57.6605 23.412C58.4338 23.1326 59.2109 22.852 59.9646 22.5376C60.3719 22.3481 60.8465 22.5523 61.0088 22.9596C61.1847 23.3805 60.9941 23.8416 60.5868 24.0039L60.5054 24.0309C59.7781 24.3096 59.0699 24.6203 58.3589 24.9322C58.0351 25.0743 57.7099 25.2169 57.3828 25.3567L57.3283 25.5194C57.2602 25.6957 57.2193 25.8721 57.1784 26.0755C57.0964 26.4554 57.0281 26.8759 56.9732 27.2829C56.4174 26.9429 55.8478 26.698 55.251 26.5344C55.2801 26.4128 55.3043 26.2861 55.3288 26.1578C55.3617 25.9856 55.3952 25.81 55.442 25.6391C55.4966 25.422 55.5647 25.1914 55.6465 24.9473C55.6683 24.8931 55.6857 24.8431 55.7031 24.7933C55.7293 24.7184 55.7554 24.6435 55.7963 24.554L55.9051 24.337Z" fill="currentColor"/>
              <path d="M48.2606 38.656C47.5017 37.9766 46.6883 37.4057 45.8477 36.8889C46.0677 34.6639 47.0886 32.1007 48.9499 30.2441C51.9798 27.2222 55.1002 27.579 57.3092 29.7665C59.4773 31.9946 59.8397 35.1024 56.8098 38.1243C54.9484 39.9809 52.3825 40.9953 50.157 41.2095C49.6424 40.3675 49.0736 39.5527 48.3961 38.792L48.2606 38.656Z" fill="currentColor"/>
              <path d="M38.4088 18.2083C38.3818 18.2353 38.3545 18.3168 38.3545 18.3168V18.3439L38.4088 18.2083Z" fill="currentColor"/>
              <path d="M45.5173 61.7741C51.3731 55.9334 52.7558 46.4505 47.0381 39.9842C40.5867 34.2498 31.1001 35.6079 25.2443 41.4485C20.1222 46.5574 19.4035 56.7333 23.9002 63.0622C30.2174 67.5753 40.4087 66.8694 45.5173 61.7741Z" fill="currentColor"/>
            </g>
          </svg>
        </span>
      );
    case 'mosquito':
      return (
        <span style={iconStyle} aria-hidden="true">
          <svg width={glyphSize} height={glyphSize} viewBox="0 0 88 88" fill="none">
            <path d="M47.9075 44.4507C45.459 46.7339 42.5949 47.6415 41.5099 46.478C40.425 45.3145 41.5302 42.5207 43.9786 40.2375C46.427 37.9543 49.2911 37.0467 50.3761 38.2102C51.4611 39.3737 50.3559 42.1675 47.9075 44.4507Z" fill="currentColor"/>
            <path d="M26.8525 60.7522C26.4367 60.9824 25.9795 60.5181 26.2421 60.0975C30.1071 54.0151 33.8163 50.0412 38.8679 45.9789C39.0648 45.8195 39.359 45.9269 39.416 46.1766C39.6882 47.3527 40.5073 48.231 41.6615 48.5846C41.9067 48.659 41.9903 48.9567 41.8206 49.1452C37.4155 53.9074 33.1895 57.3271 26.8556 60.7554L26.8525 60.7522Z" fill="currentColor"/>
            <path d="M44.0238 37.8868C43.6243 38.1867 43.2237 38.5178 42.8283 38.8805C36.7383 35.295 33.4202 35.9109 26.8832 28.9008C21.4674 23.0931 16.8728 16.1439 18.5559 14.5744C19.3698 13.8154 22.6326 14.9476 25.8935 18.4446L44.0238 37.8868Z" fill="currentColor"/>
            <path d="M71.7316 71.5984C70.0486 73.1679 63.4368 68.0998 58.021 62.292C51.484 55.2819 52.3268 52.0117 49.1779 45.6896C49.5673 45.3205 49.9286 44.9472 50.2525 44.5664L68.3828 64.0087C71.6437 67.5056 72.5456 70.8394 71.7316 71.5984Z" fill="currentColor"/>
            <path d="M45.8838 35.6554L43.5367 24.9139C43.3539 24.1391 43.3963 24.3601 50.6342 18.8649L56.3133 3.57747C56.722 2.48136 58.3817 3.0908 57.9758 4.19641C57.9758 4.19641 52.2486 19.868 51.9103 20.1228L45.3912 25.069L47.6075 35.2478C47.8778 36.3894 46.1541 36.797 45.8806 35.6585L45.8838 35.6554Z" fill="currentColor"/>
            <path d="M52.6052 42.8633L63.1569 45.9539C63.917 46.1904 63.6995 46.1327 69.6862 39.2957L85.3356 34.7001C86.4576 34.3688 85.9654 32.6707 84.8341 32.9985C67.936 37.9649 68.8013 37.6185 68.5234 37.9382L63.1345 44.0965L53.1351 41.1754C52.0152 40.8262 51.4883 42.5172 52.605 42.8695L52.6052 42.8633Z" fill="currentColor"/>
            <path d="M0.910322 43.9594L17.1182 44.5204L27.2978 39.0329C27.6559 38.8383 39.9149 40.1188 39.9149 40.1188C41.0825 40.1812 40.9952 41.9471 39.8243 41.8877L27.9194 40.7073C27.9194 40.7073 17.6888 46.309 17.2941 46.2954L0.848078 45.7262C-0.323503 45.6856 -0.261039 43.9126 0.910541 43.9532L0.910322 43.9594Z" fill="currentColor"/>
            <path d="M41.1873 87.1512L41.7583 70.9437L47.9425 61.1716C48.1616 60.828 47.726 48.5342 47.726 48.5342C47.7452 47.365 45.9775 47.3289 45.9551 48.5011L46.3156 60.4348C46.3156 60.4348 40.0138 70.2497 39.9999 70.6444L39.4205 87.09C39.3793 88.2616 41.1523 88.323 41.1936 87.1514L41.1873 87.1512Z" fill="currentColor"/>
            <path d="M0.750296 59.808L14.4315 56.4176L22.0127 50.3477C22.1612 50.2274 35.3962 44.0114 35.5712 43.9391C36.6505 43.484 37.3426 45.1169 36.2633 45.572L23.0244 51.8098C14.8946 58.3185 15.3537 58.0176 15.0468 58.0917L1.17569 61.532C0.0367137 61.8125 -0.388906 60.0947 0.750296 59.808Z" fill="currentColor"/>
            <path d="M25.3662 86.2053L29.7027 72.7939L36.2866 65.6546C36.417 65.5149 43.5411 52.7457 43.6254 52.5761C44.1547 51.5312 42.574 50.7269 42.0448 51.7718L34.8987 64.5434C27.8387 72.1994 28.1708 71.7624 28.0756 72.0633L23.676 85.6607C23.3168 86.7773 25.0007 87.3217 25.3662 86.2053Z" fill="currentColor"/>
            <path d="M55.6571 32.0859L65.8788 22.554C66.7317 21.7586 67.9287 23.0358 67.0726 23.8341L56.8509 33.366C55.9948 34.1644 54.801 32.8842 55.6571 32.0859Z" fill="currentColor"/>
            <path d="M54.4754 34.3815C53.7168 33.568 52.4292 33.5266 51.612 34.2887C50.7948 35.0507 50.7465 36.3318 51.5081 37.1485C52.2667 37.962 53.5543 38.0034 54.3682 37.2444C55.1822 36.4854 55.2337 35.2013 54.4754 34.3815Z" fill="currentColor"/>
          </svg>
        </span>
      );
    case 'rodent':
      return (
        <span style={iconStyle} aria-hidden="true">
          <svg width={glyphSize} height={glyphSize} viewBox="0 0 63 74" fill="none">
            <g>
              <path d="M42.9937 35.7141C42.9992 35.7171 43.0048 35.7202 43.0104 35.7232L42.9952 35.7097L42.9937 35.7141Z" fill="currentColor"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M37.7689 30.1975C38.969 32.6675 40.8359 34.5306 42.9936 35.7138C40.387 43.2629 37.8282 50.4618 34.2546 53.705C28.0794 59.3282 13.7346 57.7504 7.18402 52.1125C0.789129 46.2987 -2.52684 32.2534 2.301 25.4384C5.12542 21.4591 12.0748 18.0209 19.3084 14.442L19.5925 14.3015C20.919 16.7561 23.2052 18.8046 26.1268 19.8988C29.9133 21.3136 32.9102 19.7553 34.1413 17.4193C32.058 18.2693 29.5121 18.3441 27.0587 17.4288C22.3504 15.6691 19.7496 10.9369 21.2786 6.87732C22.793 2.80476 27.4327 4.34686 32.1556 6.11947C32.6661 6.30961 33.1343 6.48851 33.6025 6.66741C43.1595 0.349283 49.1575 -0.17525 51.5592 1.94928C53.9608 4.07381 54.1749 9.91059 49.3276 19.8459C49.8523 20.7283 50.3722 21.7636 50.9265 22.9075C53.1273 27.4427 55.115 31.8942 51.2104 33.7999C47.3057 35.7056 42.3531 33.573 40.1523 29.0378C38.9655 26.6022 38.8346 23.9764 39.5606 21.7688C37.7387 23.5037 36.0605 26.6992 37.7689 30.1975ZM38.8796 6.36781C38.3086 7.01319 38.3671 7.97997 39.0114 8.54996C39.6557 9.11996 40.6224 9.05999 41.1933 8.41462C41.7643 7.76925 41.7058 6.80247 41.0614 6.23248C40.4172 5.66248 39.4505 5.72245 38.8796 6.36781ZM48.574 12.8781C47.9296 12.3081 46.9629 12.3681 46.392 13.0135C45.8211 13.6588 45.8795 14.6256 46.5239 15.1956C47.1682 15.7656 48.1349 15.7057 48.7058 15.0602C49.2767 14.4149 49.2183 13.4481 48.574 12.8781Z" fill="currentColor"/>
              <path d="M52.7225 50.799C51.9756 53.1188 50.9558 55.511 49.6125 57.8263L49.6272 57.8392C48.2985 60.1674 46.6155 62.3651 44.76 64.4625C42.8622 66.5488 40.6637 68.4734 38.1476 69.9604C35.6315 71.4473 32.8272 72.5223 29.9292 72.9654C27.0312 73.4086 24.0964 73.244 21.3966 72.6074C15.94 71.3101 11.5382 68.2006 8.64381 64.8035C7.18198 63.092 6.11479 61.259 5.43927 59.4849C4.76375 57.7108 4.50587 55.9662 4.6254 54.5032C4.64262 54.1001 4.6908 53.7505 4.75364 53.414C4.82743 53.488 4.89979 53.5636 4.97216 53.6392C5.1168 53.7904 5.26146 53.9416 5.41763 54.0798L5.47622 54.1316C6.27998 54.8165 7.20552 55.4522 8.1976 56.0422C8.30588 56.6871 8.47438 57.4113 8.78435 58.1822C9.3097 59.536 10.2025 61.0055 11.399 62.4562C13.7905 65.3299 17.6018 68.074 22.2103 69.3269C24.5071 69.9469 27.0016 70.1665 29.4774 69.8466C31.9677 69.5396 34.4117 68.6949 36.678 67.4315C38.9588 66.181 40.9921 64.5022 42.8056 62.6292C44.6175 60.7284 46.2554 58.7 47.5551 56.5814C48.8824 54.4613 49.901 52.2771 50.671 50.1084C51.328 48.2575 51.7946 46.4284 52.2385 44.6886C52.3147 44.3898 52.3903 44.0936 52.466 43.8003L52.5058 43.6465C53.0076 41.7024 53.4841 39.8567 54.2526 38.2691C55.0137 36.6416 56.1865 35.4044 57.2788 34.6712C58.3016 33.9846 59.2254 33.6689 59.8627 33.4511C59.9061 33.4363 59.948 33.4219 59.9886 33.4079C60.6432 33.2288 60.9842 33.1382 60.9842 33.1382C61.3252 33.0478 61.6847 33.2612 61.7746 33.6021C61.8645 33.9431 61.6636 34.2883 61.3226 34.3788L61.2966 34.4082C61.2966 34.4082 60.9831 34.4969 60.3985 34.6856C60.3267 34.7146 60.2503 34.7445 60.1699 34.776C59.6137 34.9939 58.8639 35.2876 58.0996 35.868C57.2249 36.5322 56.3425 37.5295 55.7502 38.9665C55.1156 40.3921 54.7398 42.2037 54.3352 44.2251C53.9306 46.2463 53.4695 48.4792 52.7225 50.799Z" fill="currentColor"/>
            </g>
          </svg>
        </span>
      );
    case 'wasp':
      return (
        <span style={iconStyle} aria-hidden="true">
          <svg width={glyphSize} height={glyphSize} viewBox="0 0 88 88" fill="none">
            <path d="M62.6741 19.7599L64.4696 14.7543L60.2166 11.8254C59.2517 11.154 60.2634 9.7113 61.2189 10.3733L66.1184 13.7426C66.4867 13.9987 66.6054 14.4858 66.3962 14.8823L64.2322 20.5811C63.6889 21.6116 62.1245 20.7903 62.671 19.7567L62.6741 19.7599Z" fill="currentColor"/>
            <path d="M47.5734 25.2556L47.0613 19.8223L47.0594 19.8019C47.0567 19.7735 47.0543 19.7477 47.0535 19.7218C47.0462 19.4756 47.1887 19.225 48.6894 16.5857L48.69 16.5846C49.3474 15.4284 50.2654 13.8141 51.5454 11.5411L51.7921 6.91659C51.8545 5.7549 53.6156 5.84241 53.5563 7.01332L53.2971 11.844L53.2963 11.8606L53.2957 11.8759C53.2952 11.8893 53.2947 11.9019 53.2937 11.9144C53.2807 12.0895 53.185 12.2585 51.7514 14.7901C51.0989 15.9423 50.1693 17.5838 48.8443 19.9379L49.3314 25.0963C49.4345 26.2611 47.6796 26.4172 47.5702 25.2525L47.5734 25.2556Z" fill="currentColor"/>
            <path d="M56.8096 26.8107C57.0688 24.3969 59.2577 22.2204 61.7589 22.4859C63.7043 22.6951 65.3062 24.3032 65.5154 26.2424C65.7808 28.7436 63.6044 30.9326 61.1906 31.1917C60.1789 29.2994 58.5738 27.7568 56.8096 26.8107Z" fill="currentColor"/>
            <path d="M57.7744 19.9816C59.2171 19.407 60.7096 19.7256 60.9876 20.7092L60.9907 20.7123C59.061 20.8247 57.3029 21.952 56.2037 23.5508C54.8985 22.7576 55.8134 20.7623 57.7744 19.9816Z" fill="currentColor"/>
            <path d="M42.3303 32.828L28.8219 25.0276C22.5767 21.4554 15.0294 21.2837 8.63741 24.5718C7.81616 24.9934 7.41022 25.9613 7.73186 26.7263C8.91845 29.5492 10.5984 31.8911 13.3557 34.5673C16.1129 37.2496 20.0817 38.433 24.2442 37.8116L41.7432 35.707C43.2046 35.5321 43.6263 33.5743 42.3335 32.8248L42.3303 32.828Z" fill="currentColor"/>
            <path d="M55.17 45.6681L62.9702 59.1764C66.5456 65.4185 66.7174 72.9659 63.4293 79.3641C63.0077 80.1854 62.0397 80.5913 61.2746 80.2697C58.4518 79.0831 56.1099 77.4031 53.4338 74.6458C50.7514 71.8885 49.568 67.9197 50.1894 63.7573L52.2941 46.2582C52.4689 44.7969 54.4268 44.3753 55.1762 45.6681H55.17Z" fill="currentColor"/>
            <path d="M20.5098 54.9797C22.0898 53.0749 23.7136 51.345 25.1468 49.8867C27.6012 55.676 32.332 60.4006 38.115 62.855C36.6567 64.2882 34.9268 65.912 33.022 67.492C26.9642 65.6371 22.3646 61.0313 20.5098 54.9797Z" fill="currentColor"/>
            <path d="M19.2007 56.6191C17.5146 58.8112 16.1812 60.9128 15.2163 62.8831C16.9993 67.3766 20.4498 70.9332 25.1181 72.7849C27.0853 71.8232 29.1869 70.4897 31.3821 68.8004C25.6771 66.6864 21.3179 62.3272 19.2007 56.6191Z" fill="currentColor"/>
            <path d="M67.2922 27.0137C68.2759 27.2916 68.5943 28.7842 68.0198 30.2268C67.2391 32.1878 65.2438 33.1027 64.4507 31.7975C66.0494 30.6984 67.1766 28.9403 67.2891 27.0105L67.2922 27.0137Z" fill="currentColor"/>
            <path d="M30.8824 44.6938C29.5503 45.5079 29.0226 46.0314 27.109 47.9293C26.9233 48.1135 26.7246 48.3105 26.5107 48.5221C28.7778 54.4239 33.5741 59.2202 39.479 61.4904C39.7155 61.2507 39.934 61.0301 40.1365 60.8255L40.1399 60.822C41.9824 58.9607 42.503 58.4347 43.3073 57.1187C38.4547 54.0585 33.9457 49.5557 30.8824 44.6938Z" fill="currentColor"/>
            <path d="M41.2184 37.5557C41.0092 37.5775 40.8405 37.7461 40.8218 37.9522C40.3253 43.5635 44.444 47.6698 50.046 47.1764C50.2521 47.1576 50.4207 46.989 50.4425 46.7798L50.4446 46.76C50.5468 45.803 50.6388 44.941 51.4823 44.0975C52.8782 42.7017 55.0859 42.9047 56.2256 44.1381C56.3849 44.3161 56.6628 44.3379 56.8439 44.1756C61.7214 39.7602 61.584 33.4775 58.0772 29.9208C54.5206 26.4142 48.2411 26.2799 43.8226 31.1543C43.6602 31.3292 43.6821 31.6071 43.8601 31.7726C45.0935 32.9123 45.2933 35.1231 43.9007 36.5158C43.0572 37.3593 42.1889 37.452 41.2278 37.5547L41.2184 37.5557Z" fill="currentColor"/>
            <path d="M39.6946 42.7954C37.4807 42.3863 34.8577 42.7798 32.4502 43.8696C35.3354 48.4098 39.5915 52.6659 44.1318 55.5512C45.2185 53.1405 45.615 50.5207 45.206 48.3067C42.6298 47.3106 40.6938 45.3746 39.6946 42.7954Z" fill="currentColor"/>
            <path d="M14.0456 73.9587C12.9776 71.3981 13.0588 68.4254 14.2704 65.0967L14.2735 65.0998C16.1939 68.9437 19.251 71.9071 22.9076 73.7338C19.5789 74.9454 16.603 75.0234 14.0456 73.9587Z" fill="currentColor"/>
            <path d="M68.1759 40.9374L62.7426 40.4253L62.7457 40.4285C61.581 40.3191 61.7371 38.5642 62.9018 38.6672L68.0603 39.1544C70.4143 37.8295 72.0556 36.9 73.2078 36.2475C75.7397 34.8137 75.9087 34.7179 76.0838 34.705C76.0962 34.704 76.1088 34.7035 76.1221 34.703L76.1373 34.7024L76.1542 34.7015L80.9849 34.4424C82.1558 34.383 82.2433 36.1442 81.0816 36.2066L76.4571 36.4533C74.1834 37.7337 72.5688 38.6518 71.4125 39.3093C68.7732 40.8099 68.5225 40.9525 68.2764 40.9452C68.2505 40.9444 68.2247 40.942 68.1963 40.9393L68.1759 40.9374Z" fill="currentColor"/>
            <path d="M41.0749 29.7802L37.0966 22.6044L32.3784 18.648C31.4791 17.9049 32.6157 16.5435 33.5119 17.296L38.3832 21.3804C38.6299 21.5833 42.6767 29.0401 42.6767 29.0401C43.167 30.0986 41.5651 30.845 41.0718 29.7833L41.0749 29.7802Z" fill="currentColor"/>
            <path d="M65.3965 50.905L58.2207 46.9267V46.933C57.1591 46.4397 57.9054 44.8377 58.9639 45.328C58.9639 45.328 66.4207 49.3749 66.6237 49.6215L70.7049 54.4897C71.4574 55.3859 70.0961 56.5225 69.3529 55.6232L65.3965 50.905Z" fill="currentColor"/>
            <path d="M73.247 23.532L68.2414 25.3276C67.2078 25.8741 66.3866 24.3096 67.4171 23.7663L73.1158 21.6023C73.5124 21.3931 73.9995 21.5118 74.2555 21.8802L77.628 26.7828C78.29 27.7382 76.8474 28.75 76.1759 27.7851L73.247 23.532Z" fill="currentColor"/>
            <path d="M6.74487 52.3069L15.1603 50.0367C14.4546 48.6003 14.3297 46.2272 16.1283 44.4286C17.9777 42.5791 19.7559 42.5528 24.5389 42.4818C25.5946 42.4662 26.7969 42.4483 28.1785 42.4082C29.3494 42.3738 29.4118 44.1287 28.2471 44.1756C27.633 44.1999 27.1174 44.2157 26.6802 44.2289C24.3117 44.301 24.2381 44.3033 23.226 45.231C21.1344 47.1521 19.9613 48.4224 19.1394 49.3125C18.4664 50.0412 18.0287 50.5152 17.515 50.8828C16.5595 51.5665 15.3408 51.8824 11.8556 52.7857C10.6191 53.1063 9.09734 53.5007 7.20077 54.0118C6.07351 54.3147 5.61136 52.6097 6.74175 52.3038L6.74487 52.3069Z" fill="currentColor"/>
            <path d="M37.9646 72.8412L35.6945 81.2566L35.6976 81.2597C35.3916 82.3902 33.6867 81.9279 33.9895 80.8007C35.9412 73.5585 36.1923 71.7811 37.1185 70.4866C37.9352 69.3453 39.2765 68.5795 42.7703 64.7756C43.6981 63.7633 43.7003 63.6901 43.7724 61.3217C43.7857 60.8843 43.8014 60.3687 43.8257 59.7544C43.8725 58.5896 45.6274 58.652 45.5932 59.8231C45.5531 61.2047 45.5352 62.4069 45.5196 63.4626C45.4486 68.2456 45.4222 70.0238 43.5728 71.8732C41.7742 73.6718 39.401 73.5469 37.9646 72.8412Z" fill="currentColor"/>
          </svg>
        </span>
      );
    case 'bed-bug':
      return (
        <span style={iconStyle} aria-hidden="true">
          <svg width={glyphSize} height={glyphSize} viewBox="0 0 78 81" fill="none">
            <g>
              <path d="M47.5353 4.905L47.5069 4.72309L47.4766 4.69713L47.5804 4.57573C47.8593 4.18086 48.1395 3.78922 48.4193 3.39814C49.1378 2.39385 49.8537 1.39328 50.5369 0.351221C50.6516 0.186489 50.8594 0.127794 51.0242 0.242419C51.1889 0.357046 51.2476 0.564918 51.133 0.729649C50.4202 1.7754 49.7266 2.8531 49.0365 3.92542C48.8284 4.24879 48.6204 4.5719 48.4125 4.89327C48.8064 6.67545 49.1721 8.45982 49.5248 10.2594L49.9718 13.0855C49.9985 13.4279 50.034 13.7678 50.0695 14.1072C50.1333 14.7166 50.1969 15.3245 50.2086 15.9422C50.2052 16.2767 50.2154 16.6102 50.2255 16.9431C50.2446 17.5693 50.2636 18.1934 50.1921 18.8186C50.1583 19.1482 50.1349 19.477 50.1116 19.8052C50.0681 20.4152 50.0248 21.0232 49.9156 21.6303C49.4432 21.3838 48.8992 21.1288 48.3142 20.8912C48.3989 20.403 48.4585 19.9168 48.5182 19.4306C48.548 19.1875 48.5779 18.9444 48.6108 18.7011C48.6974 18.1505 48.7099 17.5953 48.7225 17.0391C48.7305 16.6826 48.7386 16.3258 48.7661 15.9696C48.7843 15.3545 48.7524 14.7432 48.7204 14.132C48.7045 13.8264 48.6885 13.5207 48.6788 13.2146L48.3922 10.4468C48.1499 8.61033 47.8491 6.75008 47.5353 4.905Z" fill="currentColor"/>
              <path d="M58.4834 28.0398C58.059 28.1595 57.6333 28.2795 57.2152 28.4261L57.1589 28.4305C56.8334 27.8894 56.4842 27.4067 56.1675 26.9782C56.7869 26.7635 57.4053 26.6233 58.0263 26.4825C58.304 26.4196 58.5822 26.3565 58.8613 26.2866C59.4576 26.1295 60.0778 26.0485 60.7004 25.9672C61.0342 25.9237 61.3686 25.88 61.7004 25.8245C62.2978 25.7509 62.9041 25.7167 63.5124 25.6824C63.8611 25.6627 64.2104 25.643 64.5592 25.6158L67.4204 25.6193C69.2659 25.6738 71.0724 25.7737 72.8941 25.8866C73.19 25.6219 73.4868 25.3579 73.7838 25.0938L73.7849 25.0928L73.7875 25.0905L73.7889 25.0892C74.726 24.2557 75.6653 23.4202 76.5858 22.5537C76.7308 22.415 76.9301 22.4277 77.0818 22.5575C77.2206 22.7025 77.223 22.9148 77.078 23.0536C76.3155 23.7583 75.5651 24.483 74.8126 25.2098C74.3264 25.6793 73.8393 26.1497 73.3475 26.6161L73.2437 26.7375L73.0596 26.7377C71.1882 26.7136 69.319 26.7177 67.4519 26.7499L64.6732 26.8958C64.3692 26.9336 64.0648 26.9652 63.7604 26.9968C63.1516 27.06 62.5428 27.1232 61.9379 27.2365C61.6273 27.3058 61.3104 27.3632 60.992 27.4209C60.4116 27.5261 59.8254 27.6323 59.2635 27.8132C59.0053 27.8927 58.7446 27.9662 58.4834 28.0398Z" fill="currentColor"/>
              <path d="M36.1086 12.0276L33.8124 16.0024C33.674 16.2256 33.6397 16.5116 33.7461 16.7865L33.7656 16.8558L35.736 22.5091C36.6977 22.4908 37.5815 22.5635 38.3982 22.684L35.836 16.5244L37.7359 12.7364L37.7749 12.6909C37.7749 12.6909 37.8332 12.5305 37.8396 12.4309L38.1571 9.41771C38.1956 9.00397 37.9267 8.64253 37.5107 8.57581C37.0948 8.5091 36.6922 8.79542 36.6255 9.21136L36.1497 12.0103L36.1086 12.0276Z" fill="currentColor"/>
              <path d="M63.5694 42.3488L57.679 41.2784L57.6834 41.3347C57.5524 40.3818 57.3566 39.5048 57.0981 38.7318L63.5802 40.3084L67.0281 37.8443L67.067 37.7988C67.1341 37.7511 67.2987 37.6816 67.2987 37.6816L70.2262 36.901C70.642 36.7836 71.0581 37.0344 71.1755 37.4502C71.2777 37.8529 71.0528 38.2387 70.6674 38.3821L67.9761 39.2859L64.4052 42.1703C64.178 42.3438 63.8986 42.3939 63.6408 42.3573L63.5694 42.3488Z" fill="currentColor"/>
              <path d="M55.4715 62.0155L55.452 61.9462L53.1758 53.824C52.4469 54.8298 51.6747 55.8247 50.8592 56.8089L52.6059 61.9556L39.4258 74.3845L39.3869 74.43C39.2419 74.5688 39.1447 74.7747 39.147 74.9869L39.2926 79.5786C39.3037 79.9035 39.5661 80.1805 39.9062 80.1823C40.2614 80.1971 40.5513 79.9195 40.5661 79.5643L40.7199 75.36L55.0224 63.3394C55.3946 63.0271 55.5674 62.5179 55.4282 62.0047L55.4715 62.0155Z" fill="currentColor"/>
              <path d="M68.1532 57.7268L71.7869 59.1006L71.7436 59.0898C72.0924 59.2043 72.2791 59.6004 72.1365 59.9515C72.0221 60.3003 71.6389 60.4718 71.29 60.3574L67.3466 59.0077C67.1862 58.9494 67.0648 58.8456 66.9977 58.7092L66.9672 58.6832L61.4177 49.9948L56.2314 49.0536C56.761 48.035 57.1651 47.0404 57.4023 46.0872L62.5025 47.5591L62.6325 47.5915C62.938 47.6951 63.196 47.9158 63.3306 48.1885L68.1532 57.7268Z" fill="currentColor"/>
              <path d="M28.2358 25.1334C29.16 24.4523 30.067 23.9142 30.985 23.5169L28.7404 18.7064L28.6883 18.583C28.5537 18.3103 28.3239 18.0874 27.9902 17.9859L17.8198 14.6998L15.8995 11.3229C15.7194 11.0112 15.3272 10.886 15.0003 11.0531C14.6734 11.2202 14.5504 11.6405 14.7175 11.9674L16.662 15.654C16.7293 15.7904 16.8507 15.8943 17.011 15.9526L17.0414 15.9786L26.4849 20.1145L28.2185 25.0922L28.2358 25.1334Z" fill="currentColor"/>
              <path d="M21.4196 31.6274L16.0644 30.6994L16.047 30.6582L5.81092 45.6053L5.78496 45.6356C5.67252 45.8285 5.46904 45.9435 5.27195 45.9589L0.71319 46.5267C0.362346 46.5682 0.0458706 46.3238 0.00435455 45.973C-0.0349641 45.6503 0.196474 45.349 0.516968 45.2815L4.64663 44.478L14.3055 28.4854C14.5823 28.0389 15.0759 27.8305 15.5611 27.8776L15.6326 27.8862L24.0094 28.8761C23.1288 29.7521 22.2655 30.6692 21.4196 31.6274Z" fill="currentColor"/>
              <path d="M45.9932 32.5444L54.2662 35.8368C55.2186 35.1536 56.1705 34.1021 56.2952 33.1576C56.5339 31.4961 54.5057 28.5525 53.3196 27.3277L53.631 26.7794C54.0723 26.2635 53.7047 24.8192 53.1952 24.2782C52.5818 23.8586 51.098 23.7194 50.6566 24.2353L50.1784 24.6409C48.7717 23.6741 45.5645 22.1396 43.9578 22.6048C43.0029 22.8917 42.0749 24.0687 41.5649 25.1566L45.991 32.5163L45.9932 32.5444Z" fill="currentColor"/>
              <path d="M54.0797 37.6215C55.0628 39.5136 56.4033 43.4456 54.0324 48.4601L54.0454 48.4449C50.2157 56.5474 41.4366 64.5683 31.4677 67.6824C28.535 68.606 24.6822 67.5659 22.1986 66.8954C21.2404 66.6367 20.4861 66.4331 20.067 66.4184C18.7609 66.3786 17.6908 66.2779 17.1426 66.1507C16.9168 65.6159 16.6667 64.5873 16.4249 63.3032C16.349 62.8865 16.0538 62.1862 15.6811 61.3019C14.7171 59.015 13.2342 55.4972 13.6825 52.4697C15.214 42.1386 21.7927 32.2356 29.1885 27.1834C33.6256 24.1465 37.6224 24.7272 39.7003 25.4008L44.6645 33.6675C44.7145 33.7628 44.7751 33.8147 44.851 33.8796C44.9269 33.9445 45.0894 34.031 45.0894 34.031L54.0797 37.6215Z" fill="currentColor"/>
            </g>
          </svg>
        </span>
      );
    default:
      return null;
  }
}

function MapStampGlyph({
  type,
  size = 16,
}: {
  type: MapStampType;
  size?: number;
}) {
  if (isMapPestStampType(type)) {
    return <PestGlyph type={type} />;
  }

  switch (type) {
    case 'door':
      return <DoorClosed size={size} strokeWidth={1.9} aria-hidden="true" />;
    case 'window':
      return <Grid2x2 size={size} strokeWidth={1.9} aria-hidden="true" />;
    case 'house':
      return <House size={size} strokeWidth={1.9} aria-hidden="true" />;
    case 'garage':
      return <Warehouse size={size} strokeWidth={1.9} aria-hidden="true" />;
    case 'patio':
      return <AppWindow size={size} strokeWidth={1.9} aria-hidden="true" />;
    case 'deck':
      return <DoorOpen size={size} strokeWidth={1.9} aria-hidden="true" />;
    case 'fence':
      return <Fence size={size} strokeWidth={1.9} aria-hidden="true" />;
    case 'water':
      return <Droplet size={size} strokeWidth={1.9} aria-hidden="true" />;
    default:
      return null;
  }
}

function PlotObjectBlueprintGlyph({
  type,
}: {
  type: MapObjectStampType;
}) {
  if (type === 'door') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 3V21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M4 19L16 19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M4 19A12 12 0 0 1 16 7" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="6" width="16" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" rx="0.6" />
      <path d="M12 6V18M4 12H20" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function normalizeForMatching(value: string | null | undefined): string {
  return (value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getOptionKeywords(option: PestOption): Set<string> {
  const combined = `${option.name} ${option.slug}`.toLowerCase();
  const tokens = new Set(
    combined
      .replace(/[^a-z0-9\s-]/g, ' ')
      .replace(/-/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
  );

  if (tokens.has('rodent') || tokens.has('rodents') || tokens.has('rat') || tokens.has('rats') || tokens.has('mouse') || tokens.has('mice')) {
    ['rodent', 'rodents', 'rat', 'rats', 'mouse', 'mice'].forEach(token => tokens.add(token));
  }

  if (tokens.has('cockroach') || tokens.has('cockroaches') || tokens.has('roaches')) {
    ['roach', 'roaches', 'cockroach', 'cockroaches'].forEach(token => tokens.add(token));
  }

  if (tokens.has('termite') || tokens.has('termites')) {
    ['termite', 'termites'].forEach(token => tokens.add(token));
  }

  if (tokens.has('mosquito') || tokens.has('mosquitoes')) {
    ['mosquito', 'mosquitoes'].forEach(token => tokens.add(token));
  }

  if (tokens.has('bed') || tokens.has('bug') || tokens.has('bugs')) {
    ['bedbug', 'bedbugs', 'bed', 'bug', 'bugs'].forEach(token => tokens.add(token));
  }

  if (tokens.has('ant') || tokens.has('ants')) {
    ['ant', 'ants'].forEach(token => tokens.add(token));
  }

  if (tokens.has('spider') || tokens.has('spiders')) {
    ['spider', 'spiders'].forEach(token => tokens.add(token));
  }

  if (tokens.has('flea') || tokens.has('fleas')) {
    ['flea', 'fleas'].forEach(token => tokens.add(token));
  }

  if (tokens.has('tick') || tokens.has('ticks')) {
    ['tick', 'ticks'].forEach(token => tokens.add(token));
  }

  if (tokens.has('wasp') || tokens.has('wasps') || tokens.has('hornet') || tokens.has('hornets')) {
    ['wasp', 'wasps', 'hornet', 'hornets'].forEach(token => tokens.add(token));
  }

  return tokens;
}

function findBestPestMatch(aiResult: AIResult, pestOptions: PestOption[]): PestOption | null {
  if (pestOptions.length === 0) return null;

  const candidateText = normalizeForMatching(
    [
      aiResult.suggested_pest_type,
      aiResult.service_category,
      aiResult.issue_detected,
      aiResult.ai_summary,
    ]
      .filter(Boolean)
      .join(' ')
  );

  if (!candidateText) return null;

  const rawTokens = new Set(candidateText.split(' ').filter(Boolean));

  // Expand rodent-family synonyms in both directions so "rodents" matches "Mice & Rats" options
  if (rawTokens.has('rodent') || rawTokens.has('rodents') || rawTokens.has('rat') || rawTokens.has('rats') || rawTokens.has('mouse') || rawTokens.has('mice')) {
    ['rodent', 'rodents', 'rat', 'rats', 'mouse', 'mice'].forEach(t => rawTokens.add(t));
  }
  // Expand cockroach synonyms
  if (rawTokens.has('roach') || rawTokens.has('roaches') || rawTokens.has('cockroach') || rawTokens.has('cockroaches')) {
    ['roach', 'roaches', 'cockroach', 'cockroaches'].forEach(t => rawTokens.add(t));
  }

  const candidateTokens = rawTokens;
  let bestMatch: { option: PestOption; score: number } | null = null;

  pestOptions.forEach(option => {
    const normalizedName = normalizeForMatching(option.name);
    const normalizedSlug = normalizeForMatching(option.slug);
    const optionKeywords = getOptionKeywords(option);

    let score = 0;

    if (normalizedName && candidateText.includes(normalizedName)) {
      score += 6;
    }

    if (normalizedSlug && candidateText.includes(normalizedSlug)) {
      score += 5;
    }

    optionKeywords.forEach(keyword => {
      if (candidateTokens.has(keyword) || candidateText.includes(keyword)) {
        score += 1;
      }
    });

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { option, score };
    }
  });

  const result = bestMatch as { option: PestOption; score: number } | null;
  return result && result.score >= 3 ? result.option : null;
}

// ─── Step components ──────────────────────────────────────────────────────────

function StepTypeSelect({
  onSelect,
}: {
  onSelect: (type: LeadType) => void;
}) {
  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>Select Opportunity Type</h2>
      <p className={styles.stepDesc}>What kind of opportunity did you find?</p>
      <div className={styles.typeCards}>
        <button className={styles.typeCard} onClick={() => onSelect('new-lead')}>
          <span className={styles.typeCardIcon}><UserPlus size={32} strokeWidth={1.5} /></span>
          <span className={styles.typeCardLabel}>New Lead</span>
          <span className={styles.typeCardSub}>New customer opportunity</span>
        </button>
        <button className={styles.typeCard} onClick={() => onSelect('upsell')}>
          <span className={styles.typeCardIcon}><TrendingUp size={32} strokeWidth={1.5} /></span>
          <span className={styles.typeCardLabel}>Upsell Opportunity</span>
          <span className={styles.typeCardSub}>Additional service for existing customer</span>
        </button>
        <div className={styles.typeCardDisabled}>
          <span className={styles.typeCardIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="33" viewBox="0 0 83 85" fill="none">
              <path d="M61.908 1.14612C61.7742 1.39088 61.5582 1.67482 61.2714 1.9855C61.0086 2.29524 60.6999 2.65469 60.308 3.0294C60.1358 3.20462 59.9563 3.3826 59.7719 3.56548L59.7708 3.56657L59.7697 3.56768C59.5484 3.7871 59.3198 4.01382 59.0882 4.25106C58.6504 4.67548 58.1802 5.185 57.7357 5.7414C57.2923 6.3217 56.9388 7.05409 56.7278 7.7569C56.5054 8.47214 56.3546 9.18454 56.2154 9.88451C56.05 10.6919 55.8892 11.4945 55.7321 12.2778C55.4525 13.6727 55.1851 15.0066 54.9267 16.1976C55.4373 16.0936 55.9375 16.0259 56.4406 16.03C56.6609 14.8547 56.8866 13.5548 57.1179 12.2223L57.1183 12.2199C57.2383 11.5289 57.3597 10.8293 57.4827 10.1337L57.4865 10.1124C57.7387 8.69759 57.9736 7.37979 58.6983 6.44567C59.0729 5.93993 59.4734 5.48106 59.8987 5.04516C60.3117 4.59778 60.7256 4.1743 61.0936 3.80053C61.4616 3.42677 61.8047 3.03004 62.0895 2.67154C62.3992 2.336 62.6257 2.01573 62.7805 1.6983C63.1159 1.1103 63.306 0.77949 63.306 0.77949C63.4398 0.534728 63.3555 0.226755 63.122 0.0803368C62.8761 -0.0775624 62.5682 0.00646156 62.4105 0.25217L62.3303 0.339161C62.3303 0.339161 62.1745 0.632688 61.8716 1.13559L61.908 1.14612Z" fill="currentColor"/>
              <path d="M44.1292 8.87799L38.7822 21.7096L38.6513 22.0261L40.6944 31.3684L41.05 30.9831C41.6809 30.2996 42.4151 29.8036 43.203 29.4491L41.1725 22.1897L45.7362 9.23348L45.8326 8.95427L45.7512 8.71802L44.5853 5.06435C44.4751 4.70951 44.1077 4.50852 43.752 4.59444C43.3848 4.69278 43.1602 5.06087 43.2475 5.44057L44.1407 8.86556L44.1292 8.87799Z" fill="currentColor"/>
              <path d="M54.7671 40.1642L54.7722 40.1506L54.7607 40.163L54.7671 40.1642Z" fill="currentColor"/>
              <path d="M54.7671 40.1642C54.4647 40.9617 54.0426 41.7397 53.4154 42.4194L53.0598 42.8046L62.5355 44.094L62.8405 43.9382L75.2034 37.5821L78.6889 38.1985C79.0504 38.256 79.4003 38.0266 79.4814 37.6642C79.574 37.2894 79.3433 36.9154 78.9569 36.8349L75.2217 35.9649L74.9796 35.9026L74.7091 36.0211L62.1468 41.5949L54.7671 40.1642Z" fill="currentColor"/>
              <path d="M70.7192 26.3161C71.5397 26.0801 72.3829 25.8376 73.2331 25.5912C73.9197 25.3964 74.6177 25.1892 75.3129 24.9103C76.009 24.6552 76.7108 24.2443 77.2413 23.7444C77.7489 23.2693 78.2307 22.7473 78.6187 22.277C78.9823 21.8363 79.3366 21.4276 79.6715 21.0413L79.6722 21.0404L79.7389 20.9635C80.0811 20.5428 80.4147 20.2064 80.7024 19.9196C80.9892 19.6089 81.2549 19.3709 81.4882 19.218C81.9652 18.8758 82.2205 18.6741 82.2205 18.6741L82.3008 18.5871C82.5341 18.4342 82.5932 18.1206 82.44 17.8872C82.2869 17.6538 81.9493 17.5953 81.716 17.7482C81.716 17.7482 81.4014 17.9642 80.8421 18.3455C80.5381 18.5252 80.2494 18.7881 79.9273 19.1121C79.5927 19.4247 79.2237 19.7745 78.8816 20.1952C78.535 20.5707 78.1791 20.9785 77.8033 21.4091L77.7365 21.4857C77.3121 21.9455 76.9106 22.3805 76.4365 22.7944C75.5633 23.5914 74.2685 23.931 72.8784 24.2955L72.8575 24.301C72.5019 24.3937 72.1456 24.4865 71.7902 24.579C70.1442 25.0075 68.5173 25.4311 67.0759 25.8229C67.1202 26.324 67.1051 26.8395 67.0184 27.3578L67.0433 27.3807C68.1687 27.0496 69.4157 26.691 70.7192 26.3161Z" fill="currentColor"/>
              <path d="M47.9936 62.2703L37.0735 78.5194L37.0487 78.4964L37.0485 78.4975C36.6872 80.5108 36.3258 82.5248 35.9884 84.5371C35.9407 84.8383 35.6616 85.0409 35.3603 84.993C35.0829 84.9441 34.88 84.6648 34.9162 84.376C35.0751 83.1806 35.2178 81.978 35.3606 80.7743L35.3607 80.7731L35.3609 80.7718C35.4653 79.8914 35.5698 79.0105 35.6808 78.1315L35.6999 78.011L35.7897 77.8637L45.7073 61.4029L44.2456 53.702C44.8771 52.4437 45.6272 51.1568 46.5447 49.8633L48.1634 61.4374L48.2306 61.9137L47.9936 62.2703Z" fill="currentColor"/>
              <path d="M56.9817 73.3739L54.7724 69.6777L56.3982 51.8926L56.4582 51.3035L55.973 50.8558L50.2787 45.6691C49.5073 46.43 48.8296 47.1393 48.2217 47.7979L53.8564 52.4003L53.2336 69.8224L53.2203 70.0863L53.3476 70.2729L55.908 74.0629C56.0995 74.3547 56.4859 74.4352 56.7785 74.2679C57.0825 74.0883 57.1856 73.6771 56.9942 73.3854L56.9817 73.3739Z" fill="currentColor"/>
              <path d="M34.1805 38.4515C32.952 39.4579 31.7417 40.32 30.5256 41.0387L30.5131 41.0272L22.7199 40.1861L7.10504 51.3885L6.96546 51.4898L6.83444 51.507C6.05471 51.6696 5.27305 51.8272 4.49098 51.9848L4.48951 51.9851C3.21177 52.2427 1.93295 52.5005 0.659647 52.781C0.363201 52.8526 0.0800017 52.6603 0.00811189 52.3638C-0.0398677 52.0664 0.128307 51.7843 0.424753 51.7127C1.71029 51.3991 2.98506 51.066 4.26269 50.7321C4.96474 50.5487 5.66766 50.365 6.3737 50.1842L21.6849 37.988L22.0214 37.7233L34.1805 38.4515Z" fill="currentColor"/>
              <path d="M37.9257 34.5532L38.0632 34.3945L32.4262 29.1456L31.941 28.6979L31.3587 28.8047L13.7606 31.8479L9.89955 29.9412C9.59438 29.7976 9.21571 29.9084 9.05997 30.2019C8.88129 30.5203 8.99244 30.8991 9.31102 31.078L13.2937 33.3271L13.4898 33.4391L13.7643 33.4163L31.0808 31.402L36.1191 36.6506L36.1056 36.6152C36.6735 36 37.2797 35.2996 37.9257 34.5532Z" fill="currentColor"/>
              <path d="M39.8167 56.993C38.5514 60.1231 37.3348 63.1328 34.9048 66.0464L34.856 66.0244C26.5665 75.9791 13.9735 79.3151 10.6522 76.2496C7.34232 73.1717 9.63653 60.3531 18.9088 51.3055C21.6207 48.6604 24.5184 47.2072 27.5304 45.6967C30.416 44.2496 33.4065 42.7499 36.4393 40.0991C37.6253 39.0594 38.8454 37.6344 40.2189 36.0302C41.0816 35.0225 42.0049 33.9442 43.0183 32.8462C44.0965 31.6781 45.7451 31.2896 47.4485 31.3658C47.7068 30.4342 47.895 29.5304 48.0755 28.6638C48.5447 26.4111 48.9614 24.4105 50.4193 22.8309C52.1283 20.9793 54.6537 18.2931 58.0149 19.094C58.1495 18.5738 58.3443 18.0632 58.6587 17.5479C58.8393 17.2773 59.1002 16.9198 59.2981 16.7802C59.6232 16.5279 59.9367 16.288 60.3766 16.2107C60.8165 16.1335 61.3245 16.257 61.6211 16.4848C61.9301 16.724 62.0957 16.9689 62.201 17.2042C62.4003 17.6494 62.4156 18.0484 62.4257 18.3128C62.4262 18.3279 62.4268 18.3425 62.4274 18.3567C62.4505 18.6311 62.397 18.7889 62.397 18.7889C62.397 18.7889 62.2965 18.6731 62.1089 18.477C61.9338 18.2924 61.6716 18.0274 61.3875 17.8111L61.3788 17.8046C61.2453 17.7039 61.1008 17.595 60.9837 17.5996C60.8857 17.584 60.8447 17.6057 60.7885 17.6355C60.7756 17.6423 60.7619 17.6495 60.7466 17.6569C60.6758 17.6836 60.5248 17.7973 60.4091 17.8977L59.9388 18.4072C59.891 18.4833 59.8413 18.5602 59.791 18.6383C59.5811 18.9638 59.3589 19.3085 59.2002 19.6817C59.5851 20.0984 59.8808 20.6896 60.1728 21.2734C60.318 21.5636 60.4622 21.8519 60.616 22.1162C60.8918 22.2484 61.1895 22.3705 61.4892 22.4934C62.0919 22.7405 62.7022 22.9908 63.1559 23.3327C63.5025 23.1565 63.8307 22.9047 64.1382 22.6688C64.2159 22.6092 64.2922 22.5507 64.3672 22.4946L64.8375 21.985C64.9283 21.8617 65.0181 21.7145 65.0506 21.6294C65.0567 21.6135 65.0628 21.5993 65.0686 21.5859C65.0937 21.5275 65.1121 21.4848 65.0887 21.3884C65.0724 21.2813 64.9585 21.1301 64.8456 21.0029C64.6073 20.7369 64.3222 20.4968 64.1241 20.337C63.9282 20.1968 63.818 20.0998 63.7948 20.079C63.8043 20.0808 63.828 20.0748 63.8643 20.0656C63.937 20.0473 64.0599 20.0162 64.2186 20.01C64.4931 19.9871 64.8871 19.9596 65.3855 20.1434C65.6409 20.241 65.8983 20.3865 66.1614 20.6754C66.4361 20.9519 66.576 21.4493 66.5341 21.894C66.4923 22.3386 66.2782 22.6704 66.0642 23.0021C65.9473 23.1998 65.6395 23.4696 65.4009 23.6787L65.3626 23.7124C64.874 24.067 64.3807 24.302 63.8729 24.4778C64.9401 27.7642 62.4645 30.4963 60.7554 32.348C59.3039 33.9206 57.3539 34.4978 55.1624 35.1465C54.306 35.4 53.4127 35.6643 52.4979 36.0033C52.6987 37.7076 52.4548 39.3696 51.3766 40.5377C50.3693 41.6291 49.3725 42.6313 48.4394 43.5694C46.95 45.0669 45.6227 46.4015 44.6732 47.6758C42.2774 50.9054 41.0249 54.0041 39.8167 56.993Z" fill="currentColor"/>
              <path d="M63.7902 20.0748C63.7902 20.0748 63.7917 20.0762 63.7948 20.079C63.7918 20.0784 63.7903 20.0771 63.7902 20.0748Z" fill="currentColor"/>
            </svg>
          </span>
          <span className={styles.typeCardLabel}>Termite Renewal</span>
          <span className={styles.typeCardSub}>Renew termite protection plan</span>
          <span className={styles.typeCardComingSoon}>Coming Soon</span>
        </div>
      </div>
    </div>
  );
}

function StepNewLeadPath({
  onSelect,
}: {
  onSelect: (mode: NewLeadPathMode) => void;
}) {
  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>New Lead Path</h2>
      <p className={styles.stepDesc}>Do you want to map and plot this property now?</p>
      <div className={styles.flowCards}>
        <button type="button" className={styles.flowCardPrimary} onClick={() => onSelect('map-plot')}>
          <span className={styles.flowCardIcon}>
            <MapPinned size={28} strokeWidth={1.6} />
          </span>
          <span className={styles.flowCardLabel}>Map &amp; Plot</span>
          <span className={styles.flowCardSub}>Satellite view + tap-to-plot pest points</span>
        </button>
        <button type="button" className={styles.flowCard} onClick={() => onSelect('standard')}>
          <span className={styles.flowCardIcon}>↪</span>
          <span className={styles.flowCardLabel}>Continue Without Mapping</span>
          <span className={styles.flowCardSub}>You can add mapping later</span>
        </button>
      </div>
    </div>
  );
}

function StepMapAddress({
  mapPlotData,
  onChange,
}: {
  mapPlotData: MapPlotData;
  onChange: (next: MapPlotData) => void;
}) {
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(!mapPlotData.addressComponents);
  const autoAttemptedRef = useRef(false);

  const applyAddressSelection = useCallback(
    (addressComponents: AddressComponents, addressInput: string) => {
      const lat = typeof addressComponents.latitude === 'number' ? addressComponents.latitude : null;
      const lng = typeof addressComponents.longitude === 'number' ? addressComponents.longitude : null;

      onChange({
        ...mapPlotData,
        addressInput,
        addressComponents,
        centerLat: lat,
        centerLng: lng,
        zoom: 20,
        heading: 0,
        tilt: 0,
        isViewSet: false,
        drawTool: 'stamp',
        selectedStampType: DEFAULT_PEST_STAMP_TYPE,
        selectedPestType: DEFAULT_PEST_STAMP_TYPE,
        selectedObjectType: DEFAULT_OBJECT_STAMP_TYPE,
        selectedElementType: DEFAULT_ELEMENT_STAMP_TYPE,
        stamps: [],
        outlines: [],
        activeOutlineId: null,
        updatedAt: new Date().toISOString(),
      });
    },
    [mapPlotData, onChange]
  );

  const tryUseCurrentAddress = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationError('Location is unavailable on this device. Use manual address entry.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async position => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch('/api/internal/reverse-geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude }),
          });

          if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(errorBody.error || 'Could not resolve your current address.');
          }

          const payload = await response.json();
          const components = payload.addressComponents as AddressComponents | undefined;
          if (!components || !components.formatted_address) {
            throw new Error('Could not resolve your current address. Enter it manually.');
          }

          const street = `${components.street_number ? `${components.street_number} ` : ''}${components.route ?? ''}`.trim();
          applyAddressSelection(components, street || components.formatted_address);
          setManualMode(false);
        } catch (error: any) {
          setLocationError(error?.message || 'Could not resolve your current address.');
          setManualMode(true);
        } finally {
          setIsLocating(false);
        }
      },
      error => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError('Location permission denied. Enter address manually.');
        } else {
          setLocationError('Could not access your location. Enter address manually.');
        }
        setManualMode(true);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, [applyAddressSelection]);

  useEffect(() => {
    if (autoAttemptedRef.current || mapPlotData.addressComponents) return;
    autoAttemptedRef.current = true;
    void tryUseCurrentAddress();
  }, [mapPlotData.addressComponents, tryUseCurrentAddress]);

  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>Map Address</h2>
      <p className={styles.stepDesc}>We&apos;ll try your current location first, or you can enter the address manually.</p>

      <div className={styles.mapAddressActions}>
        <button
          type="button"
          className={styles.mapAddressBtnPrimary}
          onClick={() => void tryUseCurrentAddress()}
          disabled={isLocating}
        >
          <LocateFixed size={16} />
          {isLocating ? 'Locating...' : 'Use Current Address'}
        </button>
        <button
          type="button"
          className={styles.mapAddressBtn}
          onClick={() => setManualMode(true)}
        >
          <Keyboard size={16} />
          Enter Address Manually
        </button>
      </div>

      {mapPlotData.addressComponents?.formatted_address && (
        <div className={styles.mapAddressSelected}>
          <p className={styles.mapAddressSelectedLabel}>Selected Address</p>
          <p className={styles.mapAddressSelectedValue}>
            {mapPlotData.addressComponents.formatted_address}
          </p>
        </div>
      )}

      {manualMode && (
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Manual Address</label>
          <AddressAutocomplete
            value={mapPlotData.addressInput}
            onChange={value =>
              onChange({
                ...mapPlotData,
                addressInput: value,
                addressComponents: null,
                centerLat: null,
                centerLng: null,
                isViewSet: false,
                stamps: [],
                outlines: [],
                activeOutlineId: null,
              })
            }
            onAddressSelect={components => {
              const street = `${components.street_number ? `${components.street_number} ` : ''}${components.route ?? ''}`.trim();
              applyAddressSelection(components, street || components.formatted_address || mapPlotData.addressInput);
            }}
            placeholder="Start typing address..."
          />
        </div>
      )}

      {locationError && <p className={styles.errorState}>{locationError}</p>}
      <p className={styles.fieldHint}>
        After an address is selected, tap <strong>Next</strong> to set the view (satellite or blank grid).
      </p>
    </div>
  );
}

function MapInstanceBridge({
  onMapReady,
}: {
  onMapReady: (map: google.maps.Map | null) => void;
}) {
  const map = useMap();

  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);

  return null;
}

function StepMapPlot({
  companyId,
  mapPlotData,
  onChange,
  onBack,
  onNext,
  canNext,
}: {
  companyId: string;
  mapPlotData: MapPlotData;
  onChange: (next: MapPlotData) => void;
  onBack: () => void;
  onNext: () => void;
  canNext: boolean;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string | null>(null);
  const [mapsError, setMapsError] = useState<string | null>(null);
  const [googleMapInstance, setGoogleMapInstance] = useState<google.maps.Map | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [draggingStampId, setDraggingStampId] = useState<string | null>(null);
  const [showDimensions, setShowDimensions] = useState(false);
  const [selectedWallMeasurement, setSelectedWallMeasurement] = useState<{ outlineId: string; segmentIndex: number } | null>(null);
  const [showLegendLabels, setShowLegendLabels] = useState(false);
  const [snapToFirst, setSnapToFirst] = useState(false);
  const [activeStampMenu, setActiveStampMenu] = useState<MapStampCategory | null>(null);
  const [blankGridScale, setBlankGridScale] = useState(1);
  const [blankGridOffset, setBlankGridOffset] = useState({ x: 0, y: 0 });
  const dragMovedRef = useRef(false);
  const lastDragAtRef = useRef<number>(0);
  const blankGridPanRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startOffsetX: number;
    startOffsetY: number;
  } | null>(null);
  const blankGridPinchRef = useRef<{
    pointers: Map<number, { x: number; y: number }>;
    lastDistance: number | null;
  }>({
    pointers: new globalThis.Map<number, { x: number; y: number }>(),
    lastDistance: null,
  });
  const outlineNodeGestureRef = useRef<
    | {
        mode: 'close-outline';
        outlineId: string;
        startClientX: number;
        startClientY: number;
        hasMoved: boolean;
      }
    | {
        mode: 'move-node';
        outlineId: string;
        nodeIndex: number;
        startClientX: number;
        startClientY: number;
        isDragging: boolean;
      }
    | null
  >(null);

  const latitude = getMapLatitude(mapPlotData);
  const longitude = getMapLongitude(mapPlotData);
  const hasCoordinates = latitude !== null && longitude !== null;
  const selectedPestType = isMapPestStampType(mapPlotData.selectedPestType)
    ? mapPlotData.selectedPestType
    : DEFAULT_PEST_STAMP_TYPE;
  const selectedObjectType = isMapObjectStampType(mapPlotData.selectedObjectType)
    ? mapPlotData.selectedObjectType
    : DEFAULT_OBJECT_STAMP_TYPE;
  const selectedElementType = isMapElementStampType(mapPlotData.selectedElementType)
    ? mapPlotData.selectedElementType
    : DEFAULT_ELEMENT_STAMP_TYPE;
  const isBlankGridMode = mapPlotData.backgroundMode === 'blank-grid';
  const isSatelliteMode = !isBlankGridMode;
  const canSetView = isBlankGridMode || hasCoordinates;
  const activeOutline = useMemo(
    () => mapPlotData.outlines.find(outline => outline.id === mapPlotData.activeOutlineId) ?? null,
    [mapPlotData.activeOutlineId, mapPlotData.outlines]
  );
  const activeOutlinePoints = activeOutline?.points ?? [];
  const activeOutlineClosed = activeOutline?.isClosed ?? false;

  const updateMapPlotData = useCallback(
    (updates: Partial<MapPlotData>) => {
      onChange({
        ...mapPlotData,
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    },
    [mapPlotData, onChange]
  );

  useEffect(() => {
    if (!isSatelliteMode || googleMapsApiKey || mapsError) return;
    const fetchApiKey = async () => {
      try {
        const response = await fetch('/api/google-places-key');
        const payload = await response.json();
        if (!response.ok || !payload.apiKey) {
          throw new Error(payload.error || 'Google Maps key unavailable.');
        }
        setGoogleMapsApiKey(payload.apiKey);
      } catch (error: any) {
        setMapsError(error?.message || 'Unable to load Google Maps.');
      }
    };
    void fetchApiKey();
  }, [googleMapsApiKey, isSatelliteMode, mapsError]);

  useEffect(() => {
    const container = mapRef.current;
    if (!container) return;

    const updateSize = () => {
      setCanvasSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  const clampBlankGridOffset = useCallback((offsetX: number, offsetY: number, scale: number) => {
    if (canvasSize.width <= 0 || canvasSize.height <= 0 || scale <= 1) {
      return { x: 0, y: 0 };
    }
    const maxOffsetX = (canvasSize.width * (scale - 1)) / 2;
    const maxOffsetY = (canvasSize.height * (scale - 1)) / 2;
    return {
      x: Math.max(-maxOffsetX, Math.min(maxOffsetX, offsetX)),
      y: Math.max(-maxOffsetY, Math.min(maxOffsetY, offsetY)),
    };
  }, [canvasSize.height, canvasSize.width]);

  const applyBlankGridScaleAtClientPoint = useCallback((scaleFactor: number, clientX: number, clientY: number) => {
    if (!isBlankGridMode) return;
    const container = mapRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const focusX = clientX - rect.left;
    const focusY = clientY - rect.top;
    const deltaX = focusX - rect.width / 2;
    const deltaY = focusY - rect.height / 2;

    setBlankGridScale(currentScale => {
      const nextScale = Math.max(BLANK_GRID_MIN_SCALE, Math.min(BLANK_GRID_MAX_SCALE, currentScale * scaleFactor));
      if (Math.abs(nextScale - currentScale) < 1e-4) return currentScale;

      const ratio = nextScale / currentScale;
      setBlankGridOffset(currentOffset =>
        clampBlankGridOffset(
          currentOffset.x * ratio + deltaX * (1 - ratio),
          currentOffset.y * ratio + deltaY * (1 - ratio),
          nextScale
        )
      );
      return nextScale;
    });
  }, [clampBlankGridOffset, isBlankGridMode]);

  const handleBlankGridWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    if (!isBlankGridMode || mapPlotData.isViewSet) return;
    event.preventDefault();
    const scaleFactor = event.deltaY < 0 ? 1.08 : 1 / 1.08;
    applyBlankGridScaleAtClientPoint(scaleFactor, event.clientX, event.clientY);
  }, [applyBlankGridScaleAtClientPoint, isBlankGridMode, mapPlotData.isViewSet]);

  const handleBlankGridPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isBlankGridMode || mapPlotData.isViewSet) return;
    event.currentTarget.setPointerCapture(event.pointerId);

    const pointers = blankGridPinchRef.current.pointers;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size >= 2) {
      blankGridPanRef.current = null;
      const values = Array.from(pointers.values());
      const first = values[0];
      const second = values[1];
      blankGridPinchRef.current.lastDistance = Math.hypot(second.x - first.x, second.y - first.y);
      return;
    }

    blankGridPanRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startOffsetX: blankGridOffset.x,
      startOffsetY: blankGridOffset.y,
    };
  }, [blankGridOffset.x, blankGridOffset.y, isBlankGridMode, mapPlotData.isViewSet]);

  const handleBlankGridPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isBlankGridMode || mapPlotData.isViewSet) return;
    const pointers = blankGridPinchRef.current.pointers;
    if (!pointers.has(event.pointerId)) return;

    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size >= 2) {
      const values = Array.from(pointers.values());
      const first = values[0];
      const second = values[1];
      const distance = Math.hypot(second.x - first.x, second.y - first.y);
      const centerX = (first.x + second.x) / 2;
      const centerY = (first.y + second.y) / 2;
      const lastDistance = blankGridPinchRef.current.lastDistance;
      if (lastDistance && lastDistance > 0) {
        applyBlankGridScaleAtClientPoint(distance / lastDistance, centerX, centerY);
      }
      blankGridPinchRef.current.lastDistance = distance;
      return;
    }

    const panGesture = blankGridPanRef.current;
    if (!panGesture || panGesture.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - panGesture.startClientX;
    const deltaY = event.clientY - panGesture.startClientY;
    setBlankGridOffset(
      clampBlankGridOffset(
        panGesture.startOffsetX + deltaX,
        panGesture.startOffsetY + deltaY,
        blankGridScale
      )
    );
  }, [applyBlankGridScaleAtClientPoint, blankGridScale, clampBlankGridOffset, isBlankGridMode, mapPlotData.isViewSet]);

  const handleBlankGridPointerEnd = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const pointers = blankGridPinchRef.current.pointers;
    pointers.delete(event.pointerId);

    if (blankGridPanRef.current?.pointerId === event.pointerId) {
      blankGridPanRef.current = null;
    }

    if (pointers.size < 2) {
      blankGridPinchRef.current.lastDistance = null;
    }
  }, []);

  useEffect(() => {
    if (isBlankGridMode && !mapPlotData.isViewSet) return;
    blankGridPanRef.current = null;
    blankGridPinchRef.current.pointers.clear();
    blankGridPinchRef.current.lastDistance = null;
  }, [isBlankGridMode, mapPlotData.isViewSet]);

  const getNormalizedPoint = useCallback((clientX: number, clientY: number) => {
    const container = mapRef.current;
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    let pointX = clientX - rect.left;
    let pointY = clientY - rect.top;

    if (isBlankGridMode) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      pointX = centerX + (pointX - centerX - blankGridOffset.x) / blankGridScale;
      pointY = centerY + (pointY - centerY - blankGridOffset.y) / blankGridScale;
    }

    return {
      x: clampNormalized(pointX / rect.width),
      y: clampNormalized(pointY / rect.height),
    };
  }, [blankGridOffset.x, blankGridOffset.y, blankGridScale, isBlankGridMode]);

  const blankGridWorkspaceStyle = useMemo<React.CSSProperties | undefined>(() => {
    if (!isBlankGridMode) return undefined;
    return {
      transform: `translate(${blankGridOffset.x}px, ${blankGridOffset.y}px) scale(${blankGridScale})`,
      transformOrigin: 'center center',
    };
  }, [blankGridOffset.x, blankGridOffset.y, blankGridScale, isBlankGridMode]);

  const getLatLngFromNormalizedPoint = useCallback((
    point: { x: number; y: number },
    map = googleMapInstance
  ): { lat: number; lng: number } | null => {
    if (!isSatelliteMode || !map) return null;
    if (canvasSize.width <= 0 || canvasSize.height <= 0) return null;

    const projection = map.getProjection();
    const center = map.getCenter();
    const zoom = map.getZoom();
    if (!projection || !center || !Number.isFinite(zoom)) return null;

    const centerWorld = projection.fromLatLngToPoint(center);
    if (!centerWorld) return null;

    const scale = Math.pow(2, zoom as number);
    const dxPx = point.x * canvasSize.width - canvasSize.width / 2;
    const dyPx = point.y * canvasSize.height - canvasSize.height / 2;
    const worldWidth = 256;

    let worldX = centerWorld.x + dxPx / scale;
    const worldY = centerWorld.y + dyPx / scale;
    worldX = ((worldX % worldWidth) + worldWidth) % worldWidth;

    const latLng = projection.fromPointToLatLng(new google.maps.Point(worldX, worldY));
    if (!latLng) return null;

    return { lat: latLng.lat(), lng: latLng.lng() };
  }, [canvasSize.height, canvasSize.width, googleMapInstance, isSatelliteMode]);

  const getNormalizedPointFromLatLng = useCallback((
    lat: number,
    lng: number,
    map = googleMapInstance
  ): { x: number; y: number } | null => {
    if (!isSatelliteMode || !map) return null;
    if (canvasSize.width <= 0 || canvasSize.height <= 0) return null;

    const projection = map.getProjection();
    const center = map.getCenter();
    const zoom = map.getZoom();
    if (!projection || !center || !Number.isFinite(zoom)) return null;

    const centerWorld = projection.fromLatLngToPoint(center);
    const pointWorld = projection.fromLatLngToPoint(new google.maps.LatLng(lat, lng));
    if (!centerWorld || !pointWorld) return null;

    const scale = Math.pow(2, zoom as number);
    const worldWidth = 256;
    let dx = pointWorld.x - centerWorld.x;
    if (dx > worldWidth / 2) dx -= worldWidth;
    if (dx < -worldWidth / 2) dx += worldWidth;
    const dy = pointWorld.y - centerWorld.y;

    return {
      x: (dx * scale + canvasSize.width / 2) / canvasSize.width,
      y: (dy * scale + canvasSize.height / 2) / canvasSize.height,
    };
  }, [canvasSize.height, canvasSize.width, googleMapInstance, isSatelliteMode]);

  const snapPointToGrid = useCallback((point: { x: number; y: number }): { x: number; y: number } => {
    if (canvasSize.width <= 0 || canvasSize.height <= 0) return point;

    const snapAxis = (value: number, axisSize: number) => {
      const px = value * axisSize;
      const snappedPx = Math.round(px / OUTLINE_SNAP_GRID_PX) * OUTLINE_SNAP_GRID_PX;
      return clampNormalized(snappedPx / axisSize);
    };

    return {
      x: snapAxis(point.x, canvasSize.width),
      y: snapAxis(point.y, canvasSize.height),
    };
  }, [canvasSize.height, canvasSize.width]);

  const createOutlinePoint = useCallback((point: { x: number; y: number }): MapOutlinePoint => {
    const snappedPoint = snapPointToGrid(point);
    const geo = getLatLngFromNormalizedPoint(snappedPoint);
    if (!geo) return { x: snappedPoint.x, y: snappedPoint.y };
    return { x: snappedPoint.x, y: snappedPoint.y, lat: geo.lat, lng: geo.lng };
  }, [getLatLngFromNormalizedPoint, snapPointToGrid]);

  const createStamp = useCallback((point: { x: number; y: number }, type: MapStampType): MapPlotStamp => {
    const geo = getLatLngFromNormalizedPoint(point);
    return {
      id: crypto.randomUUID(),
      x: point.x,
      y: point.y,
      ...(geo ? { lat: geo.lat, lng: geo.lng } : {}),
      type,
    };
  }, [getLatLngFromNormalizedPoint]);

  const reprojectAnchoredGeometry = useCallback((
    stamps: MapPlotStamp[],
    outlines: MapElementOutline[],
    map = googleMapInstance
  ): { stamps: MapPlotStamp[]; outlines: MapElementOutline[] } => {
    if (!isSatelliteMode || !map) return { stamps, outlines };

    return {
      stamps: stamps.map(stamp => {
        if (!Number.isFinite(stamp.lat) || !Number.isFinite(stamp.lng)) return stamp;
        const projected = getNormalizedPointFromLatLng(stamp.lat as number, stamp.lng as number, map);
        return projected ? { ...stamp, x: projected.x, y: projected.y } : stamp;
      }),
      outlines: outlines.map(outline => ({
        ...outline,
        points: outline.points.map(point => {
          if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return point;
          const projected = getNormalizedPointFromLatLng(point.lat as number, point.lng as number, map);
          return projected ? { ...point, x: projected.x, y: projected.y } : point;
        }),
      })),
    };
  }, [getNormalizedPointFromLatLng, googleMapInstance, isSatelliteMode]);

  const getOutlineMetrics = useCallback((outline: MapElementOutline) => {
    const option = MAP_ELEMENT_STAMP_OPTIONS.find(element => element.type === outline.type) ?? MAP_ELEMENT_STAMP_OPTIONS[0];
    const strokeColor = outline.type === 'house' ? '#ef4444' : option.color;
    const fillColor = hexToRgba(strokeColor, 0.12);
    const label = outline.type === 'house' ? 'Home' : option.label;
    const centroid = outline.isClosed && outline.points.length >= 3
      ? getPolygonCentroidNormalized(outline.points)
      : null;

    let areaSqFt: number | null = null;
    if (
      isSatelliteMode &&
      outline.isClosed &&
      outline.points.length >= 3 &&
      latitude !== null &&
      canvasSize.width > 0 &&
      canvasSize.height > 0
    ) {
      const areaPx = getPolygonAreaInPixels(outline.points, canvasSize.width, canvasSize.height);
      const metersPerPixel = getMetersPerPixel(latitude, mapPlotData.zoom);
      if (areaPx > 0 && Number.isFinite(metersPerPixel) && metersPerPixel > 0) {
        const areaSqMeters = areaPx * metersPerPixel * metersPerPixel;
        areaSqFt = areaSqMeters * 10.76391041671;
      }
    }

    return {
      option,
      strokeColor,
      fillColor,
      label,
      centroid,
      areaSqFt,
    };
  }, [canvasSize.height, canvasSize.width, isSatelliteMode, latitude, mapPlotData.zoom]);

  const getOutlineSegmentDimensions = useCallback((outline: MapElementOutline) => {
    if (
      !isSatelliteMode ||
      latitude === null ||
      canvasSize.width <= 0 ||
      canvasSize.height <= 0 ||
      outline.points.length < 2
    ) {
      return [] as Array<{ x: number; y: number; feet: number; x1: number; y1: number; x2: number; y2: number }>;
    }

    const metersPerPixel = getMetersPerPixel(latitude, mapPlotData.zoom);
    if (!Number.isFinite(metersPerPixel) || metersPerPixel <= 0) {
      return [] as Array<{ x: number; y: number; feet: number; x1: number; y1: number; x2: number; y2: number }>;
    }

    const segmentCount = outline.isClosed ? outline.points.length : outline.points.length - 1;
    const segments: Array<{ x: number; y: number; feet: number; x1: number; y1: number; x2: number; y2: number }> = [];

    for (let i = 0; i < segmentCount; i += 1) {
      const start = outline.points[i];
      const end = outline.points[(i + 1) % outline.points.length];
      const dxPx = (end.x - start.x) * canvasSize.width;
      const dyPx = (end.y - start.y) * canvasSize.height;
      const feet = Math.hypot(dxPx, dyPx) * metersPerPixel * 3.280839895;
      if (!Number.isFinite(feet) || feet <= 0) continue;
      segments.push({
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2,
        feet,
        x1: start.x,
        y1: start.y,
        x2: end.x,
        y2: end.y,
      });
    }

    return segments;
  }, [canvasSize.height, canvasSize.width, isSatelliteMode, latitude, mapPlotData.zoom]);

  const getWallMeasurementHit = useCallback((point: { x: number; y: number }): { outlineId: string; segmentIndex: number; distancePx: number } | null => {
    if (
      !showDimensions ||
      !isSatelliteMode ||
      latitude === null ||
      canvasSize.width <= 0 ||
      canvasSize.height <= 0
    ) {
      return null;
    }

    const thresholdPx = 12;
    let bestMatch: { outlineId: string; segmentIndex: number; distancePx: number } | null = null;

    const distancePointToSegmentPx = (
      pointX: number,
      pointY: number,
      startX: number,
      startY: number,
      endX: number,
      endY: number
    ) => {
      const vx = endX - startX;
      const vy = endY - startY;
      const wx = pointX - startX;
      const wy = pointY - startY;
      const lenSq = vx * vx + vy * vy;
      if (lenSq <= 1e-6) return Math.hypot(pointX - startX, pointY - startY);
      const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / lenSq));
      const projX = startX + t * vx;
      const projY = startY + t * vy;
      return Math.hypot(pointX - projX, pointY - projY);
    };

    const px = point.x * canvasSize.width;
    const py = point.y * canvasSize.height;

    mapPlotData.outlines.forEach(outline => {
      if (!outline.isClosed || outline.points.length < 2) return;
      const segmentCount = outline.points.length;
      for (let i = 0; i < segmentCount; i += 1) {
        const start = outline.points[i];
        const end = outline.points[(i + 1) % segmentCount];
        const startX = start.x * canvasSize.width;
        const startY = start.y * canvasSize.height;
        const endX = end.x * canvasSize.width;
        const endY = end.y * canvasSize.height;
        const distancePx = distancePointToSegmentPx(px, py, startX, startY, endX, endY);
        if (distancePx > thresholdPx) continue;
        if (!bestMatch || distancePx < bestMatch.distancePx) {
          bestMatch = { outlineId: outline.id, segmentIndex: i, distancePx };
        }
      }
    });

    return bestMatch;
  }, [canvasSize.height, canvasSize.width, isSatelliteMode, latitude, mapPlotData.outlines, showDimensions]);

  const isPointInPolygon = useCallback((point: MapOutlinePoint, polygon: MapOutlinePoint[]): boolean => {
    if (polygon.length < 3) return false;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;
      const intersects =
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / ((yj - yi) || 1e-9) + xi;
      if (intersects) inside = !inside;
    }
    return inside;
  }, []);

  const addStampAtPoint = useCallback((point: { x: number; y: number }) => {
    const nextStamp = createStamp(point, mapPlotData.selectedStampType);

    updateMapPlotData({
      stamps: [...mapPlotData.stamps, nextStamp],
    });
  }, [createStamp, mapPlotData.selectedStampType, mapPlotData.stamps, updateMapPlotData]);

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!mapPlotData.isViewSet) return;
    if (Date.now() - lastDragAtRef.current < 180) return;

    const point = getNormalizedPoint(event.clientX, event.clientY);
    if (!point) return;

    if (showDimensions) {
      const wallHit = getWallMeasurementHit(point);
      if (wallHit) {
        setSelectedWallMeasurement({
          outlineId: wallHit.outlineId,
          segmentIndex: wallHit.segmentIndex,
        });
      } else {
        setSelectedWallMeasurement(null);
      }
      return;
    }

    if (mapPlotData.drawTool === 'outline') {
      const closedHit = [...mapPlotData.outlines]
        .reverse()
        .find(outline => outline.isClosed && isPointInPolygon(point, outline.points));
      if (closedHit) {
        setSnapToFirst(false);
        updateMapPlotData({
          activeOutlineId: closedHit.id,
          selectedElementType: closedHit.type,
          selectedStampType: closedHit.type,
        });
        return;
      }

      if (activeOutline && activeOutline.isClosed) {
        updateMapPlotData({ activeOutlineId: null });
        return;
      }

      if (!activeOutline) {
        const firstPoint = createOutlinePoint(point);
        const nextOutline: MapElementOutline = {
          id: crypto.randomUUID(),
          type: selectedElementType,
          points: [firstPoint],
          isClosed: false,
        };
        updateMapPlotData({
          outlines: [...mapPlotData.outlines, nextOutline],
          activeOutlineId: nextOutline.id,
          selectedStampType: selectedElementType,
        });
        return;
      }

      updateMapPlotData({
        outlines: mapPlotData.outlines.map(outline =>
          outline.id === activeOutline.id
            ? { ...outline, points: [...outline.points, createOutlinePoint(point)] }
            : outline
        ),
      });
      return;
    }

    addStampAtPoint(point);
  };

  const handleOverlayPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!mapPlotData.isViewSet || mapPlotData.drawTool !== 'outline' || showDimensions) return;

    const point = getNormalizedPoint(event.clientX, event.clientY);
    const container = mapRef.current;
    if (!point || !container) return;
    if (!activeOutline || activeOutline.points.length === 0) return;

    const rect = container.getBoundingClientRect();
    const thresholdPx = activeOutline.isClosed ? 18 : 22;

    let closestIndex = -1;
    let closestDistance = Number.POSITIVE_INFINITY;
    activeOutline.points.forEach((node, index) => {
      const dx = (point.x - node.x) * rect.width;
      const dy = (point.y - node.y) * rect.height;
      const distance = Math.hypot(dx, dy);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    if (activeOutline.isClosed) {
      if (closestIndex === -1 || closestDistance > thresholdPx) return;
      event.preventDefault();
      event.stopPropagation();
      setSnapToFirst(false);
      outlineNodeGestureRef.current = {
        mode: 'move-node',
        outlineId: activeOutline.id,
        nodeIndex: closestIndex,
        startClientX: event.clientX,
        startClientY: event.clientY,
        isDragging: false,
      };
      lastDragAtRef.current = Date.now();
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    if (activeOutline.points.length >= 3 && closestIndex === 0 && closestDistance <= thresholdPx) {
      event.preventDefault();
      event.stopPropagation();
      setSnapToFirst(false);
      outlineNodeGestureRef.current = {
        mode: 'close-outline',
        outlineId: activeOutline.id,
        startClientX: event.clientX,
        startClientY: event.clientY,
        hasMoved: false,
      };
      lastDragAtRef.current = Date.now();
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const stopOutlineNodeDrag = () => {
    const gesture = outlineNodeGestureRef.current;
    if (!gesture) return;

    if (gesture.mode === 'close-outline') {
      setSnapToFirst(false);
      const outline = mapPlotData.outlines.find(item => item.id === gesture.outlineId);
      if (outline && !gesture.hasMoved && !outline.isClosed && outline.points.length >= 3) {
        updateMapPlotData({
          outlines: mapPlotData.outlines.map(item =>
            item.id === outline.id ? { ...item, isClosed: true } : item
          ),
          activeOutlineId: null,
        });
      }
    }

    lastDragAtRef.current = Date.now();
    outlineNodeGestureRef.current = null;
  };

  const moveStamp = useCallback((stampId: string, x: number, y: number) => {
    const clampedX = clampNormalized(x);
    const clampedY = clampNormalized(y);
    const geo = getLatLngFromNormalizedPoint({ x: clampedX, y: clampedY });

    updateMapPlotData({
      stamps: mapPlotData.stamps.map(stamp =>
        stamp.id === stampId
          ? {
              ...stamp,
              x: clampedX,
              y: clampedY,
              ...(geo ? { lat: geo.lat, lng: geo.lng } : {}),
            }
          : stamp
      ),
    });
  }, [getLatLngFromNormalizedPoint, mapPlotData.stamps, updateMapPlotData]);

  const handleStampPointerDown = (stampId: string, event: React.PointerEvent<HTMLButtonElement>) => {
    if (!mapPlotData.isViewSet || showDimensions) return;
    event.preventDefault();
    event.stopPropagation();
    dragMovedRef.current = false;
    setDraggingStampId(stampId);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleStampPointerMove = (stampId: string, event: React.PointerEvent<HTMLButtonElement>) => {
    if (showDimensions) return;
    if (draggingStampId !== stampId) return;
    dragMovedRef.current = true;
    const point = getNormalizedPoint(event.clientX, event.clientY);
    if (!point) return;
    moveStamp(stampId, point.x, point.y);
  };

  const stopDragging = () => {
    if (dragMovedRef.current) {
      lastDragAtRef.current = Date.now();
    }
    setDraggingStampId(null);
  };

  const setView = () => {
    if (!canSetView) return;
    const anchoredStamps = mapPlotData.stamps.map(stamp => {
      if (Number.isFinite(stamp.lat) && Number.isFinite(stamp.lng)) return stamp;
      const geo = getLatLngFromNormalizedPoint({ x: stamp.x, y: stamp.y });
      return geo ? { ...stamp, lat: geo.lat, lng: geo.lng } : stamp;
    });
    const anchoredOutlines = mapPlotData.outlines.map(outline => ({
      ...outline,
      points: outline.points.map(point => {
        if (Number.isFinite(point.lat) && Number.isFinite(point.lng)) return point;
        const geo = getLatLngFromNormalizedPoint({ x: point.x, y: point.y });
        return geo ? { ...point, lat: geo.lat, lng: geo.lng } : point;
      }),
    }));

    updateMapPlotData({
      isViewSet: true,
      tilt: 0,
      stamps: anchoredStamps,
      outlines: anchoredOutlines,
    });
  };

  const unsetView = () => {
    const anchoredStamps = mapPlotData.stamps.map(stamp => {
      if (Number.isFinite(stamp.lat) && Number.isFinite(stamp.lng)) return stamp;
      const geo = getLatLngFromNormalizedPoint({ x: stamp.x, y: stamp.y });
      return geo ? { ...stamp, lat: geo.lat, lng: geo.lng } : stamp;
    });
    const anchoredOutlines = mapPlotData.outlines.map(outline => ({
      ...outline,
      points: outline.points.map(point => {
        if (Number.isFinite(point.lat) && Number.isFinite(point.lng)) return point;
        const geo = getLatLngFromNormalizedPoint({ x: point.x, y: point.y });
        return geo ? { ...point, lat: geo.lat, lng: geo.lng } : point;
      }),
    }));

    updateMapPlotData({
      isViewSet: false,
      stamps: anchoredStamps,
      outlines: anchoredOutlines,
    });
  };

  const onCameraChanged = (event: any) => {
    if (mapPlotData.isViewSet) return;

    const detail = event?.detail;
    const mapFromEvent = (event?.map as google.maps.Map | undefined) ?? null;
    const cameraMap = mapFromEvent ?? googleMapInstance;
    if (mapFromEvent && mapFromEvent !== googleMapInstance) {
      setGoogleMapInstance(mapFromEvent);
    }
    if (!detail?.center) return;

    const reprojected = reprojectAnchoredGeometry(mapPlotData.stamps, mapPlotData.outlines, cameraMap);

    updateMapPlotData({
      centerLat: detail.center.lat,
      centerLng: detail.center.lng,
      zoom: typeof detail.zoom === 'number' ? Math.max(MAP_MIN_ZOOM, detail.zoom) : mapPlotData.zoom,
      heading: typeof detail.heading === 'number' ? detail.heading : mapPlotData.heading,
      tilt: 0,
      stamps: reprojected.stamps,
      outlines: reprojected.outlines,
    });
  };

  const clearOutline = () => {
    setSnapToFirst(false);
    if (mapPlotData.activeOutlineId) {
      updateMapPlotData({
        outlines: mapPlotData.outlines.filter(outline => outline.id !== mapPlotData.activeOutlineId),
        activeOutlineId: null,
      });
      return;
    }
    updateMapPlotData({ outlines: [], activeOutlineId: null });
  };

  const activatePestTool = useCallback((type: MapPestStampType) => {
    updateMapPlotData({
      drawTool: 'stamp',
      selectedPestType: type,
      selectedStampType: type,
    });
  }, [updateMapPlotData]);

  const activateObjectTool = useCallback((type: MapObjectStampType) => {
    updateMapPlotData({
      drawTool: 'stamp',
      selectedObjectType: type,
      selectedStampType: type,
    });
  }, [updateMapPlotData]);

  const activateElementTool = useCallback((type: MapElementStampType) => {
    updateMapPlotData({
      drawTool: 'outline',
      selectedElementType: type,
      selectedStampType: type,
      activeOutlineId: null,
    });
  }, [updateMapPlotData]);

  const handleUndo = () => {
    if (mapPlotData.drawTool === 'outline') {
      const workingOutline = activeOutline ?? mapPlotData.outlines[mapPlotData.outlines.length - 1] ?? null;
      if (!workingOutline) {
        if (mapPlotData.stamps.length > 0) {
          updateMapPlotData({ stamps: mapPlotData.stamps.slice(0, -1) });
        }
        return;
      }

      if (workingOutline.isClosed) {
        updateMapPlotData({
          outlines: mapPlotData.outlines.map(outline =>
            outline.id === workingOutline.id ? { ...outline, isClosed: false } : outline
          ),
          activeOutlineId: workingOutline.id,
        });
        return;
      }

      if (workingOutline.points.length <= 1) {
        updateMapPlotData({
          outlines: mapPlotData.outlines.filter(outline => outline.id !== workingOutline.id),
          activeOutlineId: null,
        });
        return;
      }

      updateMapPlotData({
        outlines: mapPlotData.outlines.map(outline =>
          outline.id === workingOutline.id
            ? { ...outline, points: outline.points.slice(0, -1) }
            : outline
        ),
      });
      return;
    }

    if (mapPlotData.stamps.length === 0 && mapPlotData.outlines.length > 0) {
      const lastOutline = mapPlotData.outlines[mapPlotData.outlines.length - 1];
      updateMapPlotData({
        outlines: mapPlotData.outlines.map(outline =>
          outline.id === lastOutline.id ? { ...outline, isClosed: false } : outline
        ),
        activeOutlineId: lastOutline.id,
      });
      return;
    }

    updateMapPlotData({ stamps: mapPlotData.stamps.slice(0, -1) });
  };

  const handleOverlayPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const gesture = outlineNodeGestureRef.current;
    if (gesture) {
      if (gesture.mode === 'close-outline') {
        const dragDistance = Math.hypot(event.clientX - gesture.startClientX, event.clientY - gesture.startClientY);
        if (dragDistance >= 8) {
          gesture.hasMoved = true;
        }
        return;
      }

      const point = getNormalizedPoint(event.clientX, event.clientY);
      if (!point) return;
      const snappedPoint = snapPointToGrid(point);
      const dragDistance = Math.hypot(event.clientX - gesture.startClientX, event.clientY - gesture.startClientY);
      if (dragDistance >= 4) {
        gesture.isDragging = true;
      }
      if (!gesture.isDragging) return;
      const geo = getLatLngFromNormalizedPoint({ x: snappedPoint.x, y: snappedPoint.y });
      updateMapPlotData({
        outlines: mapPlotData.outlines.map(outline =>
          outline.id === gesture.outlineId
            ? {
                ...outline,
                points: outline.points.map((node, index) =>
                  index === gesture.nodeIndex
                    ? {
                        ...node,
                        x: snappedPoint.x,
                        y: snappedPoint.y,
                        ...(geo ? { lat: geo.lat, lng: geo.lng } : {}),
                      }
                    : node
                ),
              }
            : outline
        ),
      });
      return;
    }

    if (
      !mapPlotData.isViewSet ||
      mapPlotData.drawTool !== 'outline' ||
      activeOutlineClosed ||
      activeOutlinePoints.length < 3
    ) {
      if (snapToFirst) setSnapToFirst(false);
      return;
    }
    const container = mapRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const mx = (event.clientX - rect.left) / rect.width;
    const my = (event.clientY - rect.top) / rect.height;
    const first = activeOutlinePoints[0];
    const dx = (mx - first.x) * rect.width;
    const dy = (my - first.y) * rect.height;
    setSnapToFirst(Math.sqrt(dx * dx + dy * dy) < 18);
  };

  const handleClear = () => {
    if (mapPlotData.drawTool === 'outline') {
      clearOutline();
      return;
    }

    if (mapPlotData.stamps.length === 0 && mapPlotData.outlines.length > 0) {
      updateMapPlotData({ outlines: [], activeOutlineId: null });
      return;
    }

    updateMapPlotData({ stamps: [] });
  };

  const hasUndo = mapPlotData.outlines.length > 0 || mapPlotData.stamps.length > 0;
  const hasClear = mapPlotData.outlines.length > 0 || mapPlotData.stamps.length > 0;
  const canRenderDimensions =
    showDimensions &&
    isSatelliteMode &&
    latitude !== null &&
    canvasSize.width > 0 &&
    canvasSize.height > 0;

  const canShowStampMenus = mapPlotData.isViewSet && mapPlotData.drawTool === 'stamp';
  const canShowPestMenu = canShowStampMenus;
  const canShowObjectMenu = canShowStampMenus;
  const canShowElementMenu = mapPlotData.isViewSet && mapPlotData.drawTool === 'outline';
  const canRenderActiveStampMenu =
    (activeStampMenu === 'pest' && canShowPestMenu) ||
    (activeStampMenu === 'object' && canShowObjectMenu) ||
    (activeStampMenu === 'element' && canShowElementMenu);
  const isPestSelected = isMapPestStampType(mapPlotData.selectedStampType);
  const isObjectSelected = isMapObjectStampType(mapPlotData.selectedStampType);
  const isElementSelected = isMapElementStampType(mapPlotData.selectedStampType);

  useEffect(() => {
    if (
      (activeStampMenu === 'pest' && !canShowPestMenu) ||
      (activeStampMenu === 'object' && !canShowObjectMenu) ||
      (activeStampMenu === 'element' && !canShowElementMenu)
    ) {
      setActiveStampMenu(null);
    }
  }, [activeStampMenu, canShowElementMenu, canShowObjectMenu, canShowPestMenu]);

  useEffect(() => {
    if (!showDimensions) {
      if (selectedWallMeasurement) setSelectedWallMeasurement(null);
      return;
    }

    setDraggingStampId(null);
    setSnapToFirst(false);
    outlineNodeGestureRef.current = null;

    if (!selectedWallMeasurement) return;
    const selectedOutline = mapPlotData.outlines.find(outline => outline.id === selectedWallMeasurement.outlineId);
    if (!selectedOutline || !selectedOutline.isClosed) {
      setSelectedWallMeasurement(null);
      return;
    }
    const segments = getOutlineSegmentDimensions(selectedOutline);
    if (!segments[selectedWallMeasurement.segmentIndex]) {
      setSelectedWallMeasurement(null);
    }
  }, [getOutlineSegmentDimensions, mapPlotData.outlines, selectedWallMeasurement, showDimensions]);

  return (
    <div className={styles.mapStepContent}>
      <div className={styles.mapCanvasCard}>
        <div ref={mapRef} className={styles.mapInteractiveCanvas}>
          {isBlankGridMode && <div className={styles.mapBlankCanvas} />}
          {isSatelliteMode && mapsError && (
            <div className={styles.mapEmptyState}>{mapsError}</div>
          )}
          {isSatelliteMode && !mapsError && !googleMapsApiKey && (
            <div className={styles.mapEmptyState}>Loading satellite map...</div>
          )}
          {isSatelliteMode && !mapsError && googleMapsApiKey && hasCoordinates && (
            <APIProvider apiKey={googleMapsApiKey}>
              <Map
                center={{ lat: latitude!, lng: longitude! }}
                zoom={mapPlotData.zoom}
                minZoom={MAP_MIN_ZOOM}
                heading={mapPlotData.heading}
                tilt={mapPlotData.tilt}
                mapTypeId="satellite"
                onCameraChanged={onCameraChanged}
                gestureHandling={mapPlotData.isViewSet ? 'none' : 'greedy'}
                zoomControl={false}
                rotateControl={false}
                mapTypeControl={false}
                fullscreenControl={false}
                streetViewControl={false}
                keyboardShortcuts={!mapPlotData.isViewSet}
                disableDefaultUI={true}
                className={styles.mapGoogleCanvas}
              >
                <MapInstanceBridge onMapReady={setGoogleMapInstance} />
              </Map>
            </APIProvider>
          )}
          {isSatelliteMode && !mapsError && googleMapsApiKey && !hasCoordinates && (
            <div className={styles.mapEmptyState}>Missing coordinates. Go back and choose an address.</div>
	          )}
          {isBlankGridMode && !mapPlotData.isViewSet && (
            <div
              className={styles.mapViewAdjustLayer}
              onWheel={handleBlankGridWheel}
              onPointerDown={handleBlankGridPointerDown}
              onPointerMove={handleBlankGridPointerMove}
              onPointerUp={handleBlankGridPointerEnd}
              onPointerCancel={handleBlankGridPointerEnd}
              onPointerLeave={handleBlankGridPointerEnd}
            />
          )}
	          <div className={styles.mapGridOverlay} style={blankGridWorkspaceStyle} />
            <div className={styles.mapLegendControls}>
              <button
                type="button"
                className={`${styles.mapLegendBtn} ${showLegendLabels ? styles.mapLegendBtnActive : ''}`}
                onClick={() => setShowLegendLabels(prev => !prev)}
                title={showLegendLabels ? 'Hide Legend Labels' : 'Show Legend Labels'}
                aria-label={showLegendLabels ? 'Hide Legend Labels' : 'Show Legend Labels'}
              >
                <List size={14} />
                <span>Legend</span>
              </button>
            </div>
	          <div className={styles.mapViewControls}>
	            <div className={styles.mapViewControlGroup}>
	              <div className={styles.mapToolToggle}>
	                <button
	                  type="button"
	                  className={`${styles.mapIconBtn} ${styles.mapToggleFirst} ${isSatelliteMode ? styles.mapIconBtnActive : ''}`}
	                  onClick={() => updateMapPlotData({ backgroundMode: 'satellite' })}
	                  title="Satellite Background"
	                  aria-label="Satellite Background"
	                >
	                  <MapIcon size={16} />
	                </button>
	                <button
	                  type="button"
	                  className={`${styles.mapIconBtn} ${styles.mapToggleLast} ${isBlankGridMode ? styles.mapIconBtnActive : ''}`}
	                  onClick={() => updateMapPlotData({ backgroundMode: 'blank-grid' })}
	                  title="Blank Grid Background"
	                  aria-label="Blank Grid Background"
	                >
	                  <Grid3x3 size={16} />
	                </button>
	              </div>

		              {!mapPlotData.isViewSet ? (
		                <button
		                  type="button"
		                  className={`${styles.mapIconBtn} ${styles.mapIconBtnActive}`}
	                  onClick={setView}
	                  disabled={!canSetView}
	                  title="Set View"
	                  aria-label="Set View"
	                >
	                  <Lock size={16} />
	                </button>
	              ) : (
	                <button
	                  type="button"
	                  className={styles.mapIconBtn}
	                  onClick={unsetView}
	                  title="Unset View"
	                  aria-label="Unset View"
		                >
		                  <Unlock size={16} />
		                </button>
		              )}
		              <button
		                type="button"
		                className={`${styles.mapIconBtn} ${showDimensions ? styles.mapIconBtnActive : ''}`}
		                onClick={() => {
                      setSelectedWallMeasurement(null);
                      setShowDimensions(prev => !prev);
                    }}
		                title="Toggle Dimensions"
		                aria-label="Toggle Dimensions"
		              >
		                <Ruler size={16} />
		              </button>
		            </div>
		          </div>

	          <div
	            className={`${styles.mapPlotOverlay} ${mapPlotData.isViewSet ? styles.mapPlotOverlayActive : ''}`}
            style={blankGridWorkspaceStyle}
            onClick={handleOverlayClick}
            onPointerDown={handleOverlayPointerDown}
            onPointerMove={handleOverlayPointerMove}
            onPointerUp={stopOutlineNodeDrag}
            onPointerCancel={stopOutlineNodeDrag}
            onPointerLeave={stopOutlineNodeDrag}
          >
            <svg className={styles.mapSvgOverlay} viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <filter id="nodeShadow" x="-60%" y="-60%" width="220%" height="220%">
                  <feDropShadow dx="0" dy="0.4" stdDeviation="0.7" floodColor="rgba(0,0,0,0.4)" />
                </filter>
              </defs>

              {mapPlotData.outlines.map(outline => {
                const metrics = getOutlineMetrics(outline);
                const isActive = outline.id === activeOutline?.id;
                const showAreaLabel = canRenderDimensions && metrics.areaSqFt !== null;
                const shouldShowOutlineText = outline.isClosed && metrics.centroid && (showLegendLabels || showAreaLabel);
                const selectedSegment =
                  canRenderDimensions && selectedWallMeasurement?.outlineId === outline.id
                    ? getOutlineSegmentDimensions(outline)[selectedWallMeasurement.segmentIndex] ?? null
                    : null;
                const selectedSegmentLabel = selectedSegment ? `${Math.round(selectedSegment.feet)} ft` : '';
                const selectedSegmentBubbleWidth = selectedSegmentLabel
                  ? Math.max(7.2, selectedSegmentLabel.length * 1.2 + 2.4)
                  : 0;
                return (
                  <g key={outline.id}>
	                    {outline.points.length >= 2 && (
	                      outline.points.length >= 3 ? (
	                        <polygon
	                          points={outline.points.map(p => `${p.x * 100},${p.y * 100}`).join(' ')}
	                          fill={outline.isClosed ? metrics.fillColor : 'none'}
	                          stroke={metrics.strokeColor}
	                          strokeWidth={isActive ? '0.38' : '0.28'}
	                          strokeDasharray={outline.isClosed ? 'none' : '2.5 1.2'}
	                          strokeLinejoin="round"
	                        />
	                      ) : (
	                        <polyline
	                          points={outline.points.map(p => `${p.x * 100},${p.y * 100}`).join(' ')}
	                          fill="none"
	                          stroke={metrics.strokeColor}
	                          strokeWidth={isActive ? '0.38' : '0.28'}
	                          strokeLinejoin="round"
	                        />
	                      )
	                    )}

	                    {shouldShowOutlineText && metrics.centroid && (
	                      <text
	                        x={metrics.centroid.x * 100}
	                        y={metrics.centroid.y * 100}
	                        textAnchor="middle"
	                        dominantBaseline="middle"
	                        className={styles.mapHomeFootprintText}
	                        style={{ fill: metrics.strokeColor }}
	                      >
                          {showLegendLabels && (
	                        <tspan x={metrics.centroid.x * 100} dy={showAreaLabel ? '-0.9' : '0'}>
	                          {metrics.label}
	                        </tspan>
                          )}
	                        {showAreaLabel && (
	                          <tspan x={metrics.centroid.x * 100} dy={showLegendLabels ? '2.1' : '0'}>
	                            {`${Math.round(metrics.areaSqFt ?? 0).toLocaleString()} sq ft`}
	                          </tspan>
	                        )}
	                      </text>
	                    )}

	                    {canRenderDimensions && selectedSegment && (
                        <>
                          <line
                            x1={selectedSegment.x1 * 100}
                            y1={selectedSegment.y1 * 100}
                            x2={selectedSegment.x2 * 100}
                            y2={selectedSegment.y2 * 100}
                            stroke="rgba(255,255,255,0.96)"
                            strokeWidth="0.95"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <line
                            x1={selectedSegment.x1 * 100}
                            y1={selectedSegment.y1 * 100}
                            x2={selectedSegment.x2 * 100}
                            y2={selectedSegment.y2 * 100}
                            stroke={metrics.strokeColor}
                            strokeWidth="0.48"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <g transform={`translate(${selectedSegment.x * 100} ${selectedSegment.y * 100})`}>
                            <rect
                              x={-selectedSegmentBubbleWidth / 2}
                              y={-1.55}
                              width={selectedSegmentBubbleWidth}
                              height={3.1}
                              rx="1.35"
                              ry="1.35"
                              className={styles.mapDimensionBubble}
                            />
                            <text
                              key={`${outline.id}-seg-${selectedWallMeasurement?.segmentIndex ?? 0}`}
                              x={0}
                              y={0}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className={styles.mapDimensionText}
                              style={{ fill: metrics.strokeColor }}
                            >
                              {selectedSegmentLabel}
                            </text>
                          </g>
                        </>
                      )}

                    {(!outline.isClosed || isActive) && outline.points.slice(1).map((point, i) => (
                      <circle
                        key={`${outline.id}-mid-${i + 1}`}
                        cx={point.x * 100}
                        cy={point.y * 100}
                        r="0.72"
                        fill="white"
                        stroke={outline.isClosed ? metrics.strokeColor : '#2563eb'}
                        strokeWidth="0.35"
                        filter="url(#nodeShadow)"
                      />
                    ))}

                    {(!outline.isClosed || isActive) && outline.points.length >= 1 && (
                      <>
                        {isActive && !outline.isClosed && snapToFirst && (
                          <circle
                            cx={outline.points[0].x * 100}
                            cy={outline.points[0].y * 100}
                            r="2.6"
                            fill="none"
                            stroke="#f97316"
                            strokeWidth="0.35"
                            className={styles.mapSnapRing}
                          />
                        )}
                        <circle
                          cx={outline.points[0].x * 100}
                          cy={outline.points[0].y * 100}
                          r={outline.isClosed ? 0.92 : outline.points.length >= 3 ? 1.04 : 0.72}
                          fill="white"
                          stroke={outline.isClosed ? metrics.strokeColor : outline.points.length >= 3 ? '#f97316' : '#2563eb'}
                          strokeWidth="0.4"
                          filter="url(#nodeShadow)"
                        />
                      </>
                    )}
                  </g>
                );
	              })}
	            </svg>
	            {mapPlotData.stamps.map(stamp => {
              const option = getMapStampOption(stamp.type);
              const isPestStamp = option.category === 'pest';
              const isObjectStamp = option.category === 'object';
              return (
                <button
                  key={stamp.id}
                  type="button"
                  className={`${styles.mapStamp} ${isPestStamp ? styles.mapStampPest : ''} ${isObjectStamp ? styles.mapStampObject : ''}`}
                  style={{
                    left: `${stamp.x * 100}%`,
                    top: `${stamp.y * 100}%`,
                    ...(isPestStamp
                      ? { color: '#ffffff' }
                      : isObjectStamp
                      ? { color: '#ffffff' }
                      : { backgroundColor: option.color, color: '#ffffff' }),
                  }}
                  title={option.label}
                  onPointerDown={event => handleStampPointerDown(stamp.id, event)}
                  onPointerMove={event => handleStampPointerMove(stamp.id, event)}
                  onPointerUp={stopDragging}
                  onPointerCancel={stopDragging}
                >
                  {isObjectStamp ? (
                    <PlotObjectBlueprintGlyph type={stamp.type as MapObjectStampType} />
                  ) : (
                    <MapStampGlyph type={stamp.type} size={isPestStamp ? 36 : 16} />
                  )}
                </button>
              );
            })}
          </div>

          <div className={styles.mapToolbarDock}>
            {canRenderActiveStampMenu && activeStampMenu && (
              <div
                className={`${styles.mapStampPicker} ${activeStampMenu === 'pest' ? styles.mapStampPickerPest : ''}`}
                role="menu"
                aria-label={
                  activeStampMenu === 'pest'
                    ? 'Pest stamps'
                    : activeStampMenu === 'object'
                    ? 'Object stamps'
                    : 'Element stamps'
                }
              >
                {(
                  activeStampMenu === 'pest'
                    ? MAP_PEST_STAMP_OPTIONS
                    : activeStampMenu === 'object'
                    ? MAP_OBJECT_STAMP_OPTIONS
                    : MAP_ELEMENT_STAMP_OPTIONS
                ).map(option => (
                  <button
                    key={option.type}
                    type="button"
                    className={`${styles.mapIconBtn} ${styles.mapPickerBtn} ${mapPlotData.selectedStampType === option.type ? styles.mapIconBtnActive : ''}`}
                    onClick={() => {
                      if (activeStampMenu === 'pest') {
                        activatePestTool(option.type as MapPestStampType);
                      } else if (activeStampMenu === 'object') {
                        activateObjectTool(option.type as MapObjectStampType);
                      } else {
                        activateElementTool(option.type as MapElementStampType);
                      }
                      setActiveStampMenu(null);
                    }}
                    title={option.label}
                    aria-label={option.label}
                  >
                    <MapStampGlyph type={option.type} size={18} />
                  </button>
                ))}
              </div>
            )}

	            <div className={styles.mapIconToolbar}>
	              <button
	                type="button"
                className={styles.mapIconBtn}
                onClick={onBack}
                title="Back"
                aria-label="Back"
	              >
	                <ArrowLeft size={16} />
	              </button>

	              <div className={`${styles.mapToolToggle} ${!mapPlotData.isViewSet ? styles.mapToolToggleDisabled : ''}`}>
                <button
                  type="button"
                  className={`${styles.mapIconBtn} ${styles.mapToggleFirst} ${mapPlotData.drawTool === 'stamp' ? styles.mapIconBtnActive : ''}`}
                  onClick={() =>
                    updateMapPlotData({
                      drawTool: 'stamp',
                      selectedStampType: isMapPestStampType(mapPlotData.selectedStampType) || isMapObjectStampType(mapPlotData.selectedStampType)
                        ? mapPlotData.selectedStampType
                        : selectedPestType,
                    })
                  }
                  disabled={!mapPlotData.isViewSet}
                  title="Stamp Tool"
                  aria-label="Stamp Tool"
                >
                  <MapPinned size={16} />
                </button>
                <button
                  type="button"
                  className={`${styles.mapIconBtn} ${styles.mapToggleLast} ${mapPlotData.drawTool === 'outline' ? styles.mapIconBtnActive : ''}`}
                  onClick={() => updateMapPlotData({ drawTool: 'outline', selectedStampType: selectedElementType })}
                  disabled={!mapPlotData.isViewSet}
                  title="Outline Tool"
                  aria-label="Outline Tool"
                >
                  <Move3d size={16} />
                </button>
              </div>

              {canShowPestMenu && (
                <div className={styles.mapToolToggle}>
                  <button
                    type="button"
                    className={`${styles.mapIconBtn} ${styles.mapToggleFirst} ${styles.mapStampTypeBtn} ${isPestSelected || activeStampMenu === 'pest' ? styles.mapIconBtnActive : ''}`}
                    onClick={() => {
                      activatePestTool(selectedPestType);
                      setActiveStampMenu(prev => (prev === 'pest' ? null : 'pest'));
                    }}
                    title="Pest Stamps"
                    aria-label="Pest Stamps"
                  >
                    <MapStampGlyph type={selectedPestType} size={18} />
                  </button>
                  <button
                    type="button"
                    className={`${styles.mapIconBtn} ${styles.mapToggleLast} ${styles.mapStampTypeBtn} ${isObjectSelected || activeStampMenu === 'object' ? styles.mapIconBtnActive : ''}`}
                    onClick={() => {
                      activateObjectTool(selectedObjectType);
                      setActiveStampMenu(prev => (prev === 'object' ? null : 'object'));
                    }}
                    title="Object Stamps"
                    aria-label="Object Stamps"
                  >
                    <MapStampGlyph type={selectedObjectType} size={18} />
                  </button>
                </div>
              )}

              {canShowElementMenu && (
                <button
                  type="button"
                  className={`${styles.mapIconBtn} ${styles.mapStampTypeBtn} ${isElementSelected || activeStampMenu === 'element' ? styles.mapIconBtnActive : ''}`}
                  onClick={() => {
                    activateElementTool(selectedElementType);
                    setActiveStampMenu(prev => (prev === 'element' ? null : 'element'));
                  }}
                  title="Elements"
                  aria-label="Elements"
                >
                  <MapStampGlyph type={selectedElementType} size={18} />
                </button>
              )}

              <button
                type="button"
                className={styles.mapIconBtn}
                onClick={handleUndo}
                disabled={!mapPlotData.isViewSet || !hasUndo}
                title="Undo"
                aria-label="Undo"
              >
                <Undo2 size={16} />
              </button>

              <button
                type="button"
                className={`${styles.mapIconBtn} ${styles.mapIconBtnWarn}`}
                onClick={handleClear}
                disabled={!mapPlotData.isViewSet || !hasClear}
                title="Clear"
                aria-label="Clear"
              >
                <Trash2 size={16} />
              </button>

              <button
                type="button"
                className={`${styles.mapIconBtn} ${styles.mapIconBtnPrimary}`}
                onClick={onNext}
                disabled={!canNext}
                title="Next"
                aria-label="Next"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function StepPhotos({
  photos,
  onPhotosChange,
}: {
  photos: PhotoPreview[];
  onPhotosChange: (photos: PhotoPreview[]) => void;
}) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = 5 - photos.length;
    const toAdd = files.slice(0, remaining);

    const newPreviews: PhotoPreview[] = await Promise.all(
      toAdd.map(async file => {
        const { base64, dataUrl, mimeType } = await fileToBase64(file);
        return { file, dataUrl, base64, mimeType };
      })
    );

    onPhotosChange([...photos, ...newPreviews]);
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };

  const remaining = 5 - photos.length;

  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>Add Photos</h2>
      <p className={styles.stepDesc}>Capture up to 5 photos of the issue</p>

      <div className={styles.photoGrid}>
        {photos.map((photo, i) => (
          <div key={i} className={styles.photoThumb}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.dataUrl} alt={`Photo ${i + 1}`} />
            <button
              className={styles.removePhotoBtn}
              onClick={() => removePhoto(i)}
              aria-label="Remove photo"
            >
              ×
            </button>
          </div>
        ))}
        {remaining > 0 && (
          <button
            className={styles.photoPlaceholder}
            onClick={() => cameraInputRef.current?.click()}
            aria-label="Add photo"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Photo
          </button>
        )}
      </div>

      {remaining > 0 && (
        <div className={styles.photoActions}>
          <button
            className={styles.photoActionBtn}
            onClick={() => cameraInputRef.current?.click()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Camera
          </button>
          <button
            className={styles.photoActionBtn}
            onClick={() => libraryInputRef.current?.click()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
              <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2"/>
              <polyline points="21 15 16 10 5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Gallery
          </button>
        </div>
      )}

      {/* Camera — no multiple, capture forces camera */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      {/* Library — multiple allowed, no capture */}
      <input
        ref={libraryInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
}

function StepAIReview({
  aiResult,
  notes,
  customerMentioned,
  isHighPriority,
  pestOptions,
  selectedPestValue,
  otherPestValue,
  isPestOptionsLoading,
  onAIResultChange,
  onPestValueChange,
  onOtherPestChange,
  onNotesChange,
  onCustomerMentionedChange,
  onHighPriorityChange,
}: {
  aiResult: AIResult;
  notes: string;
  customerMentioned: boolean;
  isHighPriority: boolean;
  pestOptions: PestOption[];
  selectedPestValue: string;
  otherPestValue: string;
  isPestOptionsLoading: boolean;
  onAIResultChange: (result: AIResult) => void;
  onPestValueChange: (value: string) => void;
  onOtherPestChange: (value: string) => void;
  onNotesChange: (notes: string) => void;
  onCustomerMentionedChange: (v: boolean) => void;
  onHighPriorityChange: (v: boolean) => void;
}) {
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startDictation = () => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results as any[])
        .map((r: any) => r[0].transcript)
        .join(' ');
      onNotesChange(notes + (notes ? ' ' : '') + transcript);
    };

    recognition.onend = () => setIsDictating(false);
    recognition.onerror = () => setIsDictating(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsDictating(true);
  };

  const stopDictation = () => {
    recognitionRef.current?.stop();
    setIsDictating(false);
  };

  const hasSpeechSupport =
    typeof window !== 'undefined' &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>AI Review</h2>
      <p className={styles.stepDesc}>Review and edit the AI&apos;s findings</p>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Issue Detected</label>
        <input
          className={styles.fieldInput}
          value={aiResult.issue_detected}
          onChange={e => onAIResultChange({ ...aiResult, issue_detected: e.target.value })}
          placeholder="What issue was found?"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Primary Pest Concern</label>
        <div className={styles.selectWrapper}>
          <select
            className={styles.fieldSelect}
            value={selectedPestValue}
            onChange={e => onPestValueChange(e.target.value)}
            disabled={isPestOptionsLoading}
          >
            <option value="">Select pest concern</option>
            {pestOptions.map(option => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
            <option value={OTHER_PEST_OPTION_VALUE}>Other</option>
          </select>
          <ChevronDown size={16} className={styles.selectChevron} />
        </div>
        {selectedPestValue === OTHER_PEST_OPTION_VALUE && (
          <input
            className={styles.fieldInput}
            value={otherPestValue}
            onChange={e => onOtherPestChange(e.target.value)}
            placeholder="Type the pest concern"
          />
        )}
        {isPestOptionsLoading && (
          <p className={styles.fieldHint}>Loading company pest options...</p>
        )}
        {!isPestOptionsLoading && pestOptions.length === 0 && (
          <p className={styles.fieldHint}>No company pest options are configured yet.</p>
        )}
        {aiResult.service_category && (
          <p className={styles.fieldHint}>AI service type: {aiResult.service_category}</p>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>AI Summary</label>
        <textarea
          className={`${styles.fieldTextarea} ${styles.fieldTextareaAuto}`}
          value={aiResult.ai_summary}
          onChange={e => {
            onAIResultChange({ ...aiResult, ai_summary: e.target.value });
            e.target.style.height = 'auto';
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          ref={el => {
            if (el) {
              el.style.height = 'auto';
              el.style.height = `${el.scrollHeight}px`;
            }
          }}
          placeholder="Summary of findings and recommended action"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Notes</label>
        <textarea
          className={styles.fieldTextarea}
          value={notes}
          onChange={e => onNotesChange(e.target.value)}
          placeholder="Add any additional notes about this opportunity…"
          rows={4}
        />
        {hasSpeechSupport && (
          <button
            className={`${styles.dictateBtn} ${isDictating ? styles.dictateBtnActive : ''}`}
            onClick={isDictating ? stopDictation : startDictation}
            type="button"
          >
            🎙️ {isDictating ? 'Stop Dictation' : 'Dictate Notes'}
          </button>
        )}
      </div>

      <div className={styles.checkboxGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={customerMentioned}
            onChange={e => onCustomerMentionedChange(e.target.checked)}
          />
          <span>Customer mentioned this issue</span>
        </label>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={isHighPriority}
            onChange={e => onHighPriorityChange(e.target.checked)}
          />
          <span>High priority</span>
        </label>
      </div>
    </div>
  );
}

function StepNewCustomer({
  form,
  onChange,
  error,
}: {
  form: NewCustomerForm;
  onChange: (form: NewCustomerForm) => void;
  error: string | null;
}) {
  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>New Customer</h2>
      <p className={styles.stepDesc}>Enter the customer&apos;s details</p>

      <div className={styles.newCustomerRow}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>First Name</label>
          <input
            className={styles.fieldInput}
            value={form.firstName}
            onChange={e => onChange({ ...form, firstName: e.target.value })}
            placeholder="First name"
            autoCapitalize="words"
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Last Name</label>
          <input
            className={styles.fieldInput}
            value={form.lastName}
            onChange={e => onChange({ ...form, lastName: e.target.value })}
            placeholder="Last name"
            autoCapitalize="words"
          />
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Phone <span className={styles.fieldRequired}>*</span></label>
        <input
          className={styles.fieldInput}
          type="tel"
          value={form.phone}
          onChange={e => onChange({ ...form, phone: e.target.value })}
          placeholder="Phone number"
          required
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Email</label>
        <input
          className={styles.fieldInput}
          type="email"
          value={form.email}
          onChange={e => onChange({ ...form, email: e.target.value })}
          placeholder="Email address"
          autoCapitalize="none"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Service Address</label>
        <AddressAutocomplete
          value={form.addressInput}
          onChange={val => onChange({ ...form, addressInput: val, addressComponents: null })}
          onAddressSelect={components => onChange({ ...form, addressComponents: components, addressInput: `${components.street_number ? components.street_number + ' ' : ''}${components.route ?? ''}`.trim() || form.addressInput })}
          placeholder="Start typing address…"
        />
        {form.addressComponents && (
          <p className={styles.fieldHint}>
            {[
              form.addressComponents.locality,
              form.addressComponents.administrative_area_level_1,
              form.addressComponents.postal_code,
            ]
              .filter(Boolean)
              .join(', ')}
          </p>
        )}
      </div>

      {error && <p className={styles.errorState}>{error}</p>}
    </div>
  );
}

function StepServiceDetails({
  companyId,
  locationId,
  suggestedPestType,
  matchedPestOption,
  selectedPestValue,
  selectedPlan,
  onPlanSelect,
}: {
  companyId: string;
  locationId: string | null;
  suggestedPestType: string | null;
  matchedPestOption: string | null;
  selectedPestValue: string;
  selectedPlan: ServicePlan | null;
  onPlanSelect: (plan: ServicePlan) => void;
}) {
  const [orders, setOrders] = useState<any[]>([]);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Plan selection state
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [recommendedId, setRecommendedId] = useState<string | null>(null);

  useEffect(() => {
    if (!locationId) {
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const res = await fetch(
          `/api/pestpac/locations/${encodeURIComponent(locationId)}/services?companyId=${companyId}`
        );
        const data = await res.json();
        setOrders(data.orders ?? []);
        setServiceTypes(data.serviceTypes ?? []);
        if (data.error) setFetchError(data.error);
      } catch {
        setFetchError('Failed to load service details');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [locationId, companyId]);

  // Fetch company service plans
  useEffect(() => {
    if (!companyId) return;
    const fetchPlans = async () => {
      setPlansLoading(true);
      try {
        let data: any;
        if (selectedPestValue && selectedPestValue !== OTHER_PEST_OPTION_VALUE) {
          const res = await fetch(`/api/service-plans/${companyId}/by-pest/${selectedPestValue}`);
          data = await res.json();
          if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            const recId = data.cheapest_plan?.id ?? null;
            setRecommendedId(recId);
            // Recommended plan first, rest follow
            const sorted = recId
              ? [data.data.find((p: ServicePlan) => p.id === recId)!, ...data.data.filter((p: ServicePlan) => p.id !== recId)]
              : data.data;
            setPlans(sorted);
            return;
          }
        }
        const res = await fetch(`/api/service-plans/${companyId}`);
        data = await res.json();
        if (data.success && Array.isArray(data.plans)) {
          const byPrice = [...data.plans].sort((a: ServicePlan, b: ServicePlan) =>
            (a.recurring_price ?? 9999) - (b.recurring_price ?? 9999)
          );
          const recId = byPrice[0]?.id ?? null;
          setRecommendedId(recId);
          // Recommended first, then rest in display_order
          const remaining = byPrice.slice(1);
          setPlans(recId ? [byPrice[0], ...remaining] : byPrice);
        }
      } catch {
        // Plans unavailable — non-fatal
      } finally {
        setPlansLoading(false);
      }
    };
    fetchPlans();
  }, [companyId, selectedPestValue]);

  const activeOrders = orders.filter(o => {
    const status = (o?.Status ?? o?.status ?? '').toLowerCase();
    return status === 'active' || status === 'scheduled' || status === 'open';
  });

  const historyOrders = orders.filter(o => {
    const status = (o?.Status ?? o?.status ?? '').toLowerCase();
    return status === 'completed' || status === 'closed' || status === 'cancelled';
  });

  const pestKeywords = [suggestedPestType, matchedPestOption]
    .filter(Boolean)
    .map(s => s!.toLowerCase());

  const isRelevantServiceType = (name: string) => {
    if (!pestKeywords.length) return false;
    const lower = name.toLowerCase();
    return pestKeywords.some(kw => lower.includes(kw) || kw.includes(lower));
  };

  const formatDate = (val: string | null | undefined) => {
    if (!val) return '—';
    try {
      return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return val;
    }
  };

  const formatCurrency = (val: number | null | undefined) => {
    if (val == null) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  if (!locationId) {
    return (
      <div className={styles.stepContent}>
        <h2 className={styles.stepTitle}>Service Details</h2>
        <p className={styles.emptyState}>No PestPac account linked to this customer.</p>
      </div>
    );
  }

  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>Service Details</h2>
      <p className={styles.stepDesc}>Current services and upsell opportunities from PestPac</p>

      {isLoading && (
        <div className={styles.loadingState}>
          <span className={styles.spinnerDark} />
          Loading service details…
        </div>
      )}

      {!isLoading && fetchError && orders.length === 0 && serviceTypes.length === 0 && (
        <p className={styles.serviceUnavailable}>
          Service history is not available for this customer&apos;s PestPac account. You can still proceed to submit the lead.
        </p>
      )}

      {!isLoading && (
        <>
          {/* Current Services */}
          <div className={styles.serviceSection}>
            <p className={styles.serviceSectionTitle}>Current Services</p>
            {activeOrders.length === 0 ? (
              <p className={styles.serviceEmpty}>No active services found</p>
            ) : (
              <div className={styles.serviceList}>
                {activeOrders.map((o, i) => (
                  <div key={o?.OrderID ?? i} className={styles.serviceRow}>
                    <div className={styles.serviceRowMain}>
                      <span className={styles.serviceRowName}>
                        {o?.ServiceTypeName ?? o?.serviceTypeName ?? 'Service'}
                      </span>
                      {(o?.BillingFrequency ?? o?.billingFrequency) && (
                        <span className={styles.serviceRowBadge}>
                          {o?.BillingFrequency ?? o?.billingFrequency}
                        </span>
                      )}
                    </div>
                    <div className={styles.serviceRowMeta}>
                      {(o?.Price ?? o?.price) != null && (
                        <span>{formatCurrency(o?.Price ?? o?.price)}</span>
                      )}
                      {(o?.NextServiceDate ?? o?.nextServiceDate) && (
                        <span>Next: {formatDate(o?.NextServiceDate ?? o?.nextServiceDate)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Service History */}
          {historyOrders.length > 0 && (
            <div className={styles.serviceSection}>
              <p className={styles.serviceSectionTitle}>Service History</p>
              <div className={styles.serviceList}>
                {historyOrders.slice(0, 5).map((o, i) => (
                  <div key={o?.OrderID ?? i} className={styles.serviceRow}>
                    <div className={styles.serviceRowMain}>
                      <span className={styles.serviceRowName}>
                        {o?.ServiceTypeName ?? o?.serviceTypeName ?? 'Service'}
                      </span>
                      <span className={styles.serviceRowStatus}>
                        {o?.Status ?? o?.status ?? ''}
                      </span>
                    </div>
                    <div className={styles.serviceRowMeta}>
                      <span>{formatDate(o?.OrderDate ?? o?.orderDate)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Service Types */}
          {serviceTypes.length > 0 && (
            <div className={styles.serviceSection}>
              <p className={styles.serviceSectionTitle}>Available Services</p>
              {pestKeywords.length > 0 && (
                <p className={styles.serviceHint}>
                  Highlighted services may match the detected pest issue
                </p>
              )}
              <div className={styles.serviceList}>
                {serviceTypes
                  .filter(st => st?.Active !== false)
                  .map((st, i) => {
                    const name = st?.ServiceTypeName ?? st?.serviceTypeName ?? st?.Name ?? st?.name ?? '';
                    const relevant = isRelevantServiceType(name);
                    return (
                      <div
                        key={st?.ServiceTypeID ?? i}
                        className={`${styles.serviceRow} ${relevant ? styles.serviceRowHighlighted : ''}`}
                      >
                        <span className={styles.serviceRowName}>{name}</span>
                        {st?.Description ?? st?.description ? (
                          <span className={styles.serviceRowDesc}>
                            {st?.Description ?? st?.description}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Service Plan Selection */}
      <div className={styles.serviceSection}>
        <p className={styles.serviceSectionTitle}>Select a Service Plan</p>
        {suggestedPestType && (
          <p className={styles.serviceHint}>AI detected: <strong>{suggestedPestType}</strong></p>
        )}
        {plansLoading ? (
          <div className={styles.loadingState}>
            <span className={styles.spinnerDark} />
            Loading plans…
          </div>
        ) : plans.length === 0 ? (
          <p className={styles.serviceEmpty}>No active service plans found.</p>
        ) : (
          <div className={styles.planCardList}>
            {plans.map(plan => {
              const isSelected = selectedPlan?.id === plan.id;
              const isRecommended = plan.id === recommendedId;
              const features: string[] = Array.isArray(plan.plan_features) ? plan.plan_features : [];
              return (
                <button
                  key={plan.id}
                  className={`${styles.planCard} ${isSelected ? styles.planCardSelected : ''}`}
                  onClick={() => onPlanSelect(plan)}
                  type="button"
                >
                  <div className={styles.planCardHeader}>
                    <div className={styles.planCardNameRow}>
                      <span className={styles.planCardName}>{plan.plan_name}</span>

                      {isRecommended && (
                        <span className={styles.planCardBadge}>
                          {plan.highlight_badge || 'Recommended'}
                        </span>
                      )}
                    </div>
                    <div className={styles.planCardPrice}>
                      {plan.recurring_price != null ? (
                        <div className={styles.planCardPriceRow}>
                          <span className={styles.planCardPriceAmount}>{formatPrice(plan.recurring_price)}</span>
                          <span className={styles.planCardPriceFreq}>{formatFrequency(plan.billing_frequency)}</span>
                        </div>
                      ) : (
                        <span className={styles.planCardPriceAmount}>Contact for pricing</span>
                      )}
                      {plan.initial_price != null && plan.initial_price > 0 && (
                        <span className={styles.planCardInitial}>+ {formatPrice(plan.initial_price)} initial</span>
                      )}
                    </div>
                  </div>
                  {plan.plan_description && (
                    <p className={styles.planCardDesc}>{plan.plan_description}</p>
                  )}
                  {features.length > 0 && (
                    <ul className={styles.planCardFeatures}>
                      {features.map((f, i) => (
                        <li key={i} className={styles.planCardFeatureItem}>
                          <span className={styles.planCardFeatureCheck}>✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StepSelectSite({
  companyId,
  selectedCustomer,
  onSelectCustomer,
  isPestPacEnabled,
  selectedPestPacClient,
  onSelectPestPacClient,
  recentCustomers,
}: {
  companyId: string;
  selectedCustomer: CustomerResult | null;
  onSelectCustomer: (customer: CustomerResult) => void;
  isPestPacEnabled: boolean;
  selectedPestPacClient: PestPacClientResult | null;
  onSelectPestPacClient: (client: PestPacClientResult) => void;
  recentCustomers: RecentCustomer[];
}) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CustomerResult[]>([]);
  const [pestPacResults, setPestPacResults] = useState<PestPacClientResult[]>([]);
  const [pestPacSearchError, setPestPacSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [nearbyResults, setNearbyResults] = useState<PestPacClientResult[]>([]);
  const [nearbyStreet, setNearbyStreet] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const cachedStreet = useRef<string | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On mount: geolocate → reverse geocode → search PestPac by street name
  // Re-runs when isPestPacEnabled resolves (settings fetch in parent may lag behind mount)
  useEffect(() => {
    if (!isPestPacEnabled) return;

    setIsLocating(true);

    const runSearch = async (street: string) => {
      try {
        const searchRes = await fetch(
          `/api/pestpac/clients/search?q=${encodeURIComponent(street)}&companyId=${companyId}`
        );
        if (searchRes.ok) {
          const data = await searchRes.json();
          setNearbyResults(data.clients ?? []);
          setNearbyStreet(street);
        }
      } catch {
        // Silently fall back to recents
      } finally {
        setIsLocating(false);
      }
    };

    // If we already reverse-geocoded, skip straight to PestPac search
    if (cachedStreet.current) {
      runSearch(cachedStreet.current);
      return;
    }

    if (!navigator.geolocation) {
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (!geoRes.ok) { setIsLocating(false); return; }
          const geoData = await geoRes.json();
          const street = geoData?.address?.road;
          if (!street) { setIsLocating(false); return; }
          cachedStreet.current = street;
          await runSearch(street);
        } catch {
          setIsLocating(false);
        }
      },
      () => setIsLocating(false),
      { timeout: 8000, maximumAge: 0, enableHighAccuracy: false }
    );
  }, [companyId, isPestPacEnabled]);

  const doSearch = useCallback(
    async (q: string) => {
      if (!q.trim() || q.length < 2) {
        setSearchResults([]);
        setPestPacResults([]);
        setPestPacSearchError(null);
        return;
      }
      setIsSearching(true);
      setPestPacSearchError(null);
      try {
        if (isPestPacEnabled) {
          const res = await fetch(
            `/api/pestpac/clients/search?q=${encodeURIComponent(q)}&companyId=${companyId}`
          );
          if (res.ok) {
            const data = await res.json();
            setPestPacResults(data.clients ?? []);
          } else {
            const data = await res.json().catch(() => ({}));
            setPestPacSearchError(data.error ?? 'PestPac search failed. Check your integration settings.');
            setPestPacResults([]);
          }
        } else {
          const res = await fetch(
            `/api/customers/search?q=${encodeURIComponent(q)}&companyId=${companyId}`
          );
          if (res.ok) {
            const data = await res.json();
            setSearchResults(data.customers ?? []);
          }
        }
      } finally {
        setIsSearching(false);
      }
    },
    [companyId, isPestPacEnabled]
  );

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => doSearch(query), 400);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [query, doSearch]);

  const isSearchActive = query.length >= 2;

  const renderPestPacCard = (client: PestPacClientResult) => {
    const isSelected = selectedPestPacClient?.clientId === client.clientId;
    const nameParts = [client.firstName, client.lastName].filter(Boolean);
    const displayName = nameParts.length > 0 ? nameParts.join(' ') : `Client #${client.clientId}`;
    return (
      <button
        key={client.clientId}
        className={`${styles.customerCard} ${isSelected ? styles.customerCardSelected : ''}`}
        onClick={() => onSelectPestPacClient(client)}
      >
        <div className={styles.customerCardName}>{displayName}</div>
        {client.primaryAddress && (
          <div className={styles.customerCardAddr}>
            {client.primaryAddress.street}, {client.primaryAddress.city}, {client.primaryAddress.state} {client.primaryAddress.zip}
          </div>
        )}
        <div className={styles.customerCardContact}>
          {client.phone && <span>{client.phone}</span>}
          {client.email && <span>{client.email}</span>}
        </div>
      </button>
    );
  };

  const renderCustomerCard = (customer: CustomerResult) => {
    const addr = getPrimaryAddress(customer);
    const isSelected = selectedCustomer?.id === customer.id;
    return (
      <button
        key={customer.id}
        className={`${styles.customerCard} ${isSelected ? styles.customerCardSelected : ''}`}
        onClick={() => onSelectCustomer(customer)}
      >
        <div className={styles.customerCardName}>{getCustomerDisplayName(customer)}</div>
        {addr && (
          <div className={styles.customerCardAddr}>
            {addr.street_address}, {addr.city}, {addr.state} {addr.zip_code}
          </div>
        )}
        <div className={styles.customerCardContact}>
          {customer.phone && <span>{customer.phone}</span>}
          {customer.email && <span>{customer.email}</span>}
        </div>
      </button>
    );
  };

  const renderRecentCard = (recent: RecentCustomer) => {
    const isSelected = selectedCustomer?.id === recent.id;
    const nameParts = [recent.first_name, recent.last_name].filter(Boolean);
    const displayName = nameParts.length > 0 ? nameParts.join(' ') : recent.email ?? `Customer #${recent.id.slice(0, 8)}`;
    const asCustomer: CustomerResult = {
      id: recent.id,
      first_name: recent.first_name,
      last_name: recent.last_name,
      email: recent.email,
      phone: recent.phone,
      pestpac_client_id: recent.pestpac_client_id ?? null,
      primary_service_address: recent.primaryAddress
        ? [{ service_address: { id: recent.id, ...recent.primaryAddress } }]
        : undefined,
    };
    return (
      <button
        key={recent.id}
        className={`${styles.customerCard} ${isSelected ? styles.customerCardSelected : ''}`}
        onClick={() => onSelectCustomer(asCustomer)}
      >
        <div className={styles.customerCardName}>{displayName}</div>
        {recent.primaryAddress && (
          <div className={styles.customerCardAddr}>
            {recent.primaryAddress.street_address}, {recent.primaryAddress.city}, {recent.primaryAddress.state} {recent.primaryAddress.zip_code}
          </div>
        )}
        <div className={styles.customerCardContact}>
          {recent.phone && <span>{recent.phone}</span>}
          {recent.email && <span>{recent.email}</span>}
        </div>
      </button>
    );
  };

  // What to show when idle (no user query)
  const showNearby = !isLocating && nearbyResults.length > 0;
  const showRecents = !isLocating && !showNearby && recentCustomers.length > 0;
  const idleLabel = showNearby
    ? `Nearby Customers${nearbyStreet ? ` on ${nearbyStreet}` : ''}`
    : 'Recent Customers';

  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>Select Site</h2>
      <p className={styles.stepDesc}>
        {isPestPacEnabled ? 'Search PestPac or select a customer below' : 'Link this opportunity to a customer'}
      </p>

      <div className={styles.searchInputWrapper}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder={isPestPacEnabled ? 'Search by name, address, or phone…' : 'Search by name or address…'}
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {isSearching && <span className={styles.searchSpinner} />}
      </div>

      <div className={styles.customerList}>
        {/* Manual search results */}
        {isSearchActive && (
          <>
            <p className={styles.listLabel}>{isPestPacEnabled ? 'PestPac Results' : 'Search Results'}</p>
            {isSearching && (
              <div className={styles.loadingState}>
                <span className={styles.spinner} />
                {isPestPacEnabled ? 'Searching PestPac…' : 'Searching…'}
              </div>
            )}
            {!isSearching && isPestPacEnabled && pestPacSearchError && (
              <p className={styles.emptyState} style={{ color: 'var(--color-error, #dc2626)' }}>
                {pestPacSearchError}
              </p>
            )}
            {!isSearching && isPestPacEnabled && !pestPacSearchError && pestPacResults.map(renderPestPacCard)}
            {!isSearching && isPestPacEnabled && !pestPacSearchError && pestPacResults.length === 0 && (
              <p className={styles.emptyState}>No PestPac customers found for &quot;{query}&quot;</p>
            )}
            {!isSearching && !isPestPacEnabled && searchResults.map(renderCustomerCard)}
            {!isSearching && !isPestPacEnabled && searchResults.length === 0 && (
              <p className={styles.emptyState}>No customers found for &quot;{query}&quot;</p>
            )}
          </>
        )}

        {/* Idle state: nearby or recent */}
        {!isSearchActive && (
          <>
            {isLocating && (
              <div className={styles.loadingState}>
                <span className={styles.spinner} />
                Finding nearby customers…
              </div>
            )}
            {(showNearby || showRecents) && (
              <p className={styles.listLabel}>{idleLabel}</p>
            )}
            {showNearby && nearbyResults.map(renderPestPacCard)}
            {showRecents && recentCustomers.map(renderRecentCard)}
            {!isLocating && !showNearby && !showRecents && (
              <p className={styles.emptyState}>Search above to find a customer</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function formatPrice(price: number | null): string {
  if (price == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
    maximumFractionDigits: price % 1 === 0 ? 0 : 2,
  }).format(price);
}

function formatFrequency(freq: string | null): string {
  if (!freq) return '';
  const map: Record<string, string> = {
    monthly: '/mo',
    quarterly: '/qtr',
    'semi-annually': '/semi',
    'semi-annual': '/semi',
    annually: '/yr',
    annual: '/yr',
    'one-time': '',
    weekly: '/wk',
  };
  return map[freq.toLowerCase()] ?? `/${freq}`;
}

function StepServicePlanSelect({
  companyId,
  selectedPlan,
  onPlanSelect,
  suggestedPestType,
  selectedPestValue,
}: {
  companyId: string;
  selectedPlan: ServicePlan | null;
  onPlanSelect: (plan: ServicePlan) => void;
  suggestedPestType: string | null;
  selectedPestValue: string;
}) {
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendedId, setRecommendedId] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;

    const fetchPlans = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Use by-pest endpoint if we have a selected pest id (not 'other')
        let data: any;
        if (selectedPestValue && selectedPestValue !== OTHER_PEST_OPTION_VALUE) {
          const res = await fetch(`/api/service-plans/${companyId}/by-pest/${selectedPestValue}`);
          data = await res.json();
          if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            const recId = data.cheapest_plan?.id ?? null;
            setRecommendedId(recId);
            const sorted = recId
              ? [data.data.find((p: ServicePlan) => p.id === recId)!, ...data.data.filter((p: ServicePlan) => p.id !== recId)]
              : data.data;
            setPlans(sorted);
            return;
          }
        }
        // Fallback: all plans for the company
        const res = await fetch(`/api/service-plans/${companyId}`);
        data = await res.json();
        if (data.success && Array.isArray(data.plans)) {
          const byPrice = [...data.plans].sort((a: ServicePlan, b: ServicePlan) =>
            (a.recurring_price ?? 9999) - (b.recurring_price ?? 9999)
          );
          const recId = byPrice[0]?.id ?? null;
          setRecommendedId(recId);
          setPlans(recId ? [byPrice[0], ...byPrice.slice(1)] : byPrice);
        }
      } catch {
        setError('Unable to load service plans. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, [companyId, selectedPestValue]);

  if (isLoading) {
    return (
      <div className={styles.stepContent}>
        <h2 className={styles.stepTitle}>Select a Service Plan</h2>
        <div className={styles.loadingState}>
          <span className={styles.spinner} />
          Loading plans…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.stepContent}>
        <h2 className={styles.stepTitle}>Select a Service Plan</h2>
        <p className={styles.submitError}>{error}</p>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className={styles.stepContent}>
        <h2 className={styles.stepTitle}>Select a Service Plan</h2>
        <p className={styles.emptyState}>No active service plans found for your company.</p>
      </div>
    );
  }

  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>Select a Service Plan</h2>
      {suggestedPestType && (
        <p className={styles.stepDesc}>AI detected: <strong>{suggestedPestType}</strong></p>
      )}
      <div className={styles.planCardList}>
        {plans.map(plan => {
          const isSelected = selectedPlan?.id === plan.id;
          const isRecommended = plan.id === recommendedId;
          const features: string[] = Array.isArray(plan.plan_features) ? plan.plan_features : [];
          return (
            <button
              key={plan.id}
              className={`${styles.planCard} ${isSelected ? styles.planCardSelected : ''}`}
              onClick={() => onPlanSelect(plan)}
              type="button"
            >
              <div className={styles.planCardHeader}>
                <div className={styles.planCardNameRow}>
                  <span className={styles.planCardName}>{plan.plan_name}</span>

                  {isRecommended && (
                    <span className={styles.planCardBadge}>
                      {plan.highlight_badge || 'Recommended'}
                    </span>
                  )}
                </div>
                <div className={styles.planCardPrice}>
                  {plan.recurring_price != null ? (
                    <div className={styles.planCardPriceRow}>
                      <span className={styles.planCardPriceAmount}>
                        {formatPrice(plan.recurring_price)}
                      </span>
                      <span className={styles.planCardPriceFreq}>
                        {formatFrequency(plan.billing_frequency)}
                      </span>
                    </div>
                  ) : (
                    <span className={styles.planCardPriceAmount}>Contact for pricing</span>
                  )}
                  {plan.initial_price != null && plan.initial_price > 0 && (
                    <span className={styles.planCardInitial}>
                      + {formatPrice(plan.initial_price)} initial
                    </span>
                  )}
                </div>
              </div>
              {plan.plan_description && (
                <p className={styles.planCardDesc}>{plan.plan_description}</p>
              )}
              {features.length > 0 && (
                <ul className={styles.planCardFeatures}>
                  {features.map((f, i) => (
                    <li key={i} className={styles.planCardFeatureItem}>
                      <span className={styles.planCardFeatureCheck}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepServiceTodayConfirm({
  selectedPlan,
  selectedCustomer,
  techName,
  onSignatureChange,
}: {
  selectedPlan: ServicePlan | null;
  selectedCustomer: CustomerResult | null;
  techName: string;
  onSignatureChange: (data: string | null) => void;
}) {
  const signatureRef = useRef<SignatureCanvas>(null);
  const addr = selectedCustomer ? getPrimaryAddress(selectedCustomer) : null;
  const features: string[] = Array.isArray(selectedPlan?.plan_features) ? selectedPlan!.plan_features! : [];

  const handleSignEnd = () => {
    if (signatureRef.current) {
      const isEmpty = signatureRef.current.isEmpty();
      onSignatureChange(isEmpty ? null : signatureRef.current.toDataURL());
    }
  };

  const handleClearSignature = () => {
    signatureRef.current?.clear();
    onSignatureChange(null);
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>Service Today — Confirm</h2>
      <p className={styles.stepDesc}>Review details and sign below to complete</p>

      {/* Customer Info */}
      <div className={styles.confirmSection}>
        <h3 className={styles.confirmSectionTitle}>Customer</h3>
        {selectedCustomer ? (
          <>
            <p className={styles.confirmValue}>{getCustomerDisplayName(selectedCustomer)}</p>
            {addr && (
              <p className={styles.confirmValueMuted}>
                {addr.street_address}, {addr.city}, {addr.state} {addr.zip_code}
              </p>
            )}
            {selectedCustomer.phone && <p className={styles.confirmValueMuted}>{selectedCustomer.phone}</p>}
            {selectedCustomer.email && <p className={styles.confirmValueMuted}>{selectedCustomer.email}</p>}
          </>
        ) : (
          <p className={styles.confirmValueMuted}>No customer selected</p>
        )}
      </div>

      {/* Service Date */}
      <div className={styles.confirmSection}>
        <h3 className={styles.confirmSectionTitle}>Service Date</h3>
        <p className={styles.confirmValue}>{today}</p>
        <p className={styles.confirmValueMuted}>Serviced by {techName || 'technician'}</p>
      </div>

      {/* Selected Plan */}
      {selectedPlan ? (
        <div className={styles.confirmSection}>
          <h3 className={styles.confirmSectionTitle}>Service Plan</h3>
          <p className={styles.confirmValue}>{selectedPlan.plan_name}</p>
          {selectedPlan.recurring_price != null && (
            <p className={styles.reviewPlanPrice}>
              {formatPrice(selectedPlan.recurring_price)}{formatFrequency(selectedPlan.billing_frequency)}
              {selectedPlan.initial_price != null && selectedPlan.initial_price > 0
                ? ` + ${formatPrice(selectedPlan.initial_price)} initial`
                : ''}
            </p>
          )}
          {selectedPlan.plan_description && (
            <p className={styles.confirmValueMuted}>{selectedPlan.plan_description}</p>
          )}
          {features.length > 0 && (
            <ul className={styles.confirmFeatureList}>
              {features.map((f, i) => (
                <li key={i} className={styles.confirmFeatureItem}>
                  <span className={styles.confirmFeatureCheck}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className={styles.confirmSection}>
          <h3 className={styles.confirmSectionTitle}>Service Plan</h3>
          <p className={styles.confirmValueMuted}>No plan selected</p>
        </div>
      )}

      {/* Terms & Disclaimer */}
      {(selectedPlan?.plan_terms || selectedPlan?.plan_disclaimer) && (
        <div className={styles.confirmSection}>
          <h3 className={styles.confirmSectionTitle}>Terms & Agreement</h3>
          {selectedPlan.plan_terms && (
            <div
              className={styles.confirmTerms}
              dangerouslySetInnerHTML={{ __html: selectedPlan.plan_terms }}
            />
          )}
          {selectedPlan.plan_disclaimer && (
            <div
              className={styles.confirmDisclaimer}
              dangerouslySetInnerHTML={{ __html: selectedPlan.plan_disclaimer }}
            />
          )}
        </div>
      )}

      {/* Signature */}
      <div className={styles.confirmSection}>
        <h3 className={styles.confirmSectionTitle}>Customer Signature</h3>
        <p className={styles.confirmValueMuted}>Please sign below to acknowledge service completed today</p>
        <div className={styles.signatureWrapper}>
          <SignatureCanvas
            ref={signatureRef}
            penColor="#000"
            canvasProps={{
              className: styles.signatureCanvas,
              width: 500,
              height: 150,
            }}
            onEnd={handleSignEnd}
          />
        </div>
        <button
          type="button"
          className={styles.signatureClearBtn}
          onClick={handleClearSignature}
        >
          Clear Signature
        </button>
      </div>
    </div>
  );
}

function StepReview({
  leadType,
  newLeadPathMode,
  mapPlotData,
  photos,
  aiResult,
  notes,
  customerMentioned,
  isHighPriority,
  selectedPestLabel,
  otherPest,
  selectedCustomer,
  selectedPlan,
}: {
  leadType: LeadType;
  newLeadPathMode: NewLeadPathMode | null;
  mapPlotData: MapPlotData | null;
  photos: PhotoPreview[];
  aiResult: AIResult;
  notes: string;
  customerMentioned: boolean;
  isHighPriority: boolean;
  selectedPestLabel: string | null;
  otherPest: string;
  selectedCustomer: CustomerResult | null;
  selectedPlan: ServicePlan | null;
}) {
  const addr = selectedCustomer ? getPrimaryAddress(selectedCustomer) : null;
  const trimmedOtherPest = otherPest.trim();
  const mapSummaryLines = getMapPlotSummaryLines(mapPlotData);

  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>Review</h2>
      <p className={styles.stepDesc}>Confirm before submitting</p>

      <div className={styles.reviewSection}>
        <h3 className={styles.reviewSectionTitle}>Customer & Site</h3>
        {selectedCustomer ? (
          <>
            <p className={styles.reviewValue}>{getCustomerDisplayName(selectedCustomer)}</p>
            {addr && (
              <p className={styles.reviewValueMuted}>
                {addr.street_address}, {addr.city}, {addr.state} {addr.zip_code}
              </p>
            )}
          </>
        ) : (
          <p className={styles.reviewValueMuted}>No customer selected</p>
        )}
      </div>

      <div className={styles.reviewSection}>
        <h3 className={styles.reviewSectionTitle}>Opportunity Type</h3>
        <p className={styles.reviewValue}>
          {leadType === 'new-lead' ? 'New Lead' : 'Upsell Opportunity'}
        </p>
      </div>

      {leadType === 'new-lead' && (
        <div className={styles.reviewSection}>
          <h3 className={styles.reviewSectionTitle}>Map &amp; Plot</h3>
          {newLeadPathMode === 'map-plot' && mapSummaryLines.length > 0 ? (
            <div className={styles.reviewMapSummary}>
              {mapSummaryLines.map(line => (
                <p key={line} className={styles.reviewRow}>{line}</p>
              ))}
            </div>
          ) : (
            <p className={styles.reviewValueMuted}>Skipped for this lead.</p>
          )}
        </div>
      )}

      <div className={styles.reviewSection}>
        <h3 className={styles.reviewSectionTitle}>Photos</h3>
        <p className={styles.reviewValue}>{photos.length} photo{photos.length !== 1 ? 's' : ''} attached</p>
        {photos.length > 0 && (
          <div className={styles.reviewPhotoRow}>
            {photos.map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={p.dataUrl} alt={`Photo ${i + 1}`} className={styles.reviewThumb} />
            ))}
          </div>
        )}
      </div>

      <div className={styles.reviewSection}>
        <h3 className={styles.reviewSectionTitle}>AI Findings</h3>
        {aiResult.issue_detected && (
          <p className={styles.reviewRow}><strong>Issue:</strong> {aiResult.issue_detected}</p>
        )}
        {selectedPestLabel && (
          <p className={styles.reviewRow}><strong>Primary Pest:</strong> {selectedPestLabel}</p>
        )}
        {!selectedPestLabel && trimmedOtherPest && (
          <p className={styles.reviewRow}><strong>Primary Pest:</strong> Other ({trimmedOtherPest})</p>
        )}
        {aiResult.service_category && (
          <p className={styles.reviewRow}><strong>Category:</strong> {aiResult.service_category}</p>
        )}
        {aiResult.ai_summary && (
          <p className={styles.reviewRow}><strong>Summary:</strong> {aiResult.ai_summary}</p>
        )}
        {aiResult.severity && (
          <p className={styles.reviewRow}><strong>Severity:</strong> {aiResult.severity}</p>
        )}
      </div>

      {selectedPlan && (
        <div className={styles.reviewSection}>
          <h3 className={styles.reviewSectionTitle}>Selected Plan</h3>
          <p className={styles.reviewValue}>{selectedPlan.plan_name}</p>
          {selectedPlan.recurring_price != null && (
            <p className={styles.reviewPlanPrice}>
              {formatPrice(selectedPlan.recurring_price)}{formatFrequency(selectedPlan.billing_frequency)}
              {selectedPlan.initial_price != null && selectedPlan.initial_price > 0
                ? ` + ${formatPrice(selectedPlan.initial_price)} initial`
                : ''}
            </p>
          )}
        </div>
      )}

      <div className={styles.reviewSection}>
        <h3 className={styles.reviewSectionTitle}>Notes & Flags</h3>
        {notes ? (
          <p className={styles.reviewValue}>{notes}</p>
        ) : (
          <p className={styles.reviewValueMuted}>No notes added</p>
        )}
        <div className={styles.flagRow}>
          {customerMentioned && <span className={styles.flag}>Customer mentioned</span>}
          {isHighPriority && <span className={`${styles.flag} ${styles.flagHigh}`}>High priority</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export function NewOpportunityWizard() {
  const router = useRouter();
  const { selectedCompany } = useCompany();
  const { setWizardTitle, setBackInterceptor } = useWizard();

  const wizardContainerRef = useRef<HTMLDivElement>(null);
  const [stepIndex, setStepIndex] = useState(0);

  // Scroll to top of wizard on every step change
  useEffect(() => {
    wizardContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [stepIndex]);

  // Sync lead type label into global header; clear on unmount
  useEffect(() => {
    return () => { setWizardTitle(null); };
  }, [setWizardTitle]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [submitMode, setSubmitMode] = useState<'default' | 'schedule' | 'service-today'>('default');
  const [showExitPrompt, setShowExitPrompt] = useState(false);

  // Register a back interceptor when the wizard has progress; clear it when at step 0 or done
  useEffect(() => {
    if (stepIndex > 0 && !isDone) {
      setBackInterceptor(() => setShowExitPrompt(true));
    } else {
      setBackInterceptor(null);
    }
    return () => { setBackInterceptor(null); };
  }, [stepIndex, isDone, setBackInterceptor]);
  const [isSyncingCustomer, setIsSyncingCustomer] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // PestPac integration state
  const [isPestPacEnabled, setIsPestPacEnabled] = useState(false);
  const [selectedPestPacClient, setSelectedPestPacClient] = useState<PestPacClientResult | null>(null);

  // Current user display name (for "Service Today" note)
  const [techName, setTechName] = useState('');

  // Wizard state
  const [leadType, setLeadType] = useState<LeadType>('new-lead');
  const [newLeadPathMode, setNewLeadPathMode] = useState<NewLeadPathMode | null>(null);
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [aiResult, setAIResult] = useState<AIResult>({
    issue_detected: '',
    service_category: '',
    ai_summary: '',
    suggested_pest_type: null,
    matched_pest_option: null,
    severity: null,
  });
  const [notes, setNotes] = useState('');
  const [customerMentioned, setCustomerMentioned] = useState(false);
  const [isHighPriority, setIsHighPriority] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResult | null>(null);
  const [pestOptions, setPestOptions] = useState<PestOption[]>([]);
  const [isPestOptionsLoading, setIsPestOptionsLoading] = useState(false);
  const [selectedPestValue, setSelectedPestValue] = useState('');
  const [otherPest, setOtherPest] = useState('');
  const [hasManualPestSelection, setHasManualPestSelection] = useState(false);
  const [mapPlotData, setMapPlotData] = useState<MapPlotData>(DEFAULT_MAP_PLOT_DATA);

  // Service plan selection
  const [selectedServicePlan, setSelectedServicePlan] = useState<ServicePlan | null>(null);

  // Signature data for service-today confirmation
  const [signatureData, setSignatureData] = useState<string | null>(null);

  // New customer form state
  const [newCustomerForm, setNewCustomerForm] = useState<NewCustomerForm>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    addressInput: '',
    addressComponents: null,
  });
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [createCustomerError, setCreateCustomerError] = useState<string | null>(null);

  // Draft persistence
  const [draftRestored, setDraftRestored] = useState(false);

  const companyId = selectedCompany?.id ?? '';
  const selectedPestOption = pestOptions.find(option => option.id === selectedPestValue) ?? null;

  const { recentCustomers, addRecent } = useRecentTechLeadCustomers(companyId);

  // Computed wizard steps based on lead type and PestPac availability
  const wizardSteps = useMemo((): StepId[] => {
    if (leadType === 'new-lead') {
      const steps: StepId[] = ['type-select', 'new-lead-path'];
      if (newLeadPathMode === 'map-plot') {
        steps.push('map-address', 'map-plot');
      }
      steps.push('photos', 'ai-review', 'new-customer', 'review');
      return steps;
    }
    if (isPestPacEnabled) {
      return ['type-select', 'photos', 'ai-review', 'select-site', 'service-details', 'review', 'service-today-confirm'];
    }
    return ['type-select', 'photos', 'ai-review', 'select-site', 'service-plan-select', 'review', 'service-today-confirm'];
  }, [leadType, newLeadPathMode, isPestPacEnabled]);

  const currentStepId = wizardSteps[stepIndex];
  const draftKey = companyId ? `techleads_draft_${companyId}` : null;

  useEffect(() => {
    if (stepIndex <= wizardSteps.length - 1) return;
    setStepIndex(Math.max(0, wizardSteps.length - 1));
  }, [stepIndex, wizardSteps]);

  // Restore draft from localStorage when companyId becomes available
  useEffect(() => {
    if (!draftKey || stepIndex > 0) return;
    try {
      const saved = localStorage.getItem(draftKey);
      if (!saved) return;
      const d = JSON.parse(saved);
      if (d.leadType) {
        setLeadType(d.leadType);
        setWizardTitle(d.leadType === 'new-lead' ? 'New Lead' : 'Upsell Opportunity');
      }
      if (d.newLeadPathMode) setNewLeadPathMode(d.newLeadPathMode);
      if (d.aiResult) setAIResult(d.aiResult);
      if (d.notes) setNotes(d.notes);
      if (d.customerMentioned) setCustomerMentioned(d.customerMentioned);
      if (d.isHighPriority) setIsHighPriority(d.isHighPriority);
      if (d.selectedPestValue) setSelectedPestValue(d.selectedPestValue);
      if (d.otherPest) setOtherPest(d.otherPest);
      if (d.hasManualPestSelection) setHasManualPestSelection(d.hasManualPestSelection);
      if (d.selectedCustomer) setSelectedCustomer(d.selectedCustomer);
      if (d.selectedPestPacClient) setSelectedPestPacClient(d.selectedPestPacClient);
      if (d.selectedServicePlan) setSelectedServicePlan(d.selectedServicePlan);
      if (d.mapPlotData) {
        const restoredMapPlot = d.mapPlotData as Partial<MapPlotData> & {
          stamps?: Array<Partial<MapPlotStamp>>;
          outlines?: Array<Partial<MapElementOutline>>;
          outlinePoints?: Array<Partial<MapOutlinePoint>>;
          isClosed?: boolean;
          activeOutlineId?: string | null;
        };

        const restoredStampType = normalizeMapStampType(restoredMapPlot.selectedStampType) ?? DEFAULT_MAP_PLOT_DATA.selectedStampType;
        const restoredPestType = isMapPestStampType(restoredMapPlot.selectedPestType)
          ? restoredMapPlot.selectedPestType
          : isMapPestStampType(restoredStampType)
          ? restoredStampType
          : DEFAULT_PEST_STAMP_TYPE;
        const restoredObjectType = isMapObjectStampType(restoredMapPlot.selectedObjectType)
          ? restoredMapPlot.selectedObjectType
          : isMapObjectStampType(restoredStampType)
          ? restoredStampType
          : DEFAULT_OBJECT_STAMP_TYPE;
        const restoredElementType = isMapElementStampType(restoredMapPlot.selectedElementType)
          ? restoredMapPlot.selectedElementType
          : isMapElementStampType(restoredStampType)
          ? restoredStampType
          : DEFAULT_ELEMENT_STAMP_TYPE;
        const normalizedOutlines: MapElementOutline[] = Array.isArray(restoredMapPlot.outlines)
          ? restoredMapPlot.outlines
              .map(outline => {
                const rawType = isMapElementStampType(outline.type)
                  ? outline.type
                  : restoredElementType;
                const rawPoints = Array.isArray(outline.points) ? outline.points : [];
                const points = rawPoints
                  .map(point => {
                    const lat = Number(point.lat);
                    const lng = Number(point.lng);
                    return {
                      x: clampNormalized(Number(point.x)),
                      y: clampNormalized(Number(point.y)),
                      ...(Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : {}),
                    };
                  })
                  .filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));

                if (points.length === 0) return null;

                return {
                  id: typeof outline.id === 'string' ? outline.id : crypto.randomUUID(),
                  type: rawType,
                  points,
                  isClosed: outline.isClosed === true,
                } satisfies MapElementOutline;
              })
              .filter((outline): outline is MapElementOutline => outline !== null)
          : Array.isArray(restoredMapPlot.outlinePoints) && restoredMapPlot.outlinePoints.length > 0
          ? [{
              id: crypto.randomUUID(),
              type: restoredElementType,
              points: restoredMapPlot.outlinePoints
                .map(point => {
                  const lat = Number(point.lat);
                  const lng = Number(point.lng);
                  return {
                    x: clampNormalized(Number(point.x)),
                    y: clampNormalized(Number(point.y)),
                    ...(Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : {}),
                  };
                })
                .filter(point => Number.isFinite(point.x) && Number.isFinite(point.y)),
              isClosed: restoredMapPlot.isClosed === true,
            }]
          : [];
        const restoredActiveOutlineId =
          typeof restoredMapPlot.activeOutlineId === 'string' &&
          normalizedOutlines.some(outline => outline.id === restoredMapPlot.activeOutlineId)
            ? restoredMapPlot.activeOutlineId
            : null;

        setMapPlotData({
          ...DEFAULT_MAP_PLOT_DATA,
          ...restoredMapPlot,
          addressComponents: restoredMapPlot.addressComponents ?? null,
          centerLat: typeof restoredMapPlot.centerLat === 'number' ? restoredMapPlot.centerLat : null,
          centerLng: typeof restoredMapPlot.centerLng === 'number' ? restoredMapPlot.centerLng : null,
          zoom: typeof restoredMapPlot.zoom === 'number'
            ? Math.max(MAP_MIN_ZOOM, restoredMapPlot.zoom)
            : DEFAULT_MAP_PLOT_DATA.zoom,
          heading: typeof restoredMapPlot.heading === 'number' ? restoredMapPlot.heading : DEFAULT_MAP_PLOT_DATA.heading,
          tilt: typeof restoredMapPlot.tilt === 'number' ? restoredMapPlot.tilt : DEFAULT_MAP_PLOT_DATA.tilt,
          isViewSet: restoredMapPlot.isViewSet === true,
          drawTool: restoredMapPlot.drawTool === 'outline' ? 'outline' : 'stamp',
          backgroundMode: restoredMapPlot.backgroundMode === 'blank-grid' ? 'blank-grid' : 'satellite',
          selectedStampType: restoredStampType,
          selectedPestType: restoredPestType,
          selectedObjectType: restoredObjectType,
          selectedElementType: restoredElementType,
          stamps: Array.isArray(restoredMapPlot.stamps)
            ? restoredMapPlot.stamps
                .map(stamp => {
                  const lat = Number(stamp.lat);
                  const lng = Number(stamp.lng);
                  return {
                    id: typeof stamp.id === 'string' ? stamp.id : crypto.randomUUID(),
                    type: normalizeMapStampType(stamp.type) ?? restoredStampType,
                    x: clampNormalized(Number(stamp.x)),
                    y: clampNormalized(Number(stamp.y)),
                    ...(Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : {}),
                  };
                })
                .filter(stamp => Number.isFinite(stamp.x) && Number.isFinite(stamp.y))
            : [],
          outlines: normalizedOutlines,
          activeOutlineId: restoredActiveOutlineId,
        });
      }
      if (d.newCustomerForm) {
        setNewCustomerForm(prev => ({ ...prev, ...d.newCustomerForm, addressComponents: null }));
      }
      if (typeof d.stepIndex === 'number' && d.stepIndex > 0) {
        setStepIndex(d.stepIndex);
      }
      setDraftRestored(true);
    } catch {
      // Corrupt draft — ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  // Auto-save draft whenever key state changes (skip at step 0 — nothing to save yet)
  useEffect(() => {
    if (!draftKey || stepIndex === 0) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify({
        leadType, newLeadPathMode, stepIndex, aiResult, notes, customerMentioned, isHighPriority,
        selectedPestValue, otherPest, hasManualPestSelection,
        selectedCustomer, selectedPestPacClient, selectedServicePlan, mapPlotData,
        savedAt: new Date().toISOString(),
        newCustomerForm: {
          firstName: newCustomerForm.firstName,
          lastName: newCustomerForm.lastName,
          phone: newCustomerForm.phone,
          email: newCustomerForm.email,
          addressInput: newCustomerForm.addressInput,
        },
      }));
    } catch {
      // localStorage full or unavailable — silently skip
    }
  }, [
    draftKey, leadType, newLeadPathMode, stepIndex, aiResult, notes, customerMentioned, isHighPriority,
    selectedPestValue, otherPest, hasManualPestSelection,
    selectedCustomer, selectedPestPacClient, selectedServicePlan, mapPlotData, newCustomerForm,
  ]);

  const clearDraft = () => {
    if (draftKey) {
      try { localStorage.removeItem(draftKey); } catch {}
    }
    setDraftRestored(false);
  };

  // Fetch current user's display name for "Service Today" attribution note
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();
      if (profile) {
        const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
        if (name) setTechName(name);
      }
    });
  }, []);

  // Detect PestPac mode on mount
  useEffect(() => {
    if (!companyId) return;
    fetch(`/api/companies/${companyId}/settings`)
      .then(r => r.json())
      .then(data => {
        const enabled = data.settings?.pestpac_enabled?.value;
        setIsPestPacEnabled(enabled === true || enabled === 'true');
      })
      .catch(() => {
        // Failed to load settings — default to disabled
      });
  }, [companyId]);

  useEffect(() => {
    if (!companyId) {
      setPestOptions([]);
      setSelectedPestValue('');
      setOtherPest('');
      setHasManualPestSelection(false);
      return;
    }

    const loadPestOptions = async () => {
      setIsPestOptionsLoading(true);
      try {
        const res = await fetch(`/api/pest-types?companyId=${companyId}`);
        if (!res.ok) {
          setPestOptions([]);
          return;
        }

        const data = await res.json();
        const options: Array<{ id: string; name: string; slug: string }> = Array.isArray(data.pestTypes)
          ? data.pestTypes
          : [];
        setPestOptions(
          options.map(option => ({
            id: option.id,
            name: option.name,
            slug: option.slug,
          }))
        );
      } catch {
        setPestOptions([]);
      } finally {
        setIsPestOptionsLoading(false);
      }
    };

    loadPestOptions();
  }, [companyId]);

  useEffect(() => {
    if (newLeadPathMode !== 'map-plot') return;
    if (!mapPlotData.addressComponents) return;

    const street = `${mapPlotData.addressComponents.street_number ? `${mapPlotData.addressComponents.street_number} ` : ''}${mapPlotData.addressComponents.route ?? ''}`.trim();
    const fallbackAddress = street || mapPlotData.addressComponents.formatted_address || '';
    if (!fallbackAddress) return;

    setNewCustomerForm(prev => {
      if (prev.addressInput.trim()) return prev;
      return {
        ...prev,
        addressInput: fallbackAddress,
        addressComponents: mapPlotData.addressComponents,
      };
    });
  }, [newLeadPathMode, mapPlotData.addressComponents]);

  useEffect(() => {
    if (hasManualPestSelection || selectedPestValue || pestOptions.length === 0) return;

    const match = findBestPestMatch(aiResult, pestOptions);
    if (match) {
      setSelectedPestValue(match.id);
    }
  }, [aiResult, pestOptions, hasManualPestSelection, selectedPestValue]);

  const resetWizard = () => {
    clearDraft();
    setStepIndex(0);
    setLeadType('new-lead');
    setNewLeadPathMode(null);
    setWizardTitle(null);
    setPhotos([]);
    setAIResult({ issue_detected: '', service_category: '', ai_summary: '', suggested_pest_type: null, matched_pest_option: null, severity: null });
    setSelectedPestValue('');
    setOtherPest('');
    setHasManualPestSelection(false);
    setNotes('');
    setCustomerMentioned(false);
    setIsHighPriority(false);
    setMapPlotData({ ...DEFAULT_MAP_PLOT_DATA });
    setSelectedCustomer(null);
    setSelectedPestPacClient(null);
    setSelectedServicePlan(null);
    setSignatureData(null);
    setNewCustomerForm({ firstName: '', lastName: '', phone: '', email: '', addressInput: '', addressComponents: null });
    setCreateCustomerError(null);
    setSubmitError(null);
    setSyncError(null);
    setIsDone(false);
  };

  const handleAnalyze = async () => {
    if (!photos.length || !companyId) return;
    setIsAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await fetch('/api/ai/analyze-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          images: photos.map(p => ({ mimeType: p.mimeType, data: p.base64 })),
          notes,
          pestOptions: pestOptions.map(p => ({ id: p.id, name: p.name })),
        }),
      });
      if (!res.ok) throw new Error('Analysis failed');
      const data = await res.json();
      setAIResult(data);

      // Auto-select pest option: try exact name match first, then fuzzy fallback
      if (!hasManualPestSelection) {
        const exactMatch = data.matched_pest_option
          ? pestOptions.find(p => p.name.toLowerCase() === data.matched_pest_option!.toLowerCase())
          : null;
        const match = exactMatch ?? findBestPestMatch(data, pestOptions);
        if (match) setSelectedPestValue(match.id);
      }

      // Advance to ai-review step
      const aiReviewIndex = wizardSteps.indexOf('ai-review');
      if (aiReviewIndex !== -1) setStepIndex(aiReviewIndex);
    } catch {
      setAnalyzeError('AI analysis failed. You can still continue and fill in the details manually.');
      const aiReviewIndex = wizardSteps.indexOf('ai-review');
      if (aiReviewIndex !== -1) setStepIndex(aiReviewIndex);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (mode: 'default' | 'schedule' | 'service-today' = 'default') => {
    if (!companyId) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const summary = aiResult.ai_summary?.trim() || '';
      const trimmedOtherPest = otherPest.trim();

      const commentWithOtherPest =
        selectedPestValue === OTHER_PEST_OPTION_VALUE && trimmedOtherPest
          ? summary
            ? `${summary}\nPrimary pest concern (other): ${trimmedOtherPest}`
            : `Primary pest concern (other): ${trimmedOtherPest}`
          : summary;

      const fallbackSuggestedPest =
        pestOptions.length === 0 ? aiResult.suggested_pest_type ?? undefined : undefined;

      // Build notes: tech notes + service-today attribution note
      const today = new Date();
      const formattedDate = today.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      const serviceTodayNote = mode === 'service-today'
        ? `This Lead had already been Serviced by ${techName || 'the technician'} on ${formattedDate}. Please update the customer\u2019s billing and close the lead.`
        : null;

      const trimmedTechNotes = notes.trim();
      const mapPlotNote =
        leadType === 'new-lead' && newLeadPathMode === 'map-plot'
          ? buildMapPlotNote(mapPlotData)
          : null;
      const combinedNotes = [trimmedTechNotes, mapPlotNote, serviceTodayNote].filter(Boolean).join('\n\n');

      const mapPlotPayload =
        leadType === 'new-lead' && newLeadPathMode === 'map-plot' && mapPlotData.addressComponents
          ? {
              addressInput: mapPlotData.addressInput,
              addressComponents: mapPlotData.addressComponents,
              centerLat: getMapLatitude(mapPlotData),
              centerLng: getMapLongitude(mapPlotData),
              zoom: mapPlotData.zoom,
              heading: mapPlotData.heading,
              tilt: mapPlotData.tilt,
              isViewSet: mapPlotData.isViewSet,
              drawTool: mapPlotData.drawTool,
              backgroundMode: mapPlotData.backgroundMode,
              selectedStampType: mapPlotData.selectedStampType,
              selectedPestType: mapPlotData.selectedPestType,
              selectedObjectType: mapPlotData.selectedObjectType,
              selectedElementType: mapPlotData.selectedElementType,
              outlines: mapPlotData.outlines.map(outline => ({
                id: outline.id,
                type: outline.type,
                isClosed: outline.isClosed,
                points: outline.points.map(point => ({
                  x: Number(point.x.toFixed(5)),
                  y: Number(point.y.toFixed(5)),
                  ...(Number.isFinite(point.lat) && Number.isFinite(point.lng)
                    ? {
                        lat: Number((point.lat as number).toFixed(7)),
                        lng: Number((point.lng as number).toFixed(7)),
                      }
                    : {}),
                })),
              })),
              // legacy single-outline fields for backward compatibility with existing consumers
              outlinePoints: (mapPlotData.outlines[0]?.points ?? []).map(point => ({
                x: Number(point.x.toFixed(5)),
                y: Number(point.y.toFixed(5)),
                ...(Number.isFinite(point.lat) && Number.isFinite(point.lng)
                  ? {
                      lat: Number((point.lat as number).toFixed(7)),
                      lng: Number((point.lng as number).toFixed(7)),
                    }
                  : {}),
              })),
              isClosed: mapPlotData.outlines[0]?.isClosed ?? false,
              stamps: mapPlotData.stamps.map(stamp => ({
                id: stamp.id,
                type: stamp.type,
                x: Number(stamp.x.toFixed(5)),
                y: Number(stamp.y.toFixed(5)),
                ...(Number.isFinite(stamp.lat) && Number.isFinite(stamp.lng)
                  ? {
                      lat: Number((stamp.lat as number).toFixed(7)),
                      lng: Number((stamp.lng as number).toFixed(7)),
                    }
                  : {}),
              })),
              updatedAt: mapPlotData.updatedAt,
            }
          : null;

      const body: Record<string, unknown> = {
        companyId,
        comments: commentWithOtherPest || 'TechLead opportunity',
        notes: combinedNotes || undefined,
        pestType: selectedPestOption?.name ?? fallbackSuggestedPest,
        priority: isHighPriority ? 'high' : 'medium',
        leadSource: 'technician',
        leadType: 'manual',
        serviceType: aiResult.service_category || undefined,
      };

      if (mapPlotPayload) {
        body.mapPlotData = mapPlotPayload;

        const mapAddress = mapPlotData.addressComponents;
        if (mapAddress) {
          const streetAddress = `${mapAddress.street_number ? `${mapAddress.street_number} ` : ''}${mapAddress.route ?? ''}`.trim();
          if (streetAddress) body.streetAddress = streetAddress;
          if (mapAddress.locality) body.city = mapAddress.locality;
          if (mapAddress.administrative_area_level_1) body.state = mapAddress.administrative_area_level_1;
          if (mapAddress.postal_code) body.zip = mapAddress.postal_code;
        }
      }

      if (mode === 'schedule' || mode === 'service-today') {
        body.leadStatus = 'scheduling';
      }

      if (mode === 'service-today') {
        body.scheduledDate = today.toISOString().split('T')[0];
        // Current local time as HH:MM using the user's timezone
        const hh = String(today.getHours()).padStart(2, '0');
        const mm = String(today.getMinutes()).padStart(2, '0');
        body.scheduledTime = `${hh}:${mm}`;
      }

      if (selectedServicePlan) {
        body.serviceType = selectedServicePlan.plan_name;
        body.selectedPlanId = selectedServicePlan.id;
        body.recommendedPlanName = selectedServicePlan.plan_name;
      }

      if (selectedCustomer) {
        body.customerId = selectedCustomer.id;
      }

      // Upload photos to Supabase Storage
      if (photos.length > 0) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const uploadedUrls: string[] = [];

        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i];
          // Convert base64 directly to Blob (avoids fetch(dataUrl) failing on mobile/PWA)
          const byteString = atob(photo.base64);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let j = 0; j < byteString.length; j++) ia[j] = byteString.charCodeAt(j);
          const mimeType = photo.mimeType || 'image/jpeg';
          const blob = new Blob([ab], { type: mimeType });
          const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
          const path = `${companyId}/${user?.id ?? 'unknown'}/${Date.now()}-${i}.${ext}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('tech-lead-photos')
            .upload(path, blob, { contentType: blob.type, upsert: false });

          if (!uploadError && uploadData) {
            const { data: { publicUrl } } = supabase.storage
              .from('tech-lead-photos')
              .getPublicUrl(uploadData.path);
            uploadedUrls.push(publicUrl);
          }
        }

        if (uploadedUrls.length > 0) {
          body.photoUrls = uploadedUrls;
        }
      }

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to create lead');
      }

      const leadData = await res.json();
      const leadId = leadData?.lead?.id ?? leadData?.id;

      // Create quote line item for the selected service plan
      if (leadId && selectedServicePlan) {
        await fetch(`/api/leads/${leadId}/quote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_plans: [{ service_plan_id: selectedServicePlan.id }],
          }),
        });
      }

      clearDraft();
      setSubmitMode(mode);
      setIsDone(true);
    } catch (err: any) {
      setSubmitError(err.message ?? 'Failed to create lead. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Thank You screen
  if (isDone) {
    const customerFirstName = selectedCustomer?.first_name ?? null;
    const customerFullName = [selectedCustomer?.first_name, selectedCustomer?.last_name].filter(Boolean).join(' ') || null;
    const companyPhone = selectedCompany?.phone ?? null;
    const isSchedule = submitMode === 'schedule';

    return (
      <div className={styles.thankYouScreen}>
        <div className={styles.thankYouIcon}>
          <svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 20 20" fill="none">
            <g clipPath="url(#clip0_thankyou_check)">
              <path
                d="M18.1678 8.33332C18.5484 10.2011 18.2772 12.1428 17.3994 13.8348C16.5216 15.5268 15.0902 16.8667 13.3441 17.6311C11.5979 18.3955 9.64252 18.5381 7.80391 18.0353C5.9653 17.5325 4.35465 16.4145 3.24056 14.8678C2.12646 13.3212 1.57626 11.4394 1.68171 9.53615C1.78717 7.63294 2.54189 5.8234 3.82004 4.4093C5.09818 2.9952 6.82248 2.06202 8.70538 1.76537C10.5883 1.46872 12.516 1.82654 14.167 2.77916"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              />
              <path
                d="M7.5 9.16671L10 11.6667L18.3333 3.33337"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              />
            </g>
            <defs>
              <clipPath id="clip0_thankyou_check">
                <rect width="20" height="20" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </div>
        <h2 className={styles.thankYouTitle}>
          {isSchedule ? 'Time to Schedule!' : 'Opportunity Submitted!'}
        </h2>
        {isSchedule ? (
          <div className={styles.scheduleCallout}>
            <p className={styles.scheduleCalloutText}>
              Let&apos;s get{customerFirstName ? ` ${customerFirstName}` : ''} on the books.
            </p>
            {companyPhone ? (
              <>
                <a href={`tel:${companyPhone}`} className={styles.scheduleCallBtn}>
                  Call the office now
                </a>
                <p className={styles.schedulePhoneDisplay}>{companyPhone}</p>
              </>
            ) : (
              <p className={styles.thankYouDesc}>Call the office to get{customerFullName ? ` ${customerFullName}` : ' this customer'} scheduled.</p>
            )}
          </div>
        ) : (
          <p className={styles.thankYouDesc}>The lead has been created successfully.</p>
        )}
        <div className={styles.thankYouActions}>
          <button className={styles.primaryBtn} onClick={resetWizard}>
            Start Another
          </button>
          <button className={styles.secondaryBtn} onClick={() => router.push('/tech-leads')}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const canGoNext = (): boolean => {
    if (currentStepId === 'new-lead-path') return false;
    if (currentStepId === 'map-address') {
      return !!mapPlotData.addressComponents && getMapLatitude(mapPlotData) !== null && getMapLongitude(mapPlotData) !== null;
    }
    if (currentStepId === 'photos' && photos.length === 0) return false;
    if (currentStepId === 'ai-review' && selectedPestValue === OTHER_PEST_OPTION_VALUE && !otherPest.trim()) return false;
    if (currentStepId === 'select-site' && isPestPacEnabled && !selectedPestPacClient && !selectedCustomer) return false;
    if (currentStepId === 'new-customer') {
      return !!(newCustomerForm.firstName.trim() && newCustomerForm.lastName.trim() && newCustomerForm.phone.trim());
    }
    if (currentStepId === 'map-plot') {
      if (!mapPlotData.isViewSet) return false;
      if (mapPlotData.backgroundMode === 'blank-grid') return true;
      return getMapLatitude(mapPlotData) !== null && getMapLongitude(mapPlotData) !== null;
    }
    if (currentStepId === 'service-plan-select') return selectedServicePlan !== null;
    if (currentStepId === 'service-details') return selectedServicePlan !== null;
    return true;
  };

  const handleNext = async () => {
    // New customer: create customer via API before advancing
    if (currentStepId === 'new-customer') {
      setIsCreatingCustomer(true);
      setCreateCustomerError(null);
      try {
        const ac = newCustomerForm.addressComponents;
        const street = `${ac?.street_number ? ac.street_number + ' ' : ''}${ac?.route ?? ''}`.trim();
        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_id: companyId,
            first_name: newCustomerForm.firstName.trim(),
            last_name: newCustomerForm.lastName.trim(),
            phone: newCustomerForm.phone.trim() || null,
            email: newCustomerForm.email.trim() || null,
            address: street || null,
            city: ac?.locality ?? null,
            state: ac?.administrative_area_level_1 ?? null,
            zip_code: ac?.postal_code ?? null,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? 'Failed to create customer');
        }
        const data = await res.json();
        setSelectedCustomer(data);
        setStepIndex(i => i + 1);
      } catch (err: any) {
        setCreateCustomerError(err.message ?? 'Failed to create customer. Please try again.');
      } finally {
        setIsCreatingCustomer(false);
      }
      return;
    }

    // Upsell: PestPac sync when leaving site selection with a PestPac client selected
    if (currentStepId === 'select-site' && isPestPacEnabled && selectedPestPacClient) {
      setIsSyncingCustomer(true);
      setSyncError(null);
      try {
        const res = await fetch('/api/customers/pestpac-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId: selectedPestPacClient.clientId, companyId }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? 'Failed to sync customer');
        }
        const data = await res.json();
        const synced = data.customer;
        setSelectedCustomer(synced);
        // Save to recent customers
        const addr = synced.primary_service_address?.[0]?.service_address ?? null;
        addRecent({
          id: synced.id,
          first_name: synced.first_name,
          last_name: synced.last_name,
          email: synced.email,
          phone: synced.phone,
          pestpac_client_id: synced.pestpac_client_id ?? null,
          primaryAddress: addr ? {
            street_address: addr.street_address,
            city: addr.city,
            state: addr.state,
            zip_code: addr.zip_code,
          } : null,
        });
        setStepIndex(i => i + 1);
      } catch (err: any) {
        setSyncError(err.message ?? 'Failed to sync customer from PestPac. Please try again.');
      } finally {
        setIsSyncingCustomer(false);
      }
      return;
    }

    // Save local DB customer selection to recent
    if (currentStepId === 'select-site' && selectedCustomer) {
      const addr = getPrimaryAddress(selectedCustomer);
      addRecent({
        id: selectedCustomer.id,
        first_name: selectedCustomer.first_name,
        last_name: selectedCustomer.last_name,
        email: selectedCustomer.email,
        phone: selectedCustomer.phone,
        primaryAddress: addr ? {
          street_address: addr.street_address,
          city: addr.city,
          state: addr.state,
          zip_code: addr.zip_code,
        } : null,
      });
    }

    if (stepIndex < wizardSteps.length - 1) setStepIndex(i => i + 1);
  };

  const handleBack = () => {
    if (stepIndex > 0) setStepIndex(i => i - 1);
  };

  // Determine if the next button should show a loading state
  const isNextLoading = isSyncingCustomer || isCreatingCustomer;
  const nextLoadingLabel = isCreatingCustomer ? 'Creating customer…' : 'Syncing customer…';

  // Steps visible in progress bar
  const progressSteps: StepId[] = wizardSteps.filter(
    s => s !== 'type-select' && s !== 'service-today-confirm' && s !== 'new-lead-path'
  ) as StepId[];
  const progressIndex = progressSteps.indexOf(currentStepId);

  return (
    <div className={styles.wizardContainer} ref={wizardContainerRef}>
      {/* Progress indicator — only show after type selection */}
      {stepIndex > 0 && currentStepId !== 'new-lead-path' && (
        <div className={styles.progressSection}>
          <p className={styles.progressLeadType}>
            {leadType === 'new-lead' ? 'New Lead' : 'Upsell Opportunity'}
          </p>
        <div className={styles.progressBar}>
          {progressSteps.map((stepId, i) => (
            <div
              key={stepId}
              className={`${styles.progressStep} ${i === progressIndex ? styles.progressStepActive : ''} ${i < progressIndex ? styles.progressStepDone : ''}`}
            >
              <div className={styles.progressDot}>
                {i < progressIndex ? '✓' : i + 1}
              </div>
              <span className={styles.progressLabel}>{STEP_ID_LABELS[stepId]}</span>
            </div>
          ))}
        </div>
        </div>
      )}

      {/* Draft restored banner */}
      {draftRestored && (
        <div className={styles.draftBanner}>
          <span>Draft restored</span>
          <div className={styles.draftBannerActions}>
            <button
              type="button"
              className={styles.draftDiscardBtn}
              onClick={() => {
                clearDraft();
                resetWizard();
              }}
            >
              Discard
            </button>
            <button
              type="button"
              className={styles.draftDismissBtn}
              onClick={() => setDraftRestored(false)}
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Step content */}
      <div className={`${styles.stepWrapper} ${currentStepId === 'map-plot' ? styles.stepWrapperNoScroll : ''}`}>
        {currentStepId === 'type-select' && (
          <StepTypeSelect
            onSelect={type => {
              setLeadType(type);
              setNewLeadPathMode(null);
              setMapPlotData({ ...DEFAULT_MAP_PLOT_DATA });
              setWizardTitle(type === 'new-lead' ? 'New Lead' : 'Upsell Opportunity');
              setStepIndex(1);
            }}
          />
        )}

        {currentStepId === 'new-lead-path' && (
          <StepNewLeadPath
            onSelect={mode => {
              setNewLeadPathMode(mode);
              if (mode === 'standard') {
                setMapPlotData({ ...DEFAULT_MAP_PLOT_DATA });
              }
              setStepIndex(i => i + 1);
            }}
          />
        )}

        {currentStepId === 'photos' && (
          <StepPhotos
            photos={photos}
            onPhotosChange={setPhotos}
          />
        )}

        {currentStepId === 'ai-review' && (
          <>
            {analyzeError && <p className={styles.analyzeError}>{analyzeError}</p>}
            <StepAIReview
              aiResult={aiResult}
              notes={notes}
              customerMentioned={customerMentioned}
              isHighPriority={isHighPriority}
              pestOptions={pestOptions}
              selectedPestValue={selectedPestValue}
              otherPestValue={otherPest}
              isPestOptionsLoading={isPestOptionsLoading}
              onAIResultChange={setAIResult}
              onPestValueChange={(value) => {
                setSelectedPestValue(value);
                setHasManualPestSelection(true);
                if (value !== OTHER_PEST_OPTION_VALUE) {
                  setOtherPest('');
                }
              }}
              onOtherPestChange={(value) => {
                setOtherPest(value);
                setHasManualPestSelection(true);
              }}
              onNotesChange={setNotes}
              onCustomerMentionedChange={setCustomerMentioned}
              onHighPriorityChange={setIsHighPriority}
            />
          </>
        )}

        {currentStepId === 'new-customer' && (
          <StepNewCustomer
            form={newCustomerForm}
            onChange={setNewCustomerForm}
            error={createCustomerError}
          />
        )}

        {currentStepId === 'map-address' && (
          <StepMapAddress
            mapPlotData={mapPlotData}
            onChange={setMapPlotData}
          />
        )}

        {currentStepId === 'map-plot' && (
          <StepMapPlot
            companyId={companyId}
            mapPlotData={mapPlotData}
            onChange={setMapPlotData}
            onBack={handleBack}
            onNext={() => {
              void handleNext();
            }}
            canNext={canGoNext()}
          />
        )}

        {currentStepId === 'select-site' && (
          <StepSelectSite
            companyId={companyId}
            selectedCustomer={selectedCustomer}
            onSelectCustomer={setSelectedCustomer}
            isPestPacEnabled={isPestPacEnabled}
            selectedPestPacClient={selectedPestPacClient}
            onSelectPestPacClient={setSelectedPestPacClient}
            recentCustomers={recentCustomers}
          />
        )}

        {currentStepId === 'service-plan-select' && (
          <StepServicePlanSelect
            companyId={companyId}
            selectedPlan={selectedServicePlan}
            onPlanSelect={setSelectedServicePlan}
            suggestedPestType={aiResult.suggested_pest_type}
            selectedPestValue={selectedPestValue}
          />
        )}

        {currentStepId === 'service-details' && (
          <StepServiceDetails
            companyId={companyId}
            locationId={selectedPestPacClient?.clientId ?? selectedCustomer?.pestpac_client_id ?? null}
            suggestedPestType={aiResult.suggested_pest_type}
            matchedPestOption={aiResult.matched_pest_option}
            selectedPestValue={selectedPestValue}
            selectedPlan={selectedServicePlan}
            onPlanSelect={setSelectedServicePlan}
          />
        )}

        {currentStepId === 'review' && (
          <StepReview
            leadType={leadType}
            newLeadPathMode={newLeadPathMode}
            mapPlotData={newLeadPathMode === 'map-plot' ? mapPlotData : null}
            photos={photos}
            aiResult={aiResult}
            notes={notes}
            customerMentioned={customerMentioned}
            isHighPriority={isHighPriority}
            selectedPestLabel={selectedPestOption?.name ?? null}
            otherPest={selectedPestValue === OTHER_PEST_OPTION_VALUE ? otherPest : ''}
            selectedCustomer={selectedCustomer}
            selectedPlan={selectedServicePlan}
          />
        )}

        {currentStepId === 'service-today-confirm' && (
          <StepServiceTodayConfirm
            selectedPlan={selectedServicePlan}
            selectedCustomer={selectedCustomer}
            techName={techName}
            onSignatureChange={setSignatureData}
          />
        )}
      </div>

      {/* Bottom action bar */}
      {currentStepId !== 'map-plot' && (
      <div className={styles.actionBar}>
        {stepIndex > 0 ? (
          <button className={styles.backBtn} onClick={handleBack}>
            ← Back
          </button>
        ) : (
          <button className={styles.backBtn} onClick={() => router.push('/tech-leads')}>
            ← Cancel
          </button>
        )}

        {currentStepId === 'photos' && photos.length > 0 && (
          <button
            className={styles.analyzeBtn}
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <><span className={styles.spinner} />Analyzing…</>
            ) : (
              <>✨ Analyze with AI</>
            )}
          </button>
        )}

        {currentStepId === 'photos' && photos.length === 0 && (
          <button className={styles.nextBtn} onClick={handleNext}>
            Continue Without Photos →
          </button>
        )}

        {currentStepId !== 'type-select' && currentStepId !== 'new-lead-path' && currentStepId !== 'photos' && currentStepId !== 'review' && currentStepId !== 'service-today-confirm' && (
          <button
            className={styles.nextBtn}
            onClick={handleNext}
            disabled={!canGoNext() || isNextLoading}
          >
            {isNextLoading ? (
              <><span className={styles.spinner} />{nextLoadingLabel}</>
            ) : (
              'Next →'
            )}
          </button>
        )}

        {currentStepId === 'review' && leadType === 'upsell' && (
          <div className={styles.reviewActions}>
            <button
              className={styles.scheduleBtn}
              onClick={() => handleSubmit('schedule')}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <><span className={styles.spinner} />Submitting…</>
              ) : (
                <>Refer To Sales</>
              )}
            </button>
            <button
              className={styles.serviceTodayBtn}
              onClick={() => setStepIndex(i => i + 1)}
              disabled={isSubmitting}
            >
              <>Sell It</>
            </button>
          </div>
        )}

        {currentStepId === 'review' && leadType === 'new-lead' && (
          <button
            className={styles.submitBtn}
            onClick={() => handleSubmit('default')}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className={styles.spinner} />
                Submitting…
              </>
            ) : (
              'Submit'
            )}
          </button>
        )}

        {currentStepId === 'service-today-confirm' && (
          <button
            className={styles.submitBtn}
            onClick={() => handleSubmit('service-today')}
            disabled={isSubmitting || !signatureData}
          >
            {isSubmitting ? (
              <><span className={styles.spinner} />Submitting…</>
            ) : (
              'Submit'
            )}
          </button>
        )}
      </div>
      )}

      {syncError && <p className={styles.submitError}>{syncError}</p>}
      {submitError && <p className={styles.submitError}>{submitError}</p>}

      {/* Exit prompt modal */}
      {showExitPrompt && (
        <div className={styles.exitPromptOverlay} onClick={() => setShowExitPrompt(false)}>
          <div className={styles.exitPromptSheet} onClick={e => e.stopPropagation()}>
            <p className={styles.exitPromptTitle}>Leave opportunity?</p>
            <p className={styles.exitPromptBody}>Your progress has been saved as a draft. You can restore it from My Opportunities.</p>
            <button
              type="button"
              className={styles.exitSaveDraftBtn}
              onClick={() => {
                setShowExitPrompt(false);
                router.back();
              }}
            >
              Save as Draft
            </button>
            <button
              type="button"
              className={styles.exitDiscardBtn}
              onClick={() => {
                setShowExitPrompt(false);
                clearDraft();
                router.back();
              }}
            >
              Discard
            </button>
            <button
              type="button"
              className={styles.exitCancelBtn}
              onClick={() => setShowExitPrompt(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
