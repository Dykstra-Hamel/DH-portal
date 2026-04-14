'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import {
  ArrowLeft,
  ArrowRight,
  Grid3x3,
  List,
  LocateFixed,
  Lock,
  Unlock,
  Move3d,
  RotateCcw,
  RotateCw,
  Ruler,
  Undo2,
  Trash2,
  Map as MapIcon,
  MapPinned,
} from 'lucide-react';
import { MapStampGlyph, PlotObjectBlueprintGlyph, ConditionStampGlyph } from '@/components/FieldMap/MapPlot/glyphs';
import { PestStampModal } from '@/components/FieldMap/MapPlot/PestStampModal/PestStampModal';
import {
  BLANK_GRID_MAX_SCALE,
  BLANK_GRID_MIN_SCALE,
  clampNormalized,
  DEFAULT_CONDITION_TYPE,
  DEFAULT_ELEMENT_STAMP_TYPE,
  DEFAULT_OBJECT_STAMP_TYPE,
  DEFAULT_PEST_STAMP_TYPE,
  getMapLatitude,
  getMapLongitude,
  getMapStampOption,
  getMetersPerPixel,
  getPolygonAreaInPixels,
  getPolygonCentroidNormalized,
  hexToRgba,
  isMapConditionStampType,
  isMapElementStampType,
  isMapObjectStampType,
  isMapPestStampType,
  MAP_CONDITION_STAMP_OPTIONS,
  MAP_ELEMENT_STAMP_OPTIONS,
  MAP_MIN_ZOOM,
  MAP_OBJECT_STAMP_OPTIONS,
  MAP_PEST_STAMP_OPTIONS,
  OUTLINE_SNAP_GRID_PX,
  type MapConditionStampType,
  type MapElementOutline,
  type MapElementStampType,
  type MapObjectStampType,
  type MapPestStampType,
  type MapPlotData,
  type MapPlotStamp,
  type MapStampCategory,
  type MapStampType,
  type MapOutlinePoint,
} from '@/components/FieldMap/MapPlot/types';
import styles from './MapPlotCanvas.module.scss';

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

interface CompanyPestOption {
  id: string;
  name: string;
  slug: string;
  custom_label: string;
  icon_svg: string | null;
  display_order: number;
}

