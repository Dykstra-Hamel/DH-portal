'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import {
  LocateFixed,
  RotateCcw,
  RotateCw,
  Map as MapIcon,
  KeyRound,
} from 'lucide-react';
import { MapStampGlyph, PlotObjectBlueprintGlyph, ConditionStampGlyph, StationStampGlyph } from '@/components/FieldMap/MapPlot/glyphs';
import { PestStampModal } from '@/components/FieldMap/MapPlot/PestStampModal/PestStampModal';
import {
  BLANK_GRID_MAX_SCALE,
  BLANK_GRID_MIN_SCALE,
  clampNormalized,
  DEFAULT_CONDITION_TYPE,
  DEFAULT_ELEMENT_STAMP_TYPE,
  DEFAULT_OBJECT_STAMP_TYPE,
  DEFAULT_PEST_STAMP_TYPE,
  DEFAULT_STATION_STAMP_TYPE,
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
  isMapStationStampType,
  MAP_CONDITION_STAMP_OPTIONS,
  MAP_ELEMENT_STAMP_OPTIONS,
  MAP_MIN_ZOOM,
  MAP_OBJECT_STAMP_OPTIONS,
  MAP_PEST_STAMP_OPTIONS,
  MAP_STATION_STAMP_OPTIONS,
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
  type MapStationStampType,
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
  const [drawActive, setDrawActive] = useState(false);
  const [eraserActive, setEraserActive] = useState(false);
  const [erasedItems, setErasedItems] = useState<Array<
    | { kind: 'stamp'; item: MapPlotStamp }
    | { kind: 'outline'; item: MapElementOutline }
  >>([]);
  const [showTrashConfirm, setShowTrashConfirm] = useState(false);
  const [companyPestOptions, setCompanyPestOptions] = useState<CompanyPestOption[]>([]);
  const [selectedDynamicPestOption, setSelectedDynamicPestOption] = useState<CompanyPestOption | null>(null);
  const [blankGridScale, setBlankGridScale] = useState(1);
  const [blankGridOffset, setBlankGridOffset] = useState({ x: 0, y: 0 });
  const [satFocusTransform, setSatFocusTransform] = useState<{ scale: number; tx: number; ty: number } | null>(null);
  const [satFocusAnimating, setSatFocusAnimating] = useState(false);
  const stampFocusPendingRef = useRef<{ stampX: number; stampY: number } | null>(null);
  const mapPlotDataRef = useRef(mapPlotData);
  mapPlotDataRef.current = mapPlotData;
  const drawActiveRef = useRef(drawActive);
  drawActiveRef.current = drawActive;
  const dragMovedRef = useRef(false);
  const lastDragAtRef = useRef<number>(0);
  const stampLongPressRef = useRef<{ timerId: ReturnType<typeof setTimeout>; stampId: string } | null>(null);
  const stampDragArmedRef = useRef(false);
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
  const selectedStationStampType = isMapStationStampType(mapPlotData.selectedStationStampType)
    ? mapPlotData.selectedStationStampType
    : DEFAULT_STATION_STAMP_TYPE;
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
    if (!isBlankGridMode || drawActive || eraserActive) return;
    event.preventDefault();
    const scaleFactor = event.deltaY < 0 ? 1.08 : 1 / 1.08;
    applyBlankGridScaleAtClientPoint(scaleFactor, event.clientX, event.clientY);
  }, [applyBlankGridScaleAtClientPoint, drawActive, eraserActive, isBlankGridMode]);

  const handleBlankGridPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isBlankGridMode || drawActive || eraserActive) return;
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
  }, [blankGridOffset.x, blankGridOffset.y, drawActive, eraserActive, isBlankGridMode]);

  const handleBlankGridPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isBlankGridMode || drawActive || eraserActive) return;
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
  }, [applyBlankGridScaleAtClientPoint, blankGridScale, clampBlankGridOffset, drawActive, eraserActive, isBlankGridMode]);

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
    if (!drawActive && !eraserActive) return;
    blankGridPanRef.current = null;
    blankGridPinchRef.current.pointers.clear();
    blankGridPinchRef.current.lastDistance = null;
  }, [drawActive, eraserActive]);

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
    map = googleMapInstance,
    headingOverride?: number
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
    const headingRad = ((headingOverride ?? map.getHeading() ?? 0) * Math.PI) / 180;
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
    map = googleMapInstance,
    headingOverride?: number
  ): { stamps: MapPlotStamp[]; outlines: MapElementOutline[] } => {
    if (!isSatelliteMode || !map) return { stamps, outlines };

    return {
      stamps: stamps.map(stamp => {
        let stampLat = stamp.lat;
        let stampLng = stamp.lng;

        // Stamp was created in blank-grid mode — no geo coords yet.
        // Convert current x/y to lat/lng using the live satellite projection so
        // all future pan/zoom reprojections can anchor it correctly.
        if (!Number.isFinite(stampLat) || !Number.isFinite(stampLng)) {
          const geo = getLatLngFromNormalizedPoint({ x: stamp.x, y: stamp.y }, map);
          if (!geo) return stamp; // projection not ready yet, leave unchanged
          stampLat = geo.lat;
          stampLng = geo.lng;
        }

        const projected = getNormalizedPointFromLatLng(stampLat as number, stampLng as number, map, headingOverride);
        return projected
          ? { ...stamp, lat: stampLat, lng: stampLng, x: projected.x, y: projected.y }
          : { ...stamp, lat: stampLat, lng: stampLng };
      }),
      outlines: outlines.map(outline => ({
        ...outline,
        points: outline.points.map(point => {
          if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return point;
          const projected = getNormalizedPointFromLatLng(point.lat as number, point.lng as number, map, headingOverride);
          return projected ? { ...point, x: projected.x, y: projected.y } : point;
        }),
      })),
    };
  }, [getLatLngFromNormalizedPoint, getNormalizedPointFromLatLng, googleMapInstance, isSatelliteMode]);

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

  // Sync computed sqft/linearFt onto each outline so downstream consumers
  // (e.g. QuoteBuildStep) get values that exactly match the canvas labels.
  useEffect(() => {
    if (latitude === null) return;
    const metersPerPixel = getMetersPerPixel(latitude, mapPlotData.zoom);
    if (!Number.isFinite(metersPerPixel) || metersPerPixel <= 0) return;

    let changed = false;
    const updatedOutlines = mapPlotData.outlines.map(outline => {
      const isFence = outline.type === 'fence';
      const pts = outline.points;

      // Area (non-fence closed outlines only)
      let sqft: number | undefined;
      if (!isFence && outline.isClosed && pts.length >= 3) {
        let areaPx = 0;
        if (isBlankGridMode && pts.every(p => Number.isFinite(p.xGrid) && Number.isFinite(p.yGrid))) {
          let a = 0;
          for (let i = 0; i < pts.length; i++) {
            const j = (i + 1) % pts.length;
            a += (pts[i].xGrid! * 8) * (pts[j].yGrid! * 8);
            a -= (pts[j].xGrid! * 8) * (pts[i].yGrid! * 8);
          }
          areaPx = Math.abs(a) / 2;
        } else if (canvasSize.width > 0 && canvasSize.height > 0) {
          areaPx = getPolygonAreaInPixels(pts, canvasSize.width, canvasSize.height);
        }
        if (areaPx > 0) sqft = Math.round(areaPx * metersPerPixel * metersPerPixel * 10.76391041671);
      }

      // Perimeter (all closed outlines + open fence lines)
      let linearFt: number | undefined;
      const canPerimeter = outline.isClosed ? pts.length >= 3 : isFence && pts.length >= 2;
      if (canPerimeter) {
        const segCount = outline.isClosed ? pts.length : pts.length - 1;
        let total = 0;
        for (let i = 0; i < segCount; i++) {
          const start = pts[i];
          const end = pts[(i + 1) % pts.length];
          let dxPx: number, dyPx: number;
          if (isBlankGridMode && Number.isFinite(start.xGrid) && Number.isFinite(start.yGrid) &&
              Number.isFinite(end.xGrid) && Number.isFinite(end.yGrid)) {
            dxPx = (end.xGrid! - start.xGrid!) * 8;
            dyPx = (end.yGrid! - start.yGrid!) * 8;
          } else {
            dxPx = (end.x - start.x) * canvasSize.width;
            dyPx = (end.y - start.y) * canvasSize.height;
          }
          const feet = Math.hypot(dxPx, dyPx) * metersPerPixel * 3.280839895;
          if (Number.isFinite(feet) && feet > 0) total += feet;
        }
        linearFt = Math.round(total);
      }

      if (sqft === outline.sqft && linearFt === outline.linearFt) return outline;
      changed = true;
      return { ...outline, sqft, linearFt };
    });

    if (changed) updateMapPlotData({ outlines: updatedOutlines });
  }, [mapPlotData.outlines, latitude, mapPlotData.zoom, isBlankGridMode, canvasSize, updateMapPlotData]);

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // If view isn't set yet, kick it off now and proceed — stamp/outline creation
    // falls back gracefully when lat/lng anchoring isn't available yet.
    if (!mapPlotData.isViewSet && canSetView) setView();
    if (activeStampMenu) {
      setActiveStampMenu(null);
      return;
    }
    if (Date.now() - lastDragAtRef.current < 180) return;

    // Eraser mode: erase nearest stamp or outline
    if (eraserActive) {
      const pt = getNormalizedPoint(event.clientX, event.clientY);
      if (!pt) return;
      const canvasRect = mapRef.current?.getBoundingClientRect();
      if (!canvasRect) return;
      const hitStamp = mapPlotData.stamps.find(s => {
        const dx = (s.x - pt.x) * canvasRect.width;
        const dy = (s.y - pt.y) * canvasRect.height;
        return Math.sqrt(dx * dx + dy * dy) < 28;
      });
      if (hitStamp) {
        setErasedItems(prev => [...prev, { kind: 'stamp', item: hitStamp }]);
        updateMapPlotData({ stamps: mapPlotData.stamps.filter(s => s.id !== hitStamp.id) });
        return;
      }
      const hitOutline = mapPlotData.outlines.find(o => {
        const centroid = getPolygonCentroidNormalized(o.points);
        if (!centroid) return false;
        const dx = (centroid.x - pt.x) * canvasRect.width;
        const dy = (centroid.y - pt.y) * canvasRect.height;
        return Math.sqrt(dx * dx + dy * dy) < 40;
      });
      if (hitOutline) {
        setErasedItems(prev => [...prev, { kind: 'outline', item: hitOutline }]);
        updateMapPlotData({
          outlines: mapPlotData.outlines.filter(o => o.id !== hitOutline.id),
          activeOutlineId: mapPlotData.activeOutlineId === hitOutline.id ? null : mapPlotData.activeOutlineId,
        });
      }
      return;
    }

    if (!drawActive) {
      // Idle mode: tap a closed outline to select it (show nodes + measurements), tap outside to deselect
      const point = getNormalizedPoint(event.clientX, event.clientY);
      if (!point) return;
      const closedHit = [...mapPlotData.outlines]
        .reverse()
        .find(outline => outline.isClosed && isPointInPolygon(point, outline.points));
      if (closedHit) {
        updateMapPlotData({ activeOutlineId: closedHit.id });
      } else if (mapPlotData.activeOutlineId) {
        updateMapPlotData({ activeOutlineId: null });
      }
      return;
    }

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
    if (showDimensions) return;
    const idleSelectedClosed = !drawActive && !!mapPlotData.activeOutlineId && (mapPlotData.outlines.find(o => o.id === mapPlotData.activeOutlineId)?.isClosed ?? false);
    if (!idleSelectedClosed && (!drawActive || mapPlotData.drawTool !== 'outline')) return;

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

      // Close-outline gesture: for fence, tap last node; for others, tap first node
      const isFenceOutline = targetOutline.type === 'fence';
      const closeNodeIndex = isFenceOutline ? targetOutline.points.length - 1 : 0;
      const minPointsForClose = isFenceOutline ? 2 : 3;
      if (
        !targetOutline.isClosed &&
        hitNodeIndex === closeNodeIndex &&
        targetOutline.points.length >= minPointsForClose &&
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
    if (eraserActive) {
      const stamp = mapPlotData.stamps.find(s => s.id === stampId);
      if (stamp) {
        setErasedItems(prev => [...prev, { kind: 'stamp', item: stamp }]);
        updateMapPlotData({ stamps: mapPlotData.stamps.filter(s => s.id !== stampId) });
      }
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    dragMovedRef.current = false;
    stampDragArmedRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);

    // Clear any previous long-press timer
    if (stampLongPressRef.current) {
      clearTimeout(stampLongPressRef.current.timerId);
      stampLongPressRef.current = null;
    }

    // Arm drag only after a hold — short taps will trigger onClick instead
    const timerId = setTimeout(() => {
      stampDragArmedRef.current = true;
      stampLongPressRef.current = null;
      setDraggingStampId(stampId);
    }, 100);
    stampLongPressRef.current = { timerId, stampId };
  };

  const handleStampPointerMove = (stampId: string, event: React.PointerEvent<HTMLButtonElement>) => {
    if (showDimensions) return;

    // If drag isn't armed yet (long press hasn't fired), any movement cancels the timer
    if (!stampDragArmedRef.current) {
      if (stampLongPressRef.current) {
        clearTimeout(stampLongPressRef.current.timerId);
        stampLongPressRef.current = null;
      }
      return;
    }

    if (draggingStampId !== stampId) return;
    dragMovedRef.current = true;
    const point = getNormalizedPoint(event.clientX, event.clientY);
    if (!point) return;
    moveStamp(stampId, point.x, point.y);
  };

  const stopDragging = () => {
    if (stampLongPressRef.current) {
      clearTimeout(stampLongPressRef.current.timerId);
      stampLongPressRef.current = null;
    }
    stampDragArmedRef.current = false;
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

  // Keep a stable ref to setView so the auto-set effect below can call it without stale closures
  const setViewRef = useRef(setView);
  setViewRef.current = setView;

  // Auto-set view as soon as the map is ready — eliminates the need for a manual lock button.
  // Satellite: fires when the Google Maps instance becomes available.
  // Blank-grid: fires when the canvas has been measured.
  useEffect(() => {
    if (mapPlotDataRef.current.isViewSet) return;
    if (isSatelliteMode && googleMapInstance && hasCoordinates) {
      setViewRef.current();
    } else if (isBlankGridMode && canvasSize.width > 0) {
      setViewRef.current();
    }
  }, [isSatelliteMode, isBlankGridMode, googleMapInstance, hasCoordinates, canvasSize.width]);

  const onCameraChanged = (event: any) => {
    if (drawActiveRef.current) return;

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
    setDrawActive(true);
    updateMapPlotData({
      drawTool: 'stamp',
      selectedPestType: type,
      selectedStampType: type,
    });
  }, [updateMapPlotData]);

  const activateDynamicPestTool = useCallback((option: CompanyPestOption) => {
    setDrawActive(true);
    setSelectedDynamicPestOption(option);
    updateMapPlotData({
      drawTool: 'stamp',
      selectedPestType: 'dynamic-pest',
      selectedStampType: 'dynamic-pest',
    });
  }, [updateMapPlotData]);

  const activateObjectTool = useCallback((type: MapObjectStampType) => {
    setDrawActive(true);
    updateMapPlotData({
      drawTool: 'stamp',
      selectedObjectType: type,
      selectedStampType: type,
    });
  }, [updateMapPlotData]);

  const activateElementTool = useCallback((type: MapElementStampType) => {
    setDrawActive(true);
    updateMapPlotData({
      drawTool: 'outline',
      selectedElementType: type,
      selectedStampType: type,
      activeOutlineId: null,
    });
  }, [updateMapPlotData]);

  const activateConditionTool = useCallback((type: MapConditionStampType) => {
    setDrawActive(true);
    updateMapPlotData({
      drawTool: 'stamp',
      selectedConditionType: type,
      selectedStampType: type,
    });
  }, [updateMapPlotData]);

  const activateStationTool = useCallback((type: MapStationStampType) => {
    setDrawActive(true);
    updateMapPlotData({
      drawTool: 'stamp',
      selectedStationStampType: type,
      selectedStampType: type,
    });
  }, [updateMapPlotData]);

  const handleUndo = () => {
    // If eraser was used, un-erase the last erased item first
    if (erasedItems.length > 0) {
      const last = erasedItems[erasedItems.length - 1];
      setErasedItems(prev => prev.slice(0, -1));
      if (last.kind === 'stamp') {
        updateMapPlotData({ stamps: [...mapPlotData.stamps, last.item] });
      } else {
        updateMapPlotData({ outlines: [...mapPlotData.outlines, last.item] });
      }
      return;
    }
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
    // Fence snaps to last node; all other outlines snap to first node
    const snapTarget = activeOutline?.type === 'fence'
      ? activeOutlinePoints[activeOutlinePoints.length - 1]
      : activeOutlinePoints[0];
    const dx = (mx - snapTarget.x) * rect.width;
    const dy = (my - snapTarget.y) * rect.height;
    setSnapToFirst(Math.sqrt(dx * dx + dy * dy) < 18);
  };

  const handleClear = () => {
    updateMapPlotData({ stamps: [], outlines: [], activeOutlineId: null });
  };

  const hasUndo = erasedItems.length > 0 || mapPlotData.outlines.length > 0 || mapPlotData.stamps.length > 0;
  const hasClear = mapPlotData.outlines.length > 0 || mapPlotData.stamps.length > 0;
  const hasOutline = mapPlotData.outlines.some(o => o.isClosed);
  const canRenderDimensions =
    showDimensions &&
    canvasSize.width > 0 &&
    canvasSize.height > 0 &&
    latitude !== null;

  const canRenderActiveStampMenu = activeStampMenu !== null;
  const satelliteStampScale = isSatelliteMode ? getSatelliteStampScale(mapPlotData.zoom) : 1;

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
                gestureHandling={drawActive ? 'none' : 'greedy'}
                zoomControl={false}
                rotateControl={false}
                mapTypeControl={false}
                fullscreenControl={false}
                streetViewControl={false}
                keyboardShortcuts={!drawActive}
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
          {isBlankGridMode && !drawActive && !eraserActive && (
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
          {isSatelliteMode && <div className={styles.mapDarkOverlay} />}
	          <div className={styles.mapGridOverlay} style={blankGridWorkspaceStyle} />
            {/* ── Left Panel: Drawing Tools ── */}
            {!satFocusTransform && (
              <div className={styles.mapLeftPanel}>
                <div className={styles.mapToolGroupsColumn}>
                  {/* Group 1: Outline + Features */}
                  <div className={styles.mapGroupRow}>
                  <div className={styles.mapSidePanelGroup}>
                    {/* Outline */}
                    <button
                      type="button"
                      className={`${styles.mapSideBtn} ${drawActive && mapPlotData.drawTool === 'outline' && mapPlotData.selectedStampType !== 'fence' ? styles.mapSideBtnActive : ''}`}
                      onClick={() => {
                        activateElementTool(selectedElementType);
                        setActiveStampMenu(prev => prev === 'element' ? null : 'element');
                      }}
                      title="Outline Tool"
                      aria-label="Outline Tool"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" fill="none" aria-hidden="true">
                        <path d="M10 1.99632H3C2.46957 1.99632 1.96086 2.20703 1.58579 2.58211C1.21071 2.95718 1 3.46589 1 3.99632V17.9963C1 18.5268 1.21071 19.0355 1.58579 19.4105C1.96086 19.7856 2.46957 19.9963 3 19.9963H17C17.5304 19.9963 18.0391 19.7856 18.4142 19.4105C18.7893 19.0355 19 18.5268 19 17.9963V10.9963M16.375 1.62132C16.7728 1.2235 17.3124 1 17.875 1C18.4376 1 18.9772 1.2235 19.375 1.62132C19.7728 2.01914 19.9963 2.55871 19.9963 3.12132C19.9963 3.68393 19.7728 4.2235 19.375 4.62132L10.362 13.6353C10.1245 13.8726 9.83121 14.0462 9.509 14.1403L6.636 14.9803C6.54995 15.0054 6.45874 15.0069 6.37191 14.9847C6.28508 14.9624 6.20583 14.9173 6.14245 14.8539C6.07907 14.7905 6.03389 14.7112 6.01164 14.6244C5.9894 14.5376 5.9909 14.4464 6.016 14.3603L6.856 11.4873C6.95053 11.1654 7.12453 10.8724 7.362 10.6353L16.375 1.62132Z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className={styles.mapSideBtnLabel}>Outline</span>
                    </button>
                    {/* Features */}
                    <button
                      type="button"
                      className={`${styles.mapSideBtn} ${drawActive && (activeStampMenu === 'object' || (mapPlotData.drawTool === 'stamp' && isMapObjectStampType(mapPlotData.selectedStampType) && mapPlotData.selectedStampType !== 'sentricon-bait-station') || (mapPlotData.drawTool === 'outline' && mapPlotData.selectedStampType === 'fence')) ? styles.mapSideBtnActive : ''}`}
                      disabled={!mapPlotData.isViewSet || !hasOutline}
                      onClick={() => {
                        // Don't overwrite selectedStampType if fence is currently active —
                        // we need it to stay 'fence' so the menu shows fence as selected.
                        const fenceActive = drawActive && mapPlotData.selectedStampType === 'fence';
                        if (!fenceActive) {
                          const safeObjectType = selectedObjectType === 'sentricon-bait-station' ? 'door' : selectedObjectType;
                          activateObjectTool(safeObjectType);
                        }
                        setActiveStampMenu(prev => prev === 'object' ? null : 'object');
                      }}
                      title="Features"
                      aria-label="Features"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="20" viewBox="0 0 22 20" fill="none" aria-hidden="true">
                        <path d="M5 6H9M5 16H9M13 6H17M13 16H17M3 1L1 3V18C1 18.6 1.4 19 2 19H4C4.6 19 5 18.6 5 18V3L3 1ZM11 1L9 3V18C9 18.6 9.4 19 10 19H12C12.6 19 13 18.6 13 18V3L11 1ZM19 1L17 3V18C17 18.6 17.4 19 18 19H20C20.6 19 21 18.6 21 18V3L19 1Z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className={styles.mapSideBtnLabel}>Features</span>
                    </button>
                  </div>
                  {drawActive && !activeStampMenu && (mapPlotData.drawTool === 'outline' || (mapPlotData.drawTool === 'stamp' && (mapPlotData.selectedStampType === 'door' || mapPlotData.selectedStampType === 'window'))) && (
                    <button
                      type="button"
                      className={styles.mapCancelToolBtn}
                      style={{ top: mapPlotData.drawTool === 'outline' && mapPlotData.selectedStampType !== 'fence' ? 33 : 89 }}
                      onClick={() => setDrawActive(false)}
                    >
                      {mapPlotData.drawTool === 'outline' ? 'Cancel Outline' : 'Cancel Stamp'}
                    </button>
                  )}
                  </div>

                  {/* Group 2: Pests + Stations + Conditions */}
                  <div className={styles.mapGroupRow}>
                  <div className={styles.mapSidePanelGroup}>
                    {/* Pests */}
                    <button
                      type="button"
                      className={`${styles.mapSideBtn} ${drawActive && (activeStampMenu === 'pest' || (mapPlotData.drawTool === 'stamp' && isMapPestStampType(mapPlotData.selectedStampType))) ? styles.mapSideBtnActive : ''}`}
                      disabled={!mapPlotData.isViewSet || !hasOutline}
                      onClick={() => {
                        if (selectedDynamicPestOption) {
                          activateDynamicPestTool(selectedDynamicPestOption);
                        } else {
                          activatePestTool(selectedPestType);
                        }
                        setActiveStampMenu(prev => prev === 'pest' ? null : 'pest');
                      }}
                      title="Pests"
                      aria-label="Pests"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="21" viewBox="0 0 22 21" fill="none" aria-hidden="true">
                        <path d="M11 19V10M11 19C12.5913 19 14.1174 18.3679 15.2426 17.2426C16.3679 16.1174 17 14.5913 17 13V10C17 8.93913 16.5786 7.92172 15.8284 7.17157C15.0783 6.42143 14.0609 6 13 6H9C7.93913 6 6.92172 6.42143 6.17157 7.17157C5.42143 7.92172 5 8.93913 5 10V13C5 14.5913 5.63214 16.1174 6.75736 17.2426C7.88258 18.3679 9.4087 19 11 19ZM13.12 2.88L15 1M20 20C20.0012 18.9712 19.6059 17.9816 18.8964 17.2367C18.1868 16.4918 17.2176 16.0489 16.19 16M20 4C19.9989 4.98215 19.6364 5.92956 18.9818 6.66169C18.3271 7.39383 17.4259 7.85951 16.45 7.97M21 12H17M2 20C1.99884 18.9712 2.39409 17.9816 3.10362 17.2367C3.81315 16.4918 4.78241 16.0489 5.81 16M2 4C2.00113 4.98215 2.36357 5.92956 3.01825 6.66169C3.67293 7.39383 4.57408 7.85951 5.55 7.97M5 12H1M7 1L8.88 2.88M8 6.13V5C8 4.20435 8.31607 3.44129 8.87868 2.87868C9.44129 2.31607 10.2044 2 11 2C11.7956 2 12.5587 2.31607 13.1213 2.87868C13.6839 3.44129 14 4.20435 14 5V6.13" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className={styles.mapSideBtnLabel}>Pests</span>
                    </button>
                    {/* Stations */}
                    <button
                      type="button"
                      className={`${styles.mapSideBtn} ${styles.mapSideBtnNoStroke} ${drawActive && (activeStampMenu === 'station' || (mapPlotData.drawTool === 'stamp' && (isMapStationStampType(mapPlotData.selectedStampType) || mapPlotData.selectedStampType === 'sentricon-bait-station'))) ? styles.mapSideBtnActive : ''}`}
                      disabled={!mapPlotData.isViewSet || !hasOutline}
                      onClick={() => {
                        activateStationTool(selectedStationStampType);
                        setActiveStampMenu(prev => prev === 'station' ? null : 'station');
                      }}
                      title="Stations"
                      aria-label="Stations"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="27" height="23" viewBox="0 0 27 23" fill="none" aria-hidden="true">
                        <path d="M0 19.667V17.333C0.000175197 16.7809 0.447823 16.333 1 16.333C1.55218 16.333 1.99982 16.7809 2 17.333V19.667C2.0001 19.9587 2.13699 20.2819 2.45703 20.5508C2.78228 20.8239 3.25517 20.9999 3.77734 21H6.55566C7.1079 21.0001 7.55566 21.4478 7.55566 22C7.55566 22.5522 7.1079 22.9999 6.55566 23H3.77734C2.82647 22.9999 1.88634 22.6838 1.16992 22.082C0.448538 21.4759 0.000103109 20.6126 0 19.667ZM25 19.667V17.333C25.0002 16.7809 25.4478 16.333 26 16.333C26.5522 16.333 26.9998 16.7809 27 17.333V19.667C26.9999 20.6126 26.5515 21.4759 25.8301 22.082C25.1137 22.6838 24.1735 22.9999 23.2227 23H20.4443C19.8921 22.9999 19.4443 22.5522 19.4443 22C19.4443 21.4478 19.8921 21.0001 20.4443 21H23.2227C23.7448 20.9999 24.2177 20.8239 24.543 20.5508C24.863 20.2819 24.9999 19.9587 25 19.667ZM0 5.66699V3.33301C0.000102883 2.3874 0.448538 1.52411 1.16992 0.917969C1.88634 0.316179 2.82647 9.6054e-05 3.77734 0H6.55566C7.1079 5.87515e-05 7.55566 0.447751 7.55566 1C7.55566 1.55225 7.1079 1.99994 6.55566 2H3.77734C3.25517 2.0001 2.78228 2.17605 2.45703 2.44922C2.13699 2.71806 2.0001 3.04133 2 3.33301V5.66699C1.99982 6.21913 1.55218 6.66699 1 6.66699C0.447824 6.66699 0.000175969 6.21913 0 5.66699ZM25 5.66699V3.33301C24.9999 3.04133 24.863 2.71806 24.543 2.44922C24.2177 2.17605 23.7448 2.0001 23.2227 2H20.4443C19.8921 1.99994 19.4443 1.55225 19.4443 1C19.4443 0.447751 19.8921 5.77208e-05 20.4443 0H23.2227C24.1735 9.62652e-05 25.1137 0.316179 25.8301 0.917969C26.5515 1.52411 26.9999 2.3874 27 3.33301V5.66699C26.9998 6.21913 26.5522 6.66699 26 6.66699C25.4478 6.66699 25.0002 6.21913 25 5.66699Z" fill="currentColor"/>
                        <path d="M20 9.36621L13 13.5654V17.4824L19.7568 13.4287C19.8309 13.3843 19.893 13.3212 19.9355 13.2461C19.978 13.1711 20 13.0862 20 13V9.36621ZM15.0117 5C14.9173 4.99786 14.8242 5.02269 14.7432 5.07129L7.98828 9.12305L12.0273 11.8164L19.0537 7.60059L15.2773 5.08399C15.1986 5.03155 15.1063 5.00221 15.0117 5ZM7.00391 14.5615C7.01142 14.6225 7.03041 14.6818 7.05957 14.7363C7.09838 14.8088 7.1543 14.8704 7.22266 14.916V14.917L11 17.4336V13.5352L7 10.8682V14.5L7.00391 14.5615ZM22 13C22 13.4316 21.8884 13.8559 21.6758 14.2314C21.4631 14.6071 21.1563 14.9214 20.7861 15.1436L13.2861 19.6436C12.9074 19.8709 12.4757 19.9908 12.0352 19.9971C12.0235 19.9975 12.0118 20 12 20C11.9918 20 11.9837 19.9982 11.9756 19.998C11.9642 19.9979 11.9528 19.9993 11.9414 19.999C11.4684 19.988 11.0081 19.8432 10.6143 19.5811H10.6133L6.11328 16.5811C5.77068 16.3527 5.49016 16.0427 5.2959 15.6797C5.10171 15.3168 4.99994 14.9116 5 14.5V10C5.00001 9.56842 5.11163 9.14414 5.32422 8.76856C5.35312 8.71752 5.38471 8.66783 5.41699 8.61914C5.41818 8.61733 5.41872 8.61509 5.41992 8.61328C5.42397 8.60721 5.42944 8.60166 5.43359 8.5957C5.63697 8.29645 5.90221 8.04343 6.21387 7.85645L13.7139 3.35645C14.1194 3.11304 14.5857 2.98996 15.0586 3.00098C15.5316 3.01204 15.9919 3.15678 16.3857 3.41895H16.3867L20.8867 6.41895C21.192 6.62242 21.4471 6.8913 21.6367 7.2041C21.6388 7.20748 21.6415 7.21046 21.6436 7.21387C21.6475 7.22047 21.6505 7.22772 21.6543 7.23438C21.671 7.26286 21.6885 7.29112 21.7041 7.32031C21.8983 7.68324 22.0001 8.08839 22 8.5V13Z" fill="currentColor"/>
                      </svg>
                      <span className={styles.mapSideBtnLabel}>Stations</span>
                    </button>
                    {/* Conditions */}
                    <button
                      type="button"
                      className={`${styles.mapSideBtn} ${drawActive && isMapConditionStampType(mapPlotData.selectedStampType) && mapPlotData.drawTool === 'stamp' ? styles.mapSideBtnActive : ''}`}
                      disabled={!mapPlotData.isViewSet || !hasOutline}
                      onClick={() => {
                        activateConditionTool('other-condition');
                        setActiveStampMenu(null);
                      }}
                      title="Conditions"
                      aria-label="Conditions"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                        <path d="M11 7V11M11 15H11.01M21 11C21 16.5228 16.5228 21 11 21C5.47715 21 1 16.5228 1 11C1 5.47715 5.47715 1 11 1C16.5228 1 21 5.47715 21 11Z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className={styles.mapSideBtnLabel}>Conditions</span>
                    </button>
                  </div>
                  {drawActive && !activeStampMenu && mapPlotData.drawTool === 'stamp' && (isMapPestStampType(mapPlotData.selectedStampType) || isMapConditionStampType(mapPlotData.selectedStampType) || isMapStationStampType(mapPlotData.selectedStampType) || mapPlotData.selectedStampType === 'sentricon-bait-station') && (
                    <button
                      type="button"
                      className={styles.mapCancelToolBtn}
                      style={{
                        top: isMapPestStampType(mapPlotData.selectedStampType)
                          ? 33
                          : (isMapStationStampType(mapPlotData.selectedStampType) || mapPlotData.selectedStampType === 'sentricon-bait-station')
                          ? 89
                          : 145,
                      }}
                      onClick={() => setDrawActive(false)}
                    >
                      Cancel Stamp
                    </button>
                  )}
                  </div>

                  {/* Group 3: Undo + Eraser + Trash */}
                  <div className={styles.mapSidePanelGroup}>
                    {/* Undo */}
                    <button
                      type="button"
                      className={styles.mapSideBtn}
                      disabled={!mapPlotData.isViewSet || !hasUndo}
                      onClick={handleUndo}
                      title="Undo"
                      aria-label="Undo"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                        <path d="M6 11L1 6M1 6L6 1M1 6H11.5C12.2223 6 12.9375 6.14226 13.6048 6.41866C14.272 6.69506 14.8784 7.10019 15.3891 7.61091C15.8998 8.12163 16.3049 8.72795 16.5813 9.39524C16.8577 10.0625 17 10.7777 17 11.5C17 12.2223 16.8577 12.9375 16.5813 13.6048C16.3049 14.272 15.8998 14.8784 15.3891 15.3891C14.8784 15.8998 14.272 16.3049 13.6048 16.5813C12.9375 16.8577 12.2223 17 11.5 17H8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className={styles.mapSideBtnLabel}>Undo</span>
                    </button>
                    {/* Eraser */}
                    <button
                      type="button"
                      className={`${styles.mapSideBtn} ${eraserActive ? styles.mapSideBtnActive : ''}`}
                      disabled={!mapPlotData.isViewSet || !hasClear}
                      onClick={() => setEraserActive(e => !e)}
                      title="Eraser"
                      aria-label="Eraser"
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M20 20H7L3 16L13 6L21 14L18 17" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M6.5 17.5L9 15" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <span className={styles.mapSideBtnLabel}>Eraser</span>
                    </button>
                    {/* Trash */}
                    <button
                      type="button"
                      className={`${styles.mapSideBtn} ${styles.mapSideBtnDanger}`}
                      disabled={!mapPlotData.isViewSet || !hasClear}
                      onClick={() => setShowTrashConfirm(true)}
                      title="Clear All"
                      aria-label="Clear All"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="22" viewBox="0 0 20 22" fill="none" aria-hidden="true">
                        <path d="M8 10V16M12 10V16M17 5V19C17 19.5304 16.7893 20.0391 16.4142 20.4142C16.0391 20.7893 15.5304 21 15 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5M1 5H19M6 5V3C6 2.46957 6.21071 1.96086 6.58579 1.58579C6.96086 1.21071 7.46957 1 8 1H12C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V5" stroke="#E7000B" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className={styles.mapSideBtnLabel}>Trash</span>
                    </button>
                  </div>
                </div>

                {/* Secondary picker menu — appears to the right of the tool group */}
                {canRenderActiveStampMenu && activeStampMenu && (
                  <div
                    className={styles.mapSecondaryMenu}
                    role="menu"
                    style={{
                      marginTop: activeStampMenu === 'element' ? 9
                        : activeStampMenu === 'object' ? 65
                        : activeStampMenu === 'pest' ? 148
                        : activeStampMenu === 'station' ? 204
                        : 0,
                    }}
                  >
                    {activeStampMenu === 'element' && MAP_ELEMENT_STAMP_OPTIONS.filter(opt => opt.type !== 'fence').map(opt => (
                      <button
                        key={opt.type}
                        type="button"
                        className={`${styles.mapSecondaryBtn} ${mapPlotData.selectedStampType === opt.type ? styles.mapSecondaryBtnActive : ''}`}
                        onClick={() => { activateElementTool(opt.type as MapElementStampType); setActiveStampMenu(null); }}
                        title={opt.label}
                      >
                        <MapStampGlyph type={opt.type} size={28} />
                        <span className={styles.mapSecondaryBtnLabel}>{opt.label}</span>
                      </button>
                    ))}
                    {activeStampMenu === 'object' && MAP_OBJECT_STAMP_OPTIONS.filter(o => o.type !== 'sentricon-bait-station').map(opt => (
                      <button
                        key={opt.type}
                        type="button"
                        className={`${styles.mapSecondaryBtn} ${mapPlotData.selectedStampType === opt.type ? styles.mapSecondaryBtnActive : ''}`}
                        onClick={() => { activateObjectTool(opt.type as MapObjectStampType); setActiveStampMenu(null); }}
                        title={opt.label}
                      >
                        <PlotObjectBlueprintGlyph type={opt.type as MapObjectStampType} />
                        <span className={styles.mapSecondaryBtnLabel}>{opt.label}</span>
                      </button>
                    ))}
                    {activeStampMenu === 'object' && (
                      <button
                        type="button"
                        className={`${styles.mapSecondaryBtn} ${mapPlotData.drawTool === 'outline' && mapPlotData.selectedStampType === 'fence' ? styles.mapSecondaryBtnActive : ''}`}
                        onClick={() => { activateElementTool('fence'); setActiveStampMenu(null); }}
                        title="Fence"
                      >
                        <MapStampGlyph type="fence" size={28} />
                        <span className={styles.mapSecondaryBtnLabel}>Fence</span>
                      </button>
                    )}
                    {activeStampMenu === 'pest' && (
                      companyPestOptions.length > 0
                        ? [...companyPestOptions]
                            .sort((a, b) => a.custom_label.localeCompare(b.custom_label))
                            .map(opt => (
                              <button
                                key={opt.id}
                                type="button"
                                className={`${styles.mapSecondaryBtn} ${mapPlotData.selectedStampType === 'dynamic-pest' && selectedDynamicPestOption?.id === opt.id ? styles.mapSecondaryBtnActive : ''}`}
                                onClick={() => { activateDynamicPestTool(opt); setActiveStampMenu(null); }}
                                title={opt.custom_label}
                              >
                                {opt.icon_svg
                                  ? <span className={styles.mapStampDynamicIcon} dangerouslySetInnerHTML={{ __html: opt.icon_svg }} />
                                  : <MapStampGlyph type="dynamic-pest" size={28} />}
                                <span className={styles.mapSecondaryBtnLabel}>{opt.custom_label}</span>
                              </button>
                            ))
                        : [...MAP_PEST_STAMP_OPTIONS]
                            .sort((a, b) => a.label.localeCompare(b.label))
                            .map(opt => (
                              <button
                                key={opt.type}
                                type="button"
                                className={`${styles.mapSecondaryBtn} ${mapPlotData.selectedStampType === opt.type ? styles.mapSecondaryBtnActive : ''}`}
                                onClick={() => { activatePestTool(opt.type as MapPestStampType); setActiveStampMenu(null); }}
                                title={opt.label}
                              >
                                <MapStampGlyph type={opt.type} size={28} />
                                <span className={styles.mapSecondaryBtnLabel}>{opt.label}</span>
                              </button>
                            ))
                    )}
                    {activeStampMenu === 'station' && (
                      <>
                        {MAP_STATION_STAMP_OPTIONS.map(opt => (
                          <button
                            key={opt.type}
                            type="button"
                            className={`${styles.mapSecondaryBtn} ${mapPlotData.selectedStampType === opt.type ? styles.mapSecondaryBtnActive : ''}`}
                            onClick={() => { activateStationTool(opt.type as MapStationStampType); setActiveStampMenu(null); }}
                            title={opt.label}
                          >
                            <StationStampGlyph type={opt.type as MapStationStampType} />
                            <span className={styles.mapSecondaryBtnLabel}>{opt.label}</span>
                          </button>
                        ))}
                        <button
                          type="button"
                          className={`${styles.mapSecondaryBtn} ${mapPlotData.selectedStampType === 'sentricon-bait-station' ? styles.mapSecondaryBtnActive : ''}`}
                          onClick={() => { activateObjectTool('sentricon-bait-station'); setActiveStampMenu(null); }}
                          title="Sentricon"
                        >
                          <PlotObjectBlueprintGlyph type="sentricon-bait-station" />
                          <span className={styles.mapSecondaryBtnLabel}>Sentricon</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Right Panel: View Controls + Lock ── */}
            {!satFocusTransform && (
              <div className={styles.mapRightPanel}>
                <div className={styles.mapSidePanelGroup}>
                  {/* Legend */}
                  <button
                    type="button"
                    className={`${styles.mapSideBtn} ${showLegendLabels ? styles.mapSideBtnActive : ''}`}
                    onClick={() => setShowLegendLabels(prev => !prev)}
                    title={showLegendLabels ? 'Hide Legend' : 'Show Legend'}
                    aria-label={showLegendLabels ? 'Hide Legend' : 'Show Legend'}
                  >
                    <KeyRound size={20} aria-hidden="true" />
                    <span className={styles.mapSideBtnLabel}>Legend</span>
                  </button>
                  {/* Map (satellite) */}
                  <button
                    type="button"
                    className={`${styles.mapSideBtn} ${isSatelliteMode ? styles.mapSideBtnActive : ''}`}
                    onClick={() => updateMapPlotData({ backgroundMode: 'satellite' })}
                    title="Satellite View"
                    aria-label="Satellite View"
                  >
                    <MapIcon size={20} />
                    <span className={styles.mapSideBtnLabel}>Map</span>
                  </button>
                  {/* Grid (blank-grid) */}
                  <button
                    type="button"
                    className={`${styles.mapSideBtn} ${isBlankGridMode ? styles.mapSideBtnActive : ''}`}
                    onClick={() => updateMapPlotData({ backgroundMode: 'blank-grid' })}
                    title="Grid View"
                    aria-label="Grid View"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="M1 7H19M1 13H19M7 1V19M13 1V19M3 1H17C18.1046 1 19 1.89543 19 3V17C19 18.1046 18.1046 19 17 19H3C1.89543 19 1 18.1046 1 17V3C1 1.89543 1.89543 1 3 1Z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className={styles.mapSideBtnLabel}>Grid</span>
                  </button>
                  {/* Ruler */}
                  <button
                    type="button"
                    className={`${styles.mapSideBtn} ${showDimensions ? styles.mapSideBtnActive : ''}`}
                    onClick={() => { setSelectedWallMeasurement(null); setShowDimensions(prev => !prev); }}
                    title="Toggle Dimensions"
                    aria-label="Toggle Dimensions"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                      <path d="M13.5018 11.5018L15.5018 9.50175M10.5018 8.50176L12.5018 6.50176M7.50176 5.50176L9.50175 3.50176M16.5018 14.5018L18.5018 12.5018M20.3018 14.3018C20.5255 14.5247 20.703 14.7897 20.8242 15.0814C20.9453 15.3731 21.0076 15.6859 21.0076 16.0018C21.0076 16.3176 20.9453 16.6304 20.8242 16.9221C20.703 17.2138 20.5255 17.4788 20.3018 17.7018L17.7018 20.3018C17.4788 20.5255 17.2138 20.703 16.9221 20.8242C16.6304 20.9453 16.3176 21.0076 16.0018 21.0076C15.6859 21.0076 15.3731 20.9453 15.0814 20.8242C14.7897 20.703 14.5247 20.5255 14.3018 20.3018L1.70176 7.70176C1.25231 7.25013 1 6.63891 1 6.00176C1 5.3646 1.25231 4.75338 1.70176 4.30176L4.30176 1.70176C4.75338 1.25231 5.3646 1 6.00176 1C6.63891 1 7.25013 1.25231 7.70176 1.70176L20.3018 14.3018Z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className={styles.mapSideBtnLabel}>Ruler</span>
                  </button>
                  {/* Rotate CCW - desktop only */}
                  <button
                    type="button"
                    className={`${styles.mapSideBtn} ${styles.mapSideBtnDesktop}`}
                    onClick={() => {
                      const newHeading = ((mapPlotData.heading ?? 0) - 15 + 360) % 360;
                      const reprojected = reprojectAnchoredGeometry(mapPlotData.stamps, mapPlotData.outlines, googleMapInstance ?? undefined, newHeading);
                      updateMapPlotData({ heading: newHeading, stamps: reprojected.stamps, outlines: reprojected.outlines });
                    }}
                    title="Rotate Left 15°"
                    aria-label="Rotate Left 15°"
                  >
                    <RotateCcw size={20} />
                    <span className={styles.mapSideBtnLabel}>Rotate</span>
                  </button>
                  {/* Rotate CW - desktop only */}
                  <button
                    type="button"
                    className={`${styles.mapSideBtn} ${styles.mapSideBtnDesktop}`}
                    onClick={() => {
                      const newHeading = ((mapPlotData.heading ?? 0) + 15) % 360;
                      const reprojected = reprojectAnchoredGeometry(mapPlotData.stamps, mapPlotData.outlines, googleMapInstance ?? undefined, newHeading);
                      updateMapPlotData({ heading: newHeading, stamps: reprojected.stamps, outlines: reprojected.outlines });
                    }}
                    title="Rotate Right 15°"
                    aria-label="Rotate Right 15°"
                  >
                    <RotateCw size={20} />
                    <span className={styles.mapSideBtnLabel}>Rotate</span>
                  </button>
                </div>

                {/* Lock / Unlock button — hidden */}
                {/* <div className={styles.mapSidePanelGroup}>
                  <button
                    type="button"
                    className={`${styles.mapLockBtn} ${mapPlotData.isViewSet ? styles.mapLockBtnLocked : styles.mapLockBtnUnlocked}`}
                    onClick={mapPlotData.isViewSet ? unsetView : setView}
                    disabled={!mapPlotData.isViewSet && !canSetView}
                    title={mapPlotData.isViewSet ? 'Unlock View' : 'Lock View'}
                    aria-label={mapPlotData.isViewSet ? 'Unlock View' : 'Lock View'}
                  >
                    ...
                  </button>
                </div> */}
              </div>
            )}

          {/* Trash confirmation dialog */}
          {showTrashConfirm && (
            <div className={styles.trashConfirmOverlay}>
              <div className={styles.trashConfirmDialog}>
                <p className={styles.trashConfirmText}>Clear all outlines and stamps?</p>
                <div className={styles.trashConfirmActions}>
                  <button
                    type="button"
                    className={styles.trashConfirmCancel}
                    onClick={() => setShowTrashConfirm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={styles.trashConfirmOk}
                    onClick={() => { handleClear(); setShowTrashConfirm(false); setErasedItems([]); }}
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Onboarding hint: shown when view is set but no outlines drawn yet */}
          {!hasOutline && !drawActive && !satFocusTransform && (
            <div className={styles.onboardingHint} aria-hidden="true">
              <svg className={styles.onboardingArrow} width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <path d="M6 16 L2 12 M2 12 L6 8 M2 12 L14 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className={styles.onboardingHintText}>Start by creating a house outline</span>
            </div>
          )}

          {pestModalStampId && <div className={styles.mapStampModalDimmer} />}

	          <div
	            className={`${styles.mapPlotOverlay} ${(drawActive || eraserActive || (!!mapPlotData.activeOutlineId && (mapPlotData.outlines.find(o => o.id === mapPlotData.activeOutlineId)?.isClosed ?? false))) ? styles.mapPlotOverlayActive : ''}`}
            style={{ ...blankGridWorkspaceStyle, cursor: eraserActive ? 'crosshair' : undefined }}
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
                // "idle selected" = user tapped a closed outline with no tool active
                const showSelectedInfo = isActive && outline.isClosed && !drawActive;
                const showAreaLabel = metrics.areaSqFt !== null && (canRenderDimensions || showSelectedInfo);
                const shouldShowOutlineText = outline.isClosed && metrics.centroid && (showLegendLabels || showAreaLabel || showSelectedInfo);
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
                const perimeterFt = (isFence
                  ? (showDimensions || showSelectedInfo) && outline.points.length >= 2
                  : outline.isClosed && (showDimensions || showSelectedInfo))
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
                    {/* Invisible hit-area shape for idle-mode tap-to-select */}
                    {!drawActive && !eraserActive && outline.isClosed && outline.points.length >= 3 && (
                      <polygon
                        points={outline.points.map(p => `${gx(p)},${gy(p)}`).join(' ')}
                        fill="transparent"
                        stroke="transparent"
                        strokeWidth={isBlankGridMode ? 24 / blankGridScale : 24}
                        style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          updateMapPlotData({ activeOutlineId: outline.id, selectedElementType: outline.type, selectedStampType: outline.type });
                        }}
                      />
                    )}
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
                          stroke={isFence ? (isBlankGridMode ? '#1a1a1a' : '#ffffff') : metrics.strokeColor}
                          strokeWidth={sw}
                          strokeDasharray={dash}
                          strokeLinejoin="round"
                          strokeLinecap="round"
                        />
                      )
                    )}

                    {/* Fence picket marks — perpendicular ticks along each segment */}
                    {isFence && outline.points.length >= 2 && (() => {
                      const spacing = isBlankGridMode ? 14 / blankGridScale : 14;
                      const half   = isBlankGridMode ?  6 / blankGridScale :  6;
                      const ticks: React.ReactNode[] = [];
                      for (let si = 0; si < outline.points.length - 1; si++) {
                        const ax = gx(outline.points[si]);
                        const ay = gy(outline.points[si]);
                        const bx = gx(outline.points[si + 1]);
                        const by = gy(outline.points[si + 1]);
                        const dx = bx - ax;
                        const dy = by - ay;
                        const len = Math.sqrt(dx * dx + dy * dy);
                        if (len < 1) continue;
                        const ux = dx / len;
                        const uy = dy / len;
                        const px = -uy; // perpendicular unit vector
                        const py = ux;
                        const n = Math.max(1, Math.round(len / spacing));
                        for (let t = 0; t <= n; t++) {
                          const cx = ax + ux * (len * t / n);
                          const cy = ay + uy * (len * t / n);
                          ticks.push(
                            <line
                              key={`f-${si}-${t}`}
                              x1={cx - px * half} y1={cy - py * half}
                              x2={cx + px * half} y2={cy + py * half}
                              stroke={isBlankGridMode ? '#1a1a1a' : '#ffffff'}
                              strokeWidth={sw}
                              strokeLinecap="round"
                            />
                          );
                        }
                      }
                      return <>{ticks}</>;
                    })()}

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
                          {(showLegendLabels || showSelectedInfo) && (
                            <tspan x={0} dy={showAreaLabel ? '-12' : '0'}>
                              {metrics.label}
                            </tspan>
                          )}
                          {showAreaLabel && (
                            <tspan x={0} dy={(showLegendLabels || showSelectedInfo) ? '16' : '0'}>
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

                    {/* House + Garage + Yard: show all wall labels at once when ruler is on */}
                    {canRenderDimensions && outline.isClosed && (outline.type === 'house' || outline.type === 'garage' || outline.type === 'yard') &&
                      getOutlineSegmentDimensions(outline).map((seg, i) => {
                        const label = `${Math.round(seg.feet)} ft`;
                        const bubbleW = Math.max(46, label.length * 8 + 18);
                        return (
                          <g
                            key={`dim-${outline.id}-${i}`}
                            transform={isBlankGridMode
                              ? `translate(${seg.x * W} ${seg.y * H}) scale(${1 / blankGridScale})`
                              : `translate(${seg.x * W} ${seg.y * H})`}
                          >
                            <rect
                              x={-bubbleW / 2}
                              y={-11}
                              width={bubbleW}
                              height={22}
                              rx="9"
                              ry="9"
                              className={styles.mapDimensionBubble}
                            />
                            <text
                              x={0}
                              y={0}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className={styles.mapDimensionText}
                              style={{ fill: metrics.strokeColor }}
                            >
                              {label}
                            </text>
                          </g>
                        );
                      })
                    }

                    {/* Other outline types: click a wall to see its measurement */}
                    {canRenderDimensions && selectedSegment && outline.type !== 'house' && outline.type !== 'garage' && (
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
                            cx={isFence ? gx(outline.points[outline.points.length - 1]) : gx(outline.points[0])}
                            cy={isFence ? gy(outline.points[outline.points.length - 1]) : gy(outline.points[0])}
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
              const isStationStamp = option.category === 'station';
              const isBaitStation = stamp.type === 'sentricon-bait-station';
              const isActiveStamp = stamp.id === pestModalStampId;
              const stampScale = (isBlankGridMode ? (1 / blankGridScale) * BLANK_GRID_STAMP_SCALE : 1) * satelliteStampScale;

              let stampIcon: React.ReactNode;
              if (isBaitStation) {
                stampIcon = <PlotObjectBlueprintGlyph type="sentricon-bait-station" />;
              } else if (isStationStamp) {
                stampIcon = <StationStampGlyph type={stamp.type as MapStationStampType} />;
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
                  className={`${styles.mapStamp} ${isPestStamp || isBaitStation || isConditionStamp || isStationStamp ? styles.mapStampPest : ''} ${isObjectStamp && !isBaitStation ? styles.mapStampObject : ''} ${isActiveStamp ? styles.mapStampActive : ''} ${isSatelliteMode && !isActiveStamp && (isPestStamp || isBaitStation || isConditionStamp || isStationStamp) ? styles.mapStampNoBorder : ''}`}
                  style={{
                    left: `${stamp.x * 100}%`,
                    top: `${stamp.y * 100}%`,
                    transform: `translate(-50%, -50%) rotate(${stamp.rotation ?? 0}deg) scale(${stampScale})`,
                    opacity: showDimensions ? 0.25 : 1,
                    transition: 'opacity 0.2s ease',
                    ...(pestModalStampId && (isPestStamp || isBaitStation || isConditionStamp || isStationStamp) ? { opacity: 1 } : {}),
                    ...(!isActiveStamp && isConditionStamp
                      ? { color: 'var(--UI-Alert-500, #FD484F)' }
                      : !isActiveStamp && (isPestStamp || isBaitStation)
                      ? { color: stampColor ?? 'var(--blue-500, #0075de)' }
                      : !isActiveStamp && isStationStamp
                      ? { color: 'var(--blue-500, #0075de)' }
                      : !isActiveStamp && isObjectStamp
                      ? { color: isBlankGridMode ? '#1a1a1a' : '#ffffff' }
                      : !isActiveStamp
                      ? { backgroundColor: option.color, color: '#ffffff' }
                      : {}),
                  }}
                  title={isObjectStamp ? `${option.label} — click to rotate` : (stamp.displayLabel || option.label)}
                  onPointerDown={event => handleStampPointerDown(stamp.id, event)}
                  onPointerMove={event => handleStampPointerMove(stamp.id, event)}
                  onPointerUp={stopDragging}
                  onPointerCancel={stopDragging}
                  onContextMenu={event => { event.preventDefault(); event.stopPropagation(); }}
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
                    } else if (isPestStamp || isConditionStamp || isBaitStation || isStationStamp) {
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

          {/* ── Bottom Bar ── */}
          {!satFocusTransform && (
            <div className={styles.mapBottomBar}>
              <button
                type="button"
                className={styles.mapBackBtn}
                onClick={onBack}
                title="Go Back"
                aria-label="Go Back"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 15L1 8M1 8L8 1M1 8H15" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Go Back
              </button>
              <button
                type="button"
                className={styles.mapContinueBtn}
                onClick={onNext}
                disabled={!canNext}
                title="Continue"
                aria-label="Continue"
              >
                Continue
              </button>
            </div>
          )}

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
        // The transform is rotate(r) translate(tx, ty) scale(s), so translation is
        // in the rotated coordinate space. Counter-rotate the screen-space delta to
        // get the correct tx/ty adjustment.
        const rad = (prev.rotation * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const correctedDx = cos * dx + sin * dy;
        const correctedDy = -sin * dx + cos * dy;
        const maxTx = previewSize.width * (prev.scale - 1) / 2;
        const maxTy = previewSize.height * (prev.scale - 1) / 2;
        return {
          ...prev,
          tx: Math.max(-maxTx, Math.min(maxTx, pan.startTx + correctedDx)),
          ty: Math.max(-maxTy, Math.min(maxTy, pan.startTy + correctedDy)),
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

  // Prevent the browser from stealing touch gestures as page-scroll or viewport-zoom.
  // React's synthetic pointer events can't call preventDefault(), so we attach
  // non-passive native listeners directly on the map frame.
  useEffect(() => {
    const frame = previewFrameRef.current;
    if (!frame) return;

    const onTouchStart = (e: TouchEvent) => {
      // Always block multi-touch (prevents iOS viewport pinch-to-zoom from intercepting)
      if (e.touches.length >= 2) e.preventDefault();
    };

    const onTouchMove = (e: TouchEvent) => {
      // Block all move defaults so the page won't scroll while the user pans the map
      e.preventDefault();
    };

    frame.addEventListener('touchstart', onTouchStart, { passive: false });
    frame.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      frame.removeEventListener('touchstart', onTouchStart);
      frame.removeEventListener('touchmove', onTouchMove);
    };
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
              touchAction: 'none',
            }}
            onTransitionEnd={() => setRoAnimating(false)}
          >
          {staticMapUrl ? (
            <>
              <img src={staticMapUrl} alt="Map preview" className={styles.readOnlyMapImg} draggable={false} />
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
                  const isStationStamp = option.category === 'station';
                  const hasDetails = Boolean(
                    (stamp.notes && stamp.notes.trim().length > 0) ||
                    (stamp.photoUrls && stamp.photoUrls.length > 0)
                  );

                  const isBaitStation = stamp.type === 'sentricon-bait-station';

                  let stampIcon: React.ReactNode;
                  if (isBaitStation) {
                    stampIcon = <PlotObjectBlueprintGlyph type="sentricon-bait-station" />;
                  } else if (isStationStamp) {
                    stampIcon = <StationStampGlyph type={stamp.type as MapStationStampType} />;
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
                      className={`${styles.mapStamp} ${styles.readOnlyStamp} ${isPestStamp || isBaitStation || isConditionStamp || isStationStamp ? styles.mapStampPest : ''} ${isObjectStamp && !isBaitStation ? styles.mapStampObject : ''}`}
                      style={{
                        left: `${point.x}px`,
                        top: `${point.y}px`,
                        transform: `translate(-50%, -50%) rotate(${stamp.rotation ?? 0}deg) scale(${readOnlyStampScale / roTransform.scale})`,
                        ...(isConditionStamp
                          ? { color: 'var(--UI-Alert-500, #FD484F)' }
                          : isPestStamp || isBaitStation
                          ? { color: stampColor ?? 'var(--blue-500, #0075de)' }
                          : isStationStamp
                          ? { color: stampColor ?? 'var(--blue-500, #0075de)' }
                          : isObjectStamp
                          ? { color: mapPlotData.backgroundMode === 'blank-grid' ? '#1a1a1a' : '#ffffff' }
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