function StepMapPlot({
  companyId,
  mapPlotData,
  onChange,
  onBack,
  onNext,
  canNext,
  stampColor,
}: {
  companyId: string;
  mapPlotData: MapPlotData;
  onChange: (next: MapPlotData) => void;
  onBack: () => void;
  onNext: () => void;
  canNext: boolean;
  stampColor?: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const toolbarDockRef = useRef<HTMLDivElement>(null);
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string | null>(null);
  const [mapsError, setMapsError] = useState<string | null>(null);
  const [googleMapInstance, setGoogleMapInstance] = useState<google.maps.Map | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [draggingStampId, setDraggingStampId] = useState<string | null>(null);
  const [pestModalStampId, setPestModalStampId] = useState<string | null>(null);
  const [showDimensions, setShowDimensions] = useState(false);
  const [selectedWallMeasurement, setSelectedWallMeasurement] = useState<{ outlineId: string; segmentIndex: number } | null>(null);
  const [showLegendLabels, setShowLegendLabels] = useState(false);
  const [snapToFirst, setSnapToFirst] = useState(false);
  const [activeStampMenu, setActiveStampMenu] = useState<MapStampCategory | null>(null);
  const [companyPestOptions, setCompanyPestOptions] = useState<CompanyPestOption[]>([]);
  const [selectedDynamicPestOption, setSelectedDynamicPestOption] = useState<CompanyPestOption | null>(null);
  const [blankGridScale, setBlankGridScale] = useState(1);
  const [blankGridOffset, setBlankGridOffset] = useState({ x: 0, y: 0 });
  const [satFocusTransform, setSatFocusTransform] = useState<{ scale: number; tx: number; ty: number } | null>(null);
  const [satFocusAnimating, setSatFocusAnimating] = useState(false);
  const stampFocusPendingRef = useRef<{ stampX: number; stampY: number } | null>(null);
  const mapPlotDataRef = useRef(mapPlotData);
  mapPlotDataRef.current = mapPlotData;
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
  const mapRotateRef = useRef<{ lastAngle: number | null; baseHeading: number }>({ lastAngle: null, baseHeading: 0 });

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
  const selectedConditionType = isMapConditionStampType(mapPlotData.selectedConditionType)
    ? mapPlotData.selectedConditionType
    : DEFAULT_CONDITION_TYPE;
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
  const updateMapPlotDataRef = useRef(updateMapPlotData);
  updateMapPlotDataRef.current = updateMapPlotData;

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

  // Fetch company-configured pest options to populate the dynamic picker
  useEffect(() => {
    if (!companyId) return;
    fetch(`/api/pest-options/${encodeURIComponent(companyId)}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setCompanyPestOptions(data.data);
          // Auto-select the first pest so the toggle shows a real icon immediately
          if (data.data.length > 0) {
            const firstOption = data.data[0];
            setSelectedDynamicPestOption(firstOption);
            updateMapPlotData({
              drawTool: 'stamp',
              selectedPestType: 'dynamic-pest',
              selectedStampType: 'dynamic-pest',
            });
          }
        }
      })
      .catch(() => { /* fallback to static options */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  // Default to outline tool when the map is first locked (isViewSet transitions false → true)
  const wasViewSetRef = useRef(mapPlotData.isViewSet);
  useEffect(() => {
    if (mapPlotData.isViewSet && !wasViewSetRef.current) {
      updateMapPlotData({ drawTool: 'outline' });
    }
    wasViewSetRef.current = mapPlotData.isViewSet;
  }, [mapPlotData.isViewSet, updateMapPlotData]);

  // Passive two-finger rotation gesture for the satellite map (view setup phase only).
  // Accumulated heading is committed to React state on touchend so the controlled
  // <Map heading={...}> prop drives the actual rotation (avoids raster-map warnings).
  useEffect(() => {
    const container = mapRef.current;
    if (!isSatelliteMode || !container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (mapPlotDataRef.current.isViewSet) return;
      if (e.touches.length === 2) {
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        mapRotateRef.current.lastAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        mapRotateRef.current.baseHeading = mapPlotDataRef.current.heading ?? 0;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (mapPlotDataRef.current.isViewSet) return;
      if (e.touches.length !== 2 || mapRotateRef.current.lastAngle === null) return;
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      let delta = angle - mapRotateRef.current.lastAngle;
      // Normalize delta to [-180, 180] to avoid jumps at the ±180° boundary
      delta = ((delta + 540) % 360) - 180;
      mapRotateRef.current.lastAngle = angle;
      mapRotateRef.current.baseHeading += delta;
      // Commit to state each frame — the controlled heading prop drives the map rotation
      updateMapPlotDataRef.current({ heading: mapRotateRef.current.baseHeading });
    };

    const handleTouchEnd = () => {
      mapRotateRef.current.lastAngle = null;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isSatelliteMode]);

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

  // Reproject satellite geometry when canvas resizes OR when the map instance first becomes
  // available (googleMapInstance starts null and is set asynchronously after the tile loads)
  useEffect(() => {
    if (!isSatelliteMode || !googleMapInstance || canvasSize.width <= 0 || canvasSize.height <= 0) return;
    const { stamps, outlines } = mapPlotDataRef.current;
    const reprojected = reprojectAnchoredGeometry(stamps, outlines, googleMapInstance);
    updateMapPlotData({ stamps: reprojected.stamps, outlines: reprojected.outlines });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasSize.width, canvasSize.height, googleMapInstance]);

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
      const dx = second.x - first.x;
      const dy = second.y - first.y;
      const distance = Math.hypot(dx, dy);
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

    // Un-rotate screen offsets back to north-up Mercator world offsets
    const headingRad = ((map.getHeading() ?? 0) * Math.PI) / 180;
    const worldDxPx = dxPx * Math.cos(headingRad) - dyPx * Math.sin(headingRad);
    const worldDyPx = dxPx * Math.sin(headingRad) + dyPx * Math.cos(headingRad);

    let worldX = centerWorld.x + worldDxPx / scale;
    const worldY = centerWorld.y + worldDyPx / scale;
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

    // Rotate world offsets (north-up Mercator) into rotated screen space
    const headingRad = ((map.getHeading() ?? 0) * Math.PI) / 180;
    const screenDx = dx * Math.cos(headingRad) + dy * Math.sin(headingRad);
    const screenDy = -dx * Math.sin(headingRad) + dy * Math.cos(headingRad);

    return {
      x: (screenDx * scale + canvasSize.width / 2) / canvasSize.width,
      y: (screenDy * scale + canvasSize.height / 2) / canvasSize.height,
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
    if (isSatelliteMode) {
      const geo = getLatLngFromNormalizedPoint(snappedPoint);
      if (!geo) return { x: snappedPoint.x, y: snappedPoint.y };
      return { x: snappedPoint.x, y: snappedPoint.y, lat: geo.lat, lng: geo.lng };
    }
    if (isBlankGridMode && canvasSize.width > 0 && canvasSize.height > 0) {
      const refW = mapPlotData.gridRefWidth ?? canvasSize.width;
      const refH = mapPlotData.gridRefHeight ?? canvasSize.height;
      return {
        x: snappedPoint.x,
        y: snappedPoint.y,
        xGrid: snappedPoint.x * (refW / 8),
        yGrid: snappedPoint.y * (refH / 8),
      };
    }
    return { x: snappedPoint.x, y: snappedPoint.y };
  }, [canvasSize.height, canvasSize.width, getLatLngFromNormalizedPoint, isBlankGridMode, isSatelliteMode, mapPlotData.gridRefHeight, mapPlotData.gridRefWidth, snapPointToGrid]);

  const createStamp = useCallback((point: { x: number; y: number }, type: MapStampType): MapPlotStamp => {
    if (isSatelliteMode) {
      const geo = getLatLngFromNormalizedPoint(point);
      return {
        id: crypto.randomUUID(),
        x: point.x,
        y: point.y,
        ...(geo ? { lat: geo.lat, lng: geo.lng } : {}),
        type,
      };
    }
    if (isBlankGridMode && canvasSize.width > 0 && canvasSize.height > 0) {
      const refW = mapPlotData.gridRefWidth ?? canvasSize.width;
      const refH = mapPlotData.gridRefHeight ?? canvasSize.height;
      return {
        id: crypto.randomUUID(),
        x: point.x,
        y: point.y,
        xGrid: point.x * (refW / 8),
        yGrid: point.y * (refH / 8),
        type,
      };
    }
    return { id: crypto.randomUUID(), x: point.x, y: point.y, type };
  }, [canvasSize.height, canvasSize.width, getLatLngFromNormalizedPoint, isBlankGridMode, isSatelliteMode, mapPlotData.gridRefHeight, mapPlotData.gridRefWidth]);

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
      outline.isClosed &&
      outline.points.length >= 3 &&
      latitude !== null
    ) {
      const metersPerPixel = getMetersPerPixel(latitude, mapPlotData.zoom);
      if (Number.isFinite(metersPerPixel) && metersPerPixel > 0) {
        let areaPx: number;
        // In grid mode, use xGrid*8 / yGrid*8 directly — viewport-independent
        if (
          isBlankGridMode &&
          outline.points.every(p => Number.isFinite(p.xGrid) && Number.isFinite(p.yGrid))
        ) {
          let a = 0;
          const pts = outline.points;
          for (let i = 0; i < pts.length; i++) {
            const j = (i + 1) % pts.length;
            a += (pts[i].xGrid! * 8) * (pts[j].yGrid! * 8);
            a -= (pts[j].xGrid! * 8) * (pts[i].yGrid! * 8);
          }
          areaPx = Math.abs(a) / 2;
        } else {
          areaPx = canvasSize.width > 0 && canvasSize.height > 0
            ? getPolygonAreaInPixels(outline.points, canvasSize.width, canvasSize.height)
            : 0;
        }
        if (areaPx > 0) {
          areaSqFt = areaPx * metersPerPixel * metersPerPixel * 10.76391041671;
        }
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
  }, [canvasSize.height, canvasSize.width, isBlankGridMode, latitude, mapPlotData.zoom]);

  const getOutlineSegmentDimensions = useCallback((outline: MapElementOutline) => {
    const emptyResult = [] as Array<{ x: number; y: number; feet: number; x1: number; y1: number; x2: number; y2: number }>;
    if (canvasSize.width <= 0 || canvasSize.height <= 0 || outline.points.length < 2) return emptyResult;

    const segmentCount = outline.isClosed ? outline.points.length : outline.points.length - 1;
    const segments: Array<{ x: number; y: number; feet: number; x1: number; y1: number; x2: number; y2: number }> = [];

    if (latitude !== null) {
      const metersPerPixel = getMetersPerPixel(latitude, mapPlotData.zoom);
      if (!Number.isFinite(metersPerPixel) || metersPerPixel <= 0) return emptyResult;
      for (let i = 0; i < segmentCount; i += 1) {
        const start = outline.points[i];
        const end = outline.points[(i + 1) % outline.points.length];

        let dxPx: number, dyPx: number;
        let x: number, y: number, x1: number, y1: number, x2: number, y2: number;

        if (
          isBlankGridMode &&
          Number.isFinite(start.xGrid) && Number.isFinite(start.yGrid) &&
          Number.isFinite(end.xGrid) && Number.isFinite(end.yGrid)
        ) {
          // Measurement uses xGrid*8 — stable pixel distance in the reference coordinate space.
          // Display positions use x/y normalized coords — viewport-proportional.
          dxPx = (end.xGrid! - start.xGrid!) * 8;
          dyPx = (end.yGrid! - start.yGrid!) * 8;
          x1 = start.x; y1 = start.y;
          x2 = end.x; y2 = end.y;
          x = (x1 + x2) / 2;
          y = (y1 + y2) / 2;
        } else {
          dxPx = (end.x - start.x) * canvasSize.width;
          dyPx = (end.y - start.y) * canvasSize.height;
          x = (start.x + end.x) / 2;
          y = (start.y + end.y) / 2;
          x1 = start.x; y1 = start.y; x2 = end.x; y2 = end.y;
        }

        const feet = Math.hypot(dxPx, dyPx) * metersPerPixel * 3.280839895;
        if (!Number.isFinite(feet) || feet <= 0) continue;
        segments.push({ x, y, feet, x1, y1, x2, y2 });
      }
    }

    return segments;
  }, [canvasSize.height, canvasSize.width, isBlankGridMode, latitude, mapPlotData.zoom]);

  const getWallMeasurementHit = useCallback((point: { x: number; y: number }): { outlineId: string; segmentIndex: number; distancePx: number } | null => {
    if (
      !showDimensions ||
      !canRenderDimensions ||
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
    let nextStamp = createStamp(point, mapPlotData.selectedStampType);

    // Enrich dynamic pest stamps with company pest metadata
    if (mapPlotData.selectedStampType === 'dynamic-pest' && selectedDynamicPestOption) {
      nextStamp = {
        ...nextStamp,
        pestId: selectedDynamicPestOption.id,
        pestSlug: selectedDynamicPestOption.slug,
        displayLabel: selectedDynamicPestOption.custom_label,
      };
    }

    // Enrich condition stamps with display label
    if (isMapConditionStampType(mapPlotData.selectedStampType)) {
      const condOpt = MAP_CONDITION_STAMP_OPTIONS.find(o => o.type === mapPlotData.selectedStampType);
      if (condOpt) {
        nextStamp = { ...nextStamp, displayLabel: condOpt.label };
      }
    }

    updateMapPlotData({
      stamps: [...mapPlotData.stamps, nextStamp],
    });

    // Close the stamp picker menu after placing a stamp
    setActiveStampMenu(null);

    if (isMapPestStampType(nextStamp.type) || isMapConditionStampType(nextStamp.type)) {
      setPestModalStampId(nextStamp.id);
    }
  }, [createStamp, mapPlotData.selectedStampType, mapPlotData.stamps, selectedDynamicPestOption, updateMapPlotData]);

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
      // Only check for a closed-polygon hit when NOT actively drawing a new outline.
      // While drawing, clicks must always add a point to the active outline, even
      // if the tap lands inside or near a neighbouring closed shape.
      const isDrawingActiveOutline =
        !!mapPlotData.activeOutlineId &&
        !!activeOutline &&
        !activeOutline.isClosed;

      if (!isDrawingActiveOutline) {
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

    // Store pending coords before addStampAtPoint (which calls setPestModalStampId)
    // so handleSheetReady can apply the correct transform once the modal measures itself
    if (
      (isMapPestStampType(mapPlotData.selectedStampType) || isMapConditionStampType(mapPlotData.selectedStampType)) &&
      mapRef.current
    ) {
      const canvasRect = mapRef.current.getBoundingClientRect();
      stampFocusPendingRef.current = {
        stampX: event.clientX - canvasRect.left,
        stampY: event.clientY - canvasRect.top,
      };
    }
    addStampAtPoint(point);
  };

  const handleOverlayPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!mapPlotData.isViewSet || mapPlotData.drawTool !== 'outline' || showDimensions) return;

    const point = getNormalizedPoint(event.clientX, event.clientY);
    const container = mapRef.current;
    if (!point || !container) return;

    const rect = container.getBoundingClientRect();
    const NODE_HIT_PX = 18;

    const isDrawingActiveOutline =
      !!mapPlotData.activeOutlineId &&
      !!activeOutline &&
      !activeOutline.isClosed;

    // No active outline → user intends to start a new one. Skip node hit detection
    // entirely so a click near an existing node always begins a fresh outline.
    // Active but open outline → only check the active outline's own nodes (for
    // the close-gesture on its first node).
    // Active and closed outline → check all outlines so nodes can be dragged.
    if (!mapPlotData.activeOutlineId) return;

    const outlinesToSearch = isDrawingActiveOutline
      ? mapPlotData.outlines.filter(o => o.id === mapPlotData.activeOutlineId)
      : mapPlotData.outlines;

    let hitOutlineId: string | null = null;
    let hitNodeIndex = -1;
    let hitDistance = Number.POSITIVE_INFINITY;

    for (const outline of outlinesToSearch) {
      outline.points.forEach((node, index) => {
        const dx = (point.x - node.x) * rect.width;
        const dy = (point.y - node.y) * rect.height;
        const distance = Math.hypot(dx, dy);
        if (distance < hitDistance) {
          hitDistance = distance;
          hitOutlineId = outline.id;
          hitNodeIndex = index;
        }
      });
    }

    if (hitOutlineId !== null && hitDistance <= NODE_HIT_PX) {
      const targetOutline = mapPlotData.outlines.find(o => o.id === hitOutlineId)!;

      // Close-outline gesture: first node of an active open outline with enough points
      if (
        !targetOutline.isClosed &&
        hitNodeIndex === 0 &&
        targetOutline.points.length >= 3 &&
        targetOutline.id === mapPlotData.activeOutlineId
      ) {
        event.preventDefault();
        event.stopPropagation();
        setSnapToFirst(false);
        outlineNodeGestureRef.current = {
          mode: 'close-outline',
          outlineId: targetOutline.id,
          startClientX: event.clientX,
          startClientY: event.clientY,
          hasMoved: false,
        };
        lastDragAtRef.current = Date.now();
        event.currentTarget.setPointerCapture(event.pointerId);
        return;
      }

      // Node drag gesture — only for nodes on closed/inactive outlines (not while drawing)
      if (!isDrawingActiveOutline) {
        event.preventDefault();
        event.stopPropagation();
        setSnapToFirst(false);
        outlineNodeGestureRef.current = {
          mode: 'move-node',
          outlineId: hitOutlineId,
          nodeIndex: hitNodeIndex,
          startClientX: event.clientX,
          startClientY: event.clientY,
          isDragging: false,
        };
        lastDragAtRef.current = Date.now();
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    }
  };

  const stopOutlineNodeDrag = () => {
    const gesture = outlineNodeGestureRef.current;
    if (!gesture) return;

    if (gesture.mode === 'close-outline') {
      setSnapToFirst(false);
      const outline = mapPlotData.outlines.find(item => item.id === gesture.outlineId);
      if (outline && !gesture.hasMoved && !outline.isClosed) {
        if (outline.type === 'fence' && outline.points.length >= 2) {
          // Fence lines never close — tapping the first node finishes the line
          updateMapPlotData({ activeOutlineId: null });
        } else if (outline.type !== 'fence' && outline.points.length >= 3) {
          updateMapPlotData({
            outlines: mapPlotData.outlines.map(item =>
              item.id === outline.id ? { ...item, isClosed: true } : item
            ),
            activeOutlineId: null,
          });
        }
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
      ...(isBlankGridMode && canvasSize.width > 0 && canvasSize.height > 0
        ? { gridRefWidth: canvasSize.width, gridRefHeight: canvasSize.height }
        : {}),
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

  const activateDynamicPestTool = useCallback((option: CompanyPestOption) => {
    setSelectedDynamicPestOption(option);
    updateMapPlotData({
      drawTool: 'stamp',
      selectedPestType: 'dynamic-pest',
      selectedStampType: 'dynamic-pest',
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

  const activateConditionTool = useCallback((type: MapConditionStampType) => {
    updateMapPlotData({
      drawTool: 'stamp',
      selectedConditionType: type,
      selectedStampType: type,
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
      const refW = mapPlotData.gridRefWidth ?? canvasSize.width;
      const refH = mapPlotData.gridRefHeight ?? canvasSize.height;
      const gridCoords = isBlankGridMode && refW > 0 && refH > 0
        ? { xGrid: snappedPoint.x * (refW / 8), yGrid: snappedPoint.y * (refH / 8) }
        : {};
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
                        ...gridCoords,
                      }
                    : node
                ),
              }
            : outline
        ),
      });
      return;
    }

    const minPointsToSnap = activeOutline?.type === 'fence' ? 2 : 3;
    if (
      !mapPlotData.isViewSet ||
      mapPlotData.drawTool !== 'outline' ||
      activeOutlineClosed ||
      activeOutlinePoints.length < minPointsToSnap
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
    canvasSize.width > 0 &&
    canvasSize.height > 0 &&
    latitude !== null;

  const canShowStampMenus = mapPlotData.isViewSet && mapPlotData.drawTool === 'stamp';
  const canShowPestMenu = canShowStampMenus;
  const canShowObjectMenu = canShowStampMenus;
  const canShowConditionMenu = canShowStampMenus;
  const canShowElementMenu = mapPlotData.isViewSet && mapPlotData.drawTool === 'outline';
  const canRenderActiveStampMenu =
    (activeStampMenu === 'pest' && canShowPestMenu) ||
    (activeStampMenu === 'object' && canShowObjectMenu) ||
    (activeStampMenu === 'condition' && canShowConditionMenu) ||
    (activeStampMenu === 'element' && canShowElementMenu);
  const isPestSelected = isMapPestStampType(mapPlotData.selectedStampType);
  const isObjectSelected = isMapObjectStampType(mapPlotData.selectedStampType);
  const isConditionSelected = isMapConditionStampType(mapPlotData.selectedStampType);
  const isElementSelected = isMapElementStampType(mapPlotData.selectedStampType);
  const satelliteStampScale = isSatelliteMode ? getSatelliteStampScale(mapPlotData.zoom) : 1;

  useEffect(() => {
    if (
      (activeStampMenu === 'pest' && !canShowPestMenu) ||
      (activeStampMenu === 'object' && !canShowObjectMenu) ||
      (activeStampMenu === 'condition' && !canShowConditionMenu) ||
      (activeStampMenu === 'element' && !canShowElementMenu)
    ) {
      setActiveStampMenu(null);
    }
  }, [activeStampMenu, canShowConditionMenu, canShowElementMenu, canShowObjectMenu, canShowPestMenu]);

  // Close stamp picker when clicking outside the toolbar dock
  useEffect(() => {
    if (!activeStampMenu) return;
    const handler = (e: PointerEvent) => {
      if (toolbarDockRef.current && !toolbarDockRef.current.contains(e.target as Node)) {
        setActiveStampMenu(null);
      }
    };
    document.addEventListener('pointerdown', handler, { capture: true });
    return () => document.removeEventListener('pointerdown', handler, { capture: true });
  }, [activeStampMenu]);

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

  const closeStampFocus = useCallback(() => {
    stampFocusPendingRef.current = null;
    setSatFocusAnimating(true);
    setSatFocusTransform(null);
    setTimeout(() => {
      setSatFocusAnimating(false);
      setPestModalStampId(null);
    }, 420);
  }, []);

  const handleSheetReady = useCallback((sheetHeight: number) => {
    const pending = stampFocusPendingRef.current;
    if (!pending || !mapRef.current) return;
    stampFocusPendingRef.current = null;
    const canvasRect = mapRef.current.getBoundingClientRect();
    const { stampX, stampY } = pending;
    const cx = canvasRect.width / 2;
    const cy = canvasRect.height / 2;
    const s = 1.5;
    // Center stamp in the visible canvas area above the modal sheet
    const sheetTopInViewport = window.innerHeight - sheetHeight;
    const visibleBottom = Math.min(canvasRect.bottom, sheetTopInViewport) - canvasRect.top;
    const targetY = Math.max(40, visibleBottom / 2);
    const tx = -(stampX - cx) * s;
    const ty = targetY - cy - (stampY - cy) * s;
    setSatFocusAnimating(true);
    setSatFocusTransform({ scale: s, tx, ty });
  }, []);

  return (
    <>
    <div className={styles.mapStepContent}>
      <div className={styles.mapCanvasCard}>
        <div ref={mapRef} className={styles.mapInteractiveCanvas}>
          <div
            style={{
              width: '100%',
              height: '100%',
              position: 'relative',
              transform: satFocusTransform
                ? `translate(${satFocusTransform.tx}px, ${satFocusTransform.ty}px) scale(${satFocusTransform.scale})`
                : 'none',
              transition: satFocusAnimating ? 'transform 0.4s ease' : 'none',
              transformOrigin: 'center center',
            }}
          >
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
                mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? 'DEMO_MAP_ID'}
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
            {!satFocusTransform && <div className={styles.mapLegendControls}>
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
            </div>}
            {!satFocusTransform && <div className={styles.mapViewControls}>
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
		              {isSatelliteMode && !mapPlotData.isViewSet && (
		                <>
		                  <button
		                    type="button"
		                    className={`${styles.mapIconBtn} ${styles.mapRotateBtn}`}
		                    onClick={() => {
		                      const newHeading = ((mapPlotData.heading ?? 0) - 15 + 360) % 360;
		                      updateMapPlotData({ heading: newHeading });
		                    }}
		                    title="Rotate Left 15°"
		                    aria-label="Rotate Left 15°"
		                  >
		                    <RotateCcw size={16} />
		                  </button>
		                  <button
		                    type="button"
		                    className={`${styles.mapIconBtn} ${styles.mapRotateBtn}`}
		                    onClick={() => {
		                      const newHeading = ((mapPlotData.heading ?? 0) + 15) % 360;
		                      updateMapPlotData({ heading: newHeading });
		                    }}
		                    title="Rotate Right 15°"
		                    aria-label="Rotate Right 15°"
		                  >
		                    <RotateCw size={16} />
		                  </button>
		                </>
		              )}
		            </div>
		          </div>}

          {pestModalStampId && <div className={styles.mapStampModalDimmer} />}

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
            <svg
              className={styles.mapSvgOverlay}
              viewBox={canvasSize.width > 0 ? `0 0 ${canvasSize.width} ${canvasSize.height}` : '0 0 1 1'}
              preserveAspectRatio="none"
            >
              <defs>
                <filter id="nodeShadow" x="-60%" y="-60%" width="220%" height="220%">
                  <feDropShadow
                    dx="0"
                    dy={isBlankGridMode ? 2 / blankGridScale : 2}
                    stdDeviation={isBlankGridMode ? 4 / blankGridScale : 4}
                    floodColor="rgba(0,0,0,0.4)"
                  />
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
                  ? Math.max(50, selectedSegmentLabel.length * 8 + 18)
                  : 0;
                const W = canvasSize.width;
                const H = canvasSize.height;
                // p.x/y are normalized (0-1) draw-time coords. Render proportionally to current canvas.
                // xGrid/yGrid are only used for stable measurements, not rendering.
                const gx = (p: { x: number }) => p.x * W;
                const gy = (p: { y: number }) => p.y * H;
                const sw = isBlankGridMode
                  ? (isActive ? 2 / blankGridScale : 1.5 / blankGridScale)
                  : (isActive ? 2 : 1.5);
                const isFence = outline.type === 'fence';
                // For fence: total length of open polyline; for closed outlines: perimeter
                const perimeterFt = (isFence ? showDimensions && outline.points.length >= 2 : outline.isClosed && showDimensions)
                  ? getOutlineSegmentDimensions(outline).reduce((sum, seg) => sum + seg.feet, 0)
                  : null;
                // For fence label position: average of all points (midpoint of polyline)
                const fenceLabelCenter = isFence && perimeterFt !== null && outline.points.length >= 2
                  ? {
                      x: outline.points.reduce((s, p) => s + p.x, 0) / outline.points.length,
                      y: outline.points.reduce((s, p) => s + p.y, 0) / outline.points.length,
                    }
                  : null;
                const dash = isFence ? 'none'
                  : outline.isClosed ? 'none'
                  : isBlankGridMode ? `${12 / blankGridScale} ${6 / blankGridScale}` : '12 6';
                return (
                  <g key={outline.id}>
                    {outline.points.length >= 2 && (
                      !isFence && outline.points.length >= 3 ? (
                        <polygon
                          points={outline.points.map(p => `${gx(p)},${gy(p)}`).join(' ')}
                          fill={outline.isClosed ? metrics.fillColor : 'none'}
                          stroke={metrics.strokeColor}
                          strokeWidth={sw}
                          strokeDasharray={dash}
                          strokeLinejoin="round"
                        />
                      ) : (
                        <polyline
                          points={outline.points.map(p => `${gx(p)},${gy(p)}`).join(' ')}
                          fill="none"
                          stroke={metrics.strokeColor}
                          strokeWidth={sw}
                          strokeDasharray={dash}
                          strokeLinejoin="round"
                          strokeLinecap="round"
                        />
                      )
                    )}

                    {shouldShowOutlineText && metrics.centroid && (
                      <g transform={isBlankGridMode
                        ? `translate(${metrics.centroid.x * W}, ${metrics.centroid.y * H}) scale(${1 / blankGridScale})`
                        : `translate(${metrics.centroid.x * W}, ${metrics.centroid.y * H})`}
                      >
                        <text
                          x={0}
                          y={0}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className={styles.mapHomeFootprintText}
                          style={{ fill: metrics.strokeColor }}
                        >
                          {showLegendLabels && (
                            <tspan x={0} dy={showAreaLabel ? '-12' : '0'}>
                              {metrics.label}
                            </tspan>
                          )}
                          {showAreaLabel && (
                            <tspan x={0} dy={showLegendLabels ? '16' : '0'}>
                              {`${Math.round(metrics.areaSqFt ?? 0).toLocaleString()} sq ft`}
                            </tspan>
                          )}
                          {perimeterFt != null && perimeterFt > 0 && (
                            <tspan x={0} dy="16">
                              {`~${Math.round(perimeterFt).toLocaleString()} linear ft`}
                            </tspan>
                          )}
                        </text>
                      </g>
                    )}

                    {/* Fence linear feet label */}
                    {fenceLabelCenter && perimeterFt !== null && perimeterFt > 0 && (
                      <g transform={isBlankGridMode
                        ? `translate(${fenceLabelCenter.x * W}, ${fenceLabelCenter.y * H}) scale(${1 / blankGridScale})`
                        : `translate(${fenceLabelCenter.x * W}, ${fenceLabelCenter.y * H})`}
                      >
                        <text
                          x={0}
                          y={0}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className={styles.mapHomeFootprintText}
                          style={{ fill: metrics.strokeColor }}
                        >
                          <tspan x={0}>{`~${Math.round(perimeterFt).toLocaleString()} linear ft`}</tspan>
                        </text>
                      </g>
                    )}

                    {canRenderDimensions && selectedSegment && (
                      <>
                        <line
                          x1={selectedSegment.x1 * W}
                          y1={selectedSegment.y1 * H}
                          x2={selectedSegment.x2 * W}
                          y2={selectedSegment.y2 * H}
                          stroke="rgba(255,255,255,0.96)"
                          strokeWidth={isBlankGridMode ? 5 / blankGridScale : 5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <line
                          x1={selectedSegment.x1 * W}
                          y1={selectedSegment.y1 * H}
                          x2={selectedSegment.x2 * W}
                          y2={selectedSegment.y2 * H}
                          stroke={metrics.strokeColor}
                          strokeWidth={isBlankGridMode ? 2.5 / blankGridScale : 2.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <g transform={isBlankGridMode
                          ? `translate(${selectedSegment.x * W} ${selectedSegment.y * H}) scale(${1 / blankGridScale})`
                          : `translate(${selectedSegment.x * W} ${selectedSegment.y * H})`}
                        >
                          <rect
                            x={-selectedSegmentBubbleWidth / 2}
                            y={-11}
                            width={selectedSegmentBubbleWidth}
                            height={22}
                            rx="9"
                            ry="9"
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

                    {(!outline.isClosed || isActive) && (!isFence || isActive) && outline.points.slice(1).map((point, i) => (
                      <circle
                        key={`${outline.id}-mid-${i + 1}`}
                        cx={gx(point)}
                        cy={gy(point)}
                        r={isBlankGridMode ? 5 / blankGridScale : 5}
                        fill="white"
                        stroke={outline.isClosed ? metrics.strokeColor : '#2563eb'}
                        strokeWidth={isBlankGridMode ? 2 / blankGridScale : 2}
                        filter="url(#nodeShadow)"
                      />
                    ))}

                    {(!outline.isClosed || isActive) && (!isFence || isActive) && outline.points.length >= 1 && (
                      <>
                        {isActive && !outline.isClosed && snapToFirst && (
                          <circle
                            cx={gx(outline.points[0])}
                            cy={gy(outline.points[0])}
                            r={isBlankGridMode ? 18 / blankGridScale : 18}
                            fill="none"
                            stroke={isFence ? '#22c55e' : '#f97316'}
                            strokeWidth={isBlankGridMode ? 2 / blankGridScale : 2}
                            className={styles.mapSnapRing}
                          />
                        )}
                        <circle
                          cx={gx(outline.points[0])}
                          cy={gy(outline.points[0])}
                          r={isBlankGridMode
                            ? (outline.isClosed ? 6 : (isFence ? outline.points.length >= 2 : outline.points.length >= 3) ? 7 : 5) / blankGridScale
                            : (outline.isClosed ? 6 : (isFence ? outline.points.length >= 2 : outline.points.length >= 3) ? 7 : 5)}
                          fill="white"
                          stroke={outline.isClosed ? metrics.strokeColor : (isFence ? outline.points.length >= 2 : outline.points.length >= 3) ? (isFence ? '#22c55e' : '#f97316') : '#2563eb'}
                          strokeWidth={isBlankGridMode ? 2.5 / blankGridScale : 2.5}
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
              const isConditionStamp = option.category === 'condition';
              const isBaitStation = stamp.type === 'sentricon-bait-station';
              const isActiveStamp = stamp.id === pestModalStampId;
              const stampScale = (isBlankGridMode ? (1 / blankGridScale) * BLANK_GRID_STAMP_SCALE : 1) * satelliteStampScale;

              let stampIcon: React.ReactNode;
              if (isBaitStation) {
                stampIcon = <PlotObjectBlueprintGlyph type="sentricon-bait-station" />;
              } else if (isConditionStamp) {
                stampIcon = <ConditionStampGlyph />;
              } else if (isObjectStamp) {
                stampIcon = <PlotObjectBlueprintGlyph type={stamp.type as MapObjectStampType} />;
              } else if (stamp.type === 'dynamic-pest') {
                const pestOption = companyPestOptions.find(o => o.id === stamp.pestId);
                if (pestOption?.icon_svg) {
                  stampIcon = <span className={styles.mapStampDynamicIcon} dangerouslySetInnerHTML={{ __html: pestOption.icon_svg }} />;
                } else {
                  stampIcon = <MapStampGlyph type={stamp.type} size={18} />;
                }
              } else {
                stampIcon = <MapStampGlyph type={stamp.type} size={18} />;
              }

              return (
                <button
                  key={stamp.id}
                  type="button"
                  className={`${styles.mapStamp} ${isPestStamp || isBaitStation || isConditionStamp ? styles.mapStampPest : ''} ${isObjectStamp && !isBaitStation ? styles.mapStampObject : ''} ${isActiveStamp ? styles.mapStampActive : ''} ${isSatelliteMode && !isActiveStamp && (isPestStamp || isBaitStation || isConditionStamp) ? styles.mapStampNoBorder : ''}`}
                  style={{
                    left: `${stamp.x * 100}%`,
                    top: `${stamp.y * 100}%`,
                    transform: `translate(-50%, -50%) rotate(${stamp.rotation ?? 0}deg) scale(${stampScale})`,
                    ...(pestModalStampId && (isPestStamp || isBaitStation || isConditionStamp) ? { opacity: 1 } : {}),
                    ...(!isActiveStamp && isConditionStamp
                      ? { color: 'var(--UI-Alert-500, #FD484F)' }
                      : !isActiveStamp && (isPestStamp || isBaitStation)
                      ? { color: stampColor ?? 'var(--blue-500, #0075de)' }
                      : !isActiveStamp && isObjectStamp
                      ? { color: '#ffffff' }
                      : !isActiveStamp
                      ? { backgroundColor: option.color, color: '#ffffff' }
                      : {}),
                  }}
                  title={isObjectStamp ? `${option.label} — click to rotate` : (stamp.displayLabel || option.label)}
                  onPointerDown={event => handleStampPointerDown(stamp.id, event)}
                  onPointerMove={event => handleStampPointerMove(stamp.id, event)}
                  onPointerUp={stopDragging}
                  onPointerCancel={stopDragging}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (dragMovedRef.current) return;
                    if (isObjectStamp && !isBaitStation) {
                      updateMapPlotData({
                        stamps: mapPlotData.stamps.map(s =>
                          s.id === stamp.id
                            ? { ...s, rotation: ((s.rotation ?? 0) + 45) % 360 }
                            : s
                        ),
                      });
                    } else if (isPestStamp || isConditionStamp || isBaitStation) {
                      if (mapRef.current) {
                        const canvasRect = mapRef.current.getBoundingClientRect();
                        const btnRect = event.currentTarget.getBoundingClientRect();
                        stampFocusPendingRef.current = {
                          stampX: btnRect.left + btnRect.width / 2 - canvasRect.left,
                          stampY: btnRect.top + btnRect.height / 2 - canvasRect.top,
                        };
                      }
                      setPestModalStampId(stamp.id);
                    }
                  }}
                >
                  {stampIcon}
                </button>
              );
            })}
          </div>

          {!satFocusTransform && <div className={styles.mapToolbarDock} ref={toolbarDockRef}>
            {canRenderActiveStampMenu && activeStampMenu && (
              <div
                className={`${styles.mapStampPicker} ${activeStampMenu === 'pest' ? styles.mapStampPickerPest : ''} ${activeStampMenu === 'condition' ? styles.mapStampPickerCondition : ''}`}
                role="menu"
                aria-label={
                  activeStampMenu === 'pest'
                    ? 'Pest stamps'
                    : activeStampMenu === 'object'
                    ? 'Object stamps'
                    : activeStampMenu === 'condition'
                    ? 'Condition stamps'
                    : 'Element stamps'
                }
              >
                {activeStampMenu === 'pest' ? (
                  companyPestOptions.length > 0 ? (
                    companyPestOptions.map(option => (
                      <button
                        key={option.id}
                        type="button"
                        className={`${styles.mapIconBtn} ${styles.mapPickerBtn} ${styles.mapPickerBtnLabeled} ${mapPlotData.selectedStampType === 'dynamic-pest' && selectedDynamicPestOption?.id === option.id ? styles.mapIconBtnActive : ''}`}
                        onClick={() => {
                          activateDynamicPestTool(option);
                          setActiveStampMenu(null);
                        }}
                        title={option.custom_label}
                        aria-label={option.custom_label}
                      >
                        {option.icon_svg ? (
                          <span className={styles.mapStampDynamicIcon} dangerouslySetInnerHTML={{ __html: option.icon_svg }} />
                        ) : (
                          <MapStampGlyph type="dynamic-pest" size={18} />
                        )}
                        <span className={styles.mapPickerBtnLabel}>{option.custom_label}</span>
                      </button>
                    ))
                  ) : (
                    MAP_PEST_STAMP_OPTIONS.map(option => (
                      <button
                        key={option.type}
                        type="button"
                        className={`${styles.mapIconBtn} ${styles.mapPickerBtn} ${styles.mapPickerBtnLabeled} ${mapPlotData.selectedStampType === option.type ? styles.mapIconBtnActive : ''}`}
                        onClick={() => {
                          activatePestTool(option.type as MapPestStampType);
                          setActiveStampMenu(null);
                        }}
                        title={option.label}
                        aria-label={option.label}
                      >
                        <MapStampGlyph type={option.type} size={22} />
                        <span className={styles.mapPickerBtnLabel}>{option.label}</span>
                      </button>
                    ))
                  )
                ) : (
                  (activeStampMenu === 'object' ? MAP_OBJECT_STAMP_OPTIONS : MAP_ELEMENT_STAMP_OPTIONS).map(option => (
                    <button
                      key={option.type}
                      type="button"
                      className={`${styles.mapIconBtn} ${styles.mapPickerBtn} ${styles.mapPickerBtnLabeled} ${mapPlotData.selectedStampType === option.type ? styles.mapIconBtnActive : ''}`}
                      onClick={() => {
                        if (activeStampMenu === 'object') {
                          activateObjectTool(option.type as MapObjectStampType);
                        } else {
                          activateElementTool(option.type as MapElementStampType);
                        }
                        setActiveStampMenu(null);
                      }}
                      title={option.label}
                      aria-label={option.label}
                    >
                      <MapStampGlyph type={option.type} size={22} />
                      <span className={styles.mapPickerBtnLabel}>{option.label}</span>
                    </button>
                  ))
                )}
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
                  className={`${styles.mapIconBtn} ${styles.mapToggleFirst} ${mapPlotData.drawTool === 'outline' ? styles.mapIconBtnActive : ''}`}
                  onClick={() => updateMapPlotData({ drawTool: 'outline', selectedStampType: selectedElementType })}
                  disabled={!mapPlotData.isViewSet}
                  title="Outline Tool"
                  aria-label="Outline Tool"
                >
                  <Move3d size={16} />
                </button>
                <button
                  type="button"
                  className={`${styles.mapIconBtn} ${styles.mapToggleLast} ${mapPlotData.drawTool === 'stamp' ? styles.mapIconBtnActive : ''}`}
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
              </div>

              {canShowPestMenu && (
                <div className={styles.mapToolToggle}>
                  <button
                    type="button"
                    className={`${styles.mapIconBtn} ${styles.mapToggleFirst} ${styles.mapStampTypeBtn} ${isPestSelected || activeStampMenu === 'pest' ? styles.mapIconBtnActive : ''}`}
                    onClick={() => {
                      if (selectedDynamicPestOption) {
                        activateDynamicPestTool(selectedDynamicPestOption);
                      } else {
                        activatePestTool(selectedPestType);
                      }
                      setActiveStampMenu(prev => (prev === 'pest' ? null : 'pest'));
                    }}
                    title="Pest Stamps"
                    aria-label="Pest Stamps"
                  >
                    {selectedDynamicPestOption?.icon_svg ? (
                      <span className={styles.mapStampDynamicIcon} dangerouslySetInnerHTML={{ __html: selectedDynamicPestOption.icon_svg }} />
                    ) : (
                      <MapStampGlyph type={selectedPestType} size={18} />
                    )}
                  </button>
                  <button
                    type="button"
                    className={`${styles.mapIconBtn} ${styles.mapStampTypeBtn} ${isObjectSelected || activeStampMenu === 'object' ? styles.mapIconBtnActive : ''}`}
                    onClick={() => {
                      activateObjectTool(selectedObjectType);
                      setActiveStampMenu(prev => (prev === 'object' ? null : 'object'));
                    }}
                    title="Object Stamps"
                    aria-label="Object Stamps"
                  >
                    <MapStampGlyph type={selectedObjectType} size={18} />
                  </button>
                  {canShowConditionMenu && (
                    <button
                      type="button"
                      className={`${styles.mapIconBtn} ${styles.mapToggleLast} ${styles.mapStampTypeBtn} ${isConditionSelected ? styles.mapIconBtnActive : ''}`}
                      onClick={() => {
                        activateConditionTool('other-condition');
                        setActiveStampMenu(null);
                      }}
                      title="Conducive Condition"
                      aria-label="Conducive Condition"
                    >
                      <ConditionStampGlyph />
                    </button>
                  )}
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
          </div>}

          </div>{/* end inner CSS-transform wrapper */}
        </div>
      </div>
    </div>

    {pestModalStampId && mapPlotData.stamps.find(s => s.id === pestModalStampId) && (
      <PestStampModal
        stamp={mapPlotData.stamps.find(s => s.id === pestModalStampId)!}
        companyId={companyId}
        iconSvg={companyPestOptions.find(o => o.id === mapPlotData.stamps.find(s => s.id === pestModalStampId)?.pestId)?.icon_svg ?? null}
        onSave={(id, notes, photoUrls, customConditionText) => {
          updateMapPlotData({
            stamps: mapPlotData.stamps.map(s =>
              s.id === id ? { ...s, notes, photoUrls, ...(customConditionText != null ? { customConditionText } : {}) } : s
            ),
          });
          closeStampFocus();
        }}
        onDelete={(id) => {
          updateMapPlotData({
            stamps: mapPlotData.stamps.filter(s => s.id !== id),
          });
          closeStampFocus();
        }}
        onClose={() => closeStampFocus()}
        onSheetReady={handleSheetReady}
      />
    )}
  </>
  );
}


export interface MapPlotCanvasProps {
  mapPlotData: MapPlotData;
  onChange: (next: MapPlotData) => void;
  companyId?: string;
  googleMapsApiKey?: string | null;
  isReadOnly?: boolean;
  onBack?: () => void;
  onNext?: () => void;
  canNext?: boolean;
  stampColor?: string;
}

interface StaticMapProjectionContext {
  centerLat: number;
  centerLng: number;
  zoom: number;
  width: number;
  height: number;
}

const STATIC_MAP_MAX_DIMENSION = 640;
const SATELLITE_STAMP_BASE_ZOOM = 20;
const SATELLITE_STAMP_MIN_SCALE = 0.4;
const SATELLITE_STAMP_MAX_SCALE = 0.75;
const BLANK_GRID_STAMP_SCALE = 0.75;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function getSatelliteStampScale(zoom: number): number {
  const safeZoom = Number.isFinite(zoom) ? zoom : SATELLITE_STAMP_BASE_ZOOM;
  const scaled = 1 + (safeZoom - SATELLITE_STAMP_BASE_ZOOM) * 0.11;
  return Math.max(SATELLITE_STAMP_MIN_SCALE, Math.min(SATELLITE_STAMP_MAX_SCALE, scaled));
}

function latLngToWorldPoint(lat: number, lng: number): { x: number; y: number } {
  const clampedLat = Math.max(-85.05112878, Math.min(85.05112878, lat));
  const sinLat = Math.sin((clampedLat * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * 256,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * 256,
  };
}

function projectLatLngToStaticPixel(
  lat: number,
  lng: number,
  context: StaticMapProjectionContext
): { x: number; y: number } {
  const scale = Math.pow(2, context.zoom);
  const worldSize = 256 * scale;
  const centerWorld = latLngToWorldPoint(context.centerLat, context.centerLng);
  const pointWorld = latLngToWorldPoint(lat, lng);

  let deltaX = (pointWorld.x - centerWorld.x) * scale;
  if (deltaX > worldSize / 2) deltaX -= worldSize;
  if (deltaX < -worldSize / 2) deltaX += worldSize;

  const deltaY = (pointWorld.y - centerWorld.y) * scale;
  return {
    x: context.width / 2 + deltaX,
    y: context.height / 2 + deltaY,
  };
}

function ReadOnlySummary({ mapPlotData, companyId, stampColor }: { mapPlotData: MapPlotData; companyId?: string; stampColor?: string }) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [selectedStampId, setSelectedStampId] = useState<string | null>(null);
  const previewFrameRef = useRef<HTMLDivElement>(null);
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });
  const [pestIconMap, setPestIconMap] = useState<Record<string, string>>({});

  // ── Gesture + zoom state for the read-only map ─────────────────────────────
  const [roTransform, setRoTransform] = useState({ scale: 2, tx: 0, ty: 0, rotation: mapPlotData.heading ?? 0 });
  const [roAnimating, setRoAnimating] = useState(false);
  const roSavedTransform = useRef<{ scale: number; tx: number; ty: number; rotation: number } | null>(null);
  const roGesture = useRef<{
    pointers: Map<number, { x: number; y: number }>;
    lastDist: number | null;
    lastAngle: number | null;
    pan: { pointerId: number; startX: number; startY: number; startTx: number; startTy: number } | null;
    moved: boolean;
  }>({
    pointers: new globalThis.Map(),
    lastDist: null,
    lastAngle: null,
    pan: null,
    moved: false,
  });
  // Keep a ref in sync so gesture handlers always read the latest transform
  const roTransformRef = useRef(roTransform);
  useEffect(() => { roTransformRef.current = roTransform; }, [roTransform]);

  const handleRoPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Don't capture when the touch started on a stamp button — we need
    // the browser to fire the click event on the button naturally.
    if (!(e.target as HTMLElement).closest('button')) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    setRoAnimating(false);
    const g = roGesture.current;
    g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (g.pointers.size === 1) {
      g.moved = false;
      g.pan = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startTx: roTransformRef.current.tx,
        startTy: roTransformRef.current.ty,
      };
    } else if (g.pointers.size === 2) {
      g.pan = null;
      const vals = Array.from(g.pointers.values());
      const dx = vals[1].x - vals[0].x;
      const dy = vals[1].y - vals[0].y;
      g.lastDist = Math.hypot(dx, dy);
      g.lastAngle = Math.atan2(dy, dx) * (180 / Math.PI);
    }
  };

  const handleRoPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = roGesture.current;
    if (!g.pointers.has(e.pointerId)) return;
    g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (g.pointers.size === 1 && g.pan && g.pan.pointerId === e.pointerId) {
      const pan = g.pan;
      const dx = e.clientX - pan.startX;
      const dy = e.clientY - pan.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) g.moved = true;
      setRoTransform(prev => {
        const maxTx = previewSize.width * (prev.scale - 1) / 2;
        const maxTy = previewSize.height * (prev.scale - 1) / 2;
        return {
          ...prev,
          tx: Math.max(-maxTx, Math.min(maxTx, pan.startTx + dx)),
          ty: Math.max(-maxTy, Math.min(maxTy, pan.startTy + dy)),
        };
      });
    } else if (g.pointers.size === 2) {
      const vals = Array.from(g.pointers.values());
      const dx = vals[1].x - vals[0].x;
      const dy = vals[1].y - vals[0].y;
      const dist = Math.hypot(dx, dy);
      const scaleDelta = g.lastDist && g.lastDist > 0 ? dist / g.lastDist : 1;

      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      let angleDelta = 0;
      if (g.lastAngle !== null) {
        angleDelta = angle - g.lastAngle;
        // Normalize to [-180, 180] to prevent jumps at the ±180° boundary
        angleDelta = ((angleDelta + 540) % 360) - 180;
      }
      g.lastAngle = angle;

      setRoTransform(prev => {
        const newScale = Math.max(1, Math.min(8, prev.scale * scaleDelta));
        const maxTx = previewSize.width * (newScale - 1) / 2;
        const maxTy = previewSize.height * (newScale - 1) / 2;
        return {
          scale: newScale,
          tx: Math.max(-maxTx, Math.min(maxTx, prev.tx)),
          ty: Math.max(-maxTy, Math.min(maxTy, prev.ty)),
          rotation: prev.rotation + angleDelta,
        };
      });
      g.lastDist = dist;
    }
  };

  const handleRoPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = roGesture.current;
    g.pointers.delete(e.pointerId);
    if (g.pointers.size < 2) { g.lastDist = null; g.lastAngle = null; }
    if (g.pointers.size === 0) { g.pan = null; }
  };

  const handleRoWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    setRoAnimating(false);
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    setRoTransform(prev => {
      const newScale = Math.max(1, Math.min(8, prev.scale * factor));
      const maxTx = previewSize.width * (newScale - 1) / 2;
      const maxTy = previewSize.height * (newScale - 1) / 2;
      return {
        ...prev,
        scale: newScale,
        tx: Math.max(-maxTx, Math.min(maxTx, prev.tx)),
        ty: Math.max(-maxTy, Math.min(maxTy, prev.ty)),
      };
    });
  };

  const focusRoStamp = (stampId: string, point: { x: number; y: number }) => {
    if (roGesture.current.moved) return;
    // Snapshot current transform for animated return
    roSavedTransform.current = { ...roTransformRef.current };
    const cx = previewSize.width / 2;
    const cy = previewSize.height / 2;
    const t = roTransformRef.current;
    const targetScale = Math.min(t.scale * 2, 4);
    const targetTx = -(targetScale * (point.x - cx));
    const targetTy = -(targetScale * (point.y - cy));
    setRoAnimating(true);
    setRoTransform(prev => ({ ...prev, scale: targetScale, tx: targetTx, ty: targetTy }));
    setSelectedStampId(stampId);
  };

  const closeRoModal = () => {
    if (roSavedTransform.current) {
      setRoAnimating(true);
      setRoTransform(roSavedTransform.current);
      roSavedTransform.current = null;
    }
    setSelectedStampId(null);
  };

  useEffect(() => {
    fetch('/api/google-places-key')
      .then(r => r.ok ? r.json() : null)
      .then((d: { apiKey?: string } | null) => { if (d?.apiKey) setApiKey(d.apiKey); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!companyId) return;
    fetch(`/api/pest-options/${companyId}`)
      .then(r => r.ok ? r.json() : null)
      .then((d: { data?: Array<{ id: string; icon_svg?: string | null }> } | null) => {
        if (!d?.data) return;
        const map: Record<string, string> = {};
        for (const opt of d.data) {
          if (opt.icon_svg) map[opt.id] = opt.icon_svg;
        }
        setPestIconMap(map);
      })
      .catch(() => {});
  }, [companyId]);

  useEffect(() => {
    const container = previewFrameRef.current;
    if (!container) return;

    const updateSize = () => {
      const nextWidth = container.clientWidth;
      const nextHeight = container.clientHeight;
      setPreviewSize(current =>
        current.width === nextWidth && current.height === nextHeight
          ? current
          : { width: nextWidth, height: nextHeight }
      );
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const centerLat = getMapLatitude(mapPlotData);
  const centerLng = getMapLongitude(mapPlotData);
  const hasCoords = centerLat !== null && centerLng !== null;
  const previewZoom = Math.max(Math.min(Math.round(mapPlotData.zoom ?? 20), 20), MAP_MIN_ZOOM);
  // Request static map 1 zoom level wider so there's geographic area to pan/zoom around.
  // Initial CSS scale (2×) compensates so the user sees the same view they saved.
  const wideZoom = Math.max(previewZoom - 1, MAP_MIN_ZOOM);
  const readOnlyStampScale = getSatelliteStampScale(previewZoom);
  const stampCount = mapPlotData.stamps.length;
  const outlineCount = mapPlotData.outlines.length;

  const staticRequestSize = useMemo(() => {
    if (previewSize.width <= 0 || previewSize.height <= 0) return null;
    const scale = Math.min(1, STATIC_MAP_MAX_DIMENSION / Math.max(previewSize.width, previewSize.height));
    return {
      width: Math.max(1, Math.round(previewSize.width * scale)),
      height: Math.max(1, Math.round(previewSize.height * scale)),
    };
  }, [previewSize.height, previewSize.width]);

  const projectionContext = useMemo<StaticMapProjectionContext | null>(() => {
    if (
      centerLat === null ||
      centerLng === null ||
      !staticRequestSize
    ) {
      return null;
    }
    return {
      centerLat,
      centerLng,
      zoom: wideZoom,
      width: staticRequestSize.width,
      height: staticRequestSize.height,
    };
  }, [centerLat, centerLng, previewZoom, staticRequestSize]);

  const staticMapUrl = hasCoords && apiKey && staticRequestSize ? (() => {
    const params = new URLSearchParams({
      center: `${centerLat},${centerLng}`,
      zoom: String(wideZoom),
      size: `${staticRequestSize.width}x${staticRequestSize.height}`,
      maptype: 'satellite',
      scale: '2',
      key: apiKey,
    });
    return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
  })() : null;

  const previewOutlines = useMemo(() => {
    if (
      previewSize.width <= 0 ||
      previewSize.height <= 0 ||
      !staticRequestSize
    ) {
      return [];
    }

    return mapPlotData.outlines
      .map(outline => {
        const projectedPoints = outline.points
          .map(point => {
            if (
              projectionContext &&
              isFiniteNumber(point.lat) &&
              isFiniteNumber(point.lng)
            ) {
              const projected = projectLatLngToStaticPixel(point.lat, point.lng, projectionContext);
              return {
                x: (projected.x / staticRequestSize.width) * previewSize.width,
                y: (projected.y / staticRequestSize.height) * previewSize.height,
              };
            }
            if (!isFiniteNumber(point.x) || !isFiniteNumber(point.y)) return null;
            return {
              x: point.x * previewSize.width,
              y: point.y * previewSize.height,
            };
          })
          .filter((point): point is { x: number; y: number } => point !== null);

        if (projectedPoints.length < 2) return null;

        const option =
          MAP_ELEMENT_STAMP_OPTIONS.find(element => element.type === outline.type) ??
          MAP_ELEMENT_STAMP_OPTIONS[0];
        const strokeColor = outline.type === 'house' ? '#ef4444' : option.color;

        return {
          id: outline.id,
          points: projectedPoints,
          strokeColor,
          fillColor: hexToRgba(strokeColor, 0.12),
          isClosed: outline.isClosed,
        };
      })
      .filter((outline): outline is {
        id: string;
        points: Array<{ x: number; y: number }>;
        strokeColor: string;
        fillColor: string;
        isClosed: boolean;
      } => outline !== null);
  }, [mapPlotData.outlines, previewSize.height, previewSize.width, projectionContext, staticRequestSize]);

  const previewStamps = useMemo(() => {
    if (
      previewSize.width <= 0 ||
      previewSize.height <= 0 ||
      !staticRequestSize
    ) {
      return [];
    }

    return mapPlotData.stamps
      .map(stamp => {
        if (projectionContext && isFiniteNumber(stamp.lat) && isFiniteNumber(stamp.lng)) {
          const projected = projectLatLngToStaticPixel(stamp.lat, stamp.lng, projectionContext);
          return {
            stamp,
            point: {
              x: (projected.x / staticRequestSize.width) * previewSize.width,
              y: (projected.y / staticRequestSize.height) * previewSize.height,
            },
          };
        }
        if (!isFiniteNumber(stamp.x) || !isFiniteNumber(stamp.y)) return null;
        return {
          stamp,
          point: {
            x: stamp.x * previewSize.width,
            y: stamp.y * previewSize.height,
          },
        };
      })
      .filter((entry): entry is { stamp: MapPlotStamp; point: { x: number; y: number } } => entry !== null);
  }, [mapPlotData.stamps, previewSize.height, previewSize.width, projectionContext, staticRequestSize]);

  const selectedStamp = useMemo(
    () => mapPlotData.stamps.find(stamp => stamp.id === selectedStampId) ?? null,
    [mapPlotData.stamps, selectedStampId]
  );
  const selectedStampOption = selectedStamp ? getMapStampOption(selectedStamp.type) : null;
  const selectedStampHasDetails = Boolean(
    selectedStamp && (
      (selectedStamp.notes && selectedStamp.notes.trim().length > 0) ||
      (selectedStamp.photoUrls && selectedStamp.photoUrls.length > 0)
    )
  );

  useEffect(() => {
    if (!selectedStampId) return;
    if (!mapPlotData.stamps.some(stamp => stamp.id === selectedStampId)) {
      setSelectedStampId(null);
    }
  }, [mapPlotData.stamps, selectedStampId]);

  return (
    <>
      <div className={styles.readOnlyThumbnail}>
        <div
          ref={previewFrameRef}
          className={styles.readOnlyMapFrame}
          onPointerDown={handleRoPointerDown}
          onPointerMove={handleRoPointerMove}
          onPointerUp={handleRoPointerEnd}
          onPointerCancel={handleRoPointerEnd}
          onPointerLeave={handleRoPointerEnd}
          onWheel={handleRoWheel}
          style={{ cursor: 'grab', touchAction: 'none', overflow: 'hidden' }}
        >
          <div
            className={styles.readOnlyMapContent}
            style={{
              transform: `rotate(${roTransform.rotation}deg) translate(${roTransform.tx}px, ${roTransform.ty}px) scale(${roTransform.scale})`,
              transition: roAnimating ? 'transform 0.4s ease' : 'none',
              transformOrigin: 'center center',
              willChange: roAnimating ? 'transform' : 'auto',
              width: '100%',
              height: '100%',
            }}
            onTransitionEnd={() => setRoAnimating(false)}
          >
          {staticMapUrl ? (
            <>
              <img src={staticMapUrl} alt="Map preview" className={styles.readOnlyMapImg} />
              <div className={styles.readOnlyDarkOverlay} />
            </>
          ) : (
            <div className={styles.readOnlyPlaceholder}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span>Tap to view map</span>
            </div>
          )}

          {(previewOutlines.length > 0 || previewStamps.length > 0) && (
            <div className={styles.readOnlyMapOverlay}>
              {previewSize.width > 0 && previewSize.height > 0 && (
                <svg
                  className={styles.readOnlySvgOverlay}
                  viewBox={`0 0 ${previewSize.width} ${previewSize.height}`}
                  preserveAspectRatio="none"
                >
                  {previewOutlines.map(outline =>
                    outline.isClosed && outline.points.length >= 3 ? (
                      <polygon
                        key={outline.id}
                        points={outline.points.map(point => `${point.x},${point.y}`).join(' ')}
                        fill={outline.fillColor}
                        stroke={outline.strokeColor}
                        strokeWidth={2}
                        strokeLinejoin="round"
                      />
                    ) : (
                      <polyline
                        key={outline.id}
                        points={outline.points.map(point => `${point.x},${point.y}`).join(' ')}
                        fill="none"
                        stroke={outline.strokeColor}
                        strokeWidth={2}
                        strokeLinejoin="round"
                      />
                    )
                  )}
                </svg>
              )}

              <div className={styles.readOnlyStampLayer}>
                {previewStamps.map(({ stamp, point }) => {
                  const option = getMapStampOption(stamp.type);
                  const isPestStamp = option.category === 'pest';
                  const isObjectStamp = option.category === 'object';
                  const isConditionStamp = option.category === 'condition';
                  const hasDetails = Boolean(
                    (stamp.notes && stamp.notes.trim().length > 0) ||
                    (stamp.photoUrls && stamp.photoUrls.length > 0)
                  );

                  const isBaitStation = stamp.type === 'sentricon-bait-station';

                  let stampIcon: React.ReactNode;
                  if (isBaitStation) {
                    stampIcon = <PlotObjectBlueprintGlyph type="sentricon-bait-station" />;
                  } else if (isConditionStamp) {
                    stampIcon = <ConditionStampGlyph />;
                  } else if (isObjectStamp) {
                    stampIcon = <PlotObjectBlueprintGlyph type={stamp.type as MapObjectStampType} />;
                  } else if (stamp.type === 'dynamic-pest' && stamp.pestId) {
                    const iconSvg = pestIconMap[stamp.pestId];
                    stampIcon = iconSvg
                      ? <span className={styles.mapStampDynamicIcon} dangerouslySetInnerHTML={{ __html: iconSvg }} />
                      : <MapStampGlyph type={stamp.type} size={22} />;
                  } else {
                    stampIcon = <MapStampGlyph type={stamp.type} size={22} />;
                  }

                  return (
                    <button
                      key={stamp.id}
                      type="button"
                      className={`${styles.mapStamp} ${styles.readOnlyStamp} ${isPestStamp || isBaitStation || isConditionStamp ? styles.mapStampPest : ''} ${isObjectStamp && !isBaitStation ? styles.mapStampObject : ''}`}
                      style={{
                        left: `${point.x}px`,
                        top: `${point.y}px`,
                        transform: `translate(-50%, -50%) rotate(${stamp.rotation ?? 0}deg) scale(${readOnlyStampScale / roTransform.scale})`,
                        ...(isConditionStamp
                          ? { color: 'var(--UI-Alert-500, #FD484F)' }
                          : isPestStamp || isBaitStation
                          ? { color: stampColor ?? 'var(--blue-500, #0075de)' }
                          : isObjectStamp
                          ? { color: '#ffffff' }
                          : { backgroundColor: option.color, color: '#ffffff' }),
                      }}
                      title={hasDetails ? `${stamp.customConditionText || stamp.displayLabel || option.label} finding` : `${stamp.customConditionText || stamp.displayLabel || option.label} (no notes/photos)`}
                      onClick={() => focusRoStamp(stamp.id, point)}
                    >
                      {stampIcon}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          </div>{/* end readOnlyMapContent */}

          <div className={styles.readOnlyRotateControls}>
            <button
              type="button"
              className={styles.readOnlyRotateBtn}
              onClick={() => setRoTransform(prev => ({ ...prev, rotation: prev.rotation - 15 }))}
              title="Rotate Left 15°"
              aria-label="Rotate Left 15°"
            >
              <RotateCcw size={16} />
            </button>
            <button
              type="button"
              className={styles.readOnlyRotateBtn}
              onClick={() => setRoTransform(prev => ({ ...prev, rotation: prev.rotation + 15 }))}
              title="Rotate Right 15°"
              aria-label="Rotate Right 15°"
            >
              <RotateCw size={16} />
            </button>
          </div>
        </div>
      </div>

      {selectedStamp && selectedStampOption && (
        <div className={styles.readOnlyStampModal} role="dialog" aria-modal="true" aria-label="Stamp details">
          <div className={styles.readOnlyStampModalCard}>
            <div className={styles.readOnlyStampModalHeader}>
              <p className={styles.readOnlyStampModalTitle}>{selectedStamp.customConditionText || selectedStamp.displayLabel || selectedStampOption.label} Finding</p>
              <button
                type="button"
                className={styles.readOnlyStampModalClose}
                onClick={closeRoModal}
              >
                Close
              </button>
            </div>
            {selectedStamp.notes && selectedStamp.notes.trim().length > 0 ? (
              <p className={styles.readOnlyStampModalNotes}>{selectedStamp.notes}</p>
            ) : (
              <p className={styles.readOnlyStampModalEmpty}>No description added for this stamp.</p>
            )}
            {selectedStamp.photoUrls && selectedStamp.photoUrls.length > 0 ? (
              <div className={styles.readOnlyStampPhotoGrid}>
                {selectedStamp.photoUrls.map(url => (
                  <img
                    key={url}
                    src={url}
                    alt={`${selectedStampOption.label} photo`}
                    className={styles.readOnlyStampPhoto}
                  />
                ))}
              </div>
            ) : (
              !selectedStampHasDetails && (
                <p className={styles.readOnlyStampModalEmpty}>No photos added for this stamp.</p>
              )
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function MapPlotCanvas({
  mapPlotData,
  onChange,
  companyId,
  isReadOnly = false,
  onBack,
  onNext,
  canNext = true,
  stampColor,
}: MapPlotCanvasProps) {
  if (isReadOnly) {
    return <ReadOnlySummary mapPlotData={mapPlotData} companyId={companyId} stampColor={stampColor} />;
  }

  return (
    <StepMapPlot
      companyId={companyId ?? ''}
      mapPlotData={mapPlotData}
      onChange={onChange}
      onBack={onBack ?? (() => undefined)}
      onNext={onNext ?? (() => undefined)}
      canNext={canNext}
      stampColor={stampColor}
    />
  );
}
