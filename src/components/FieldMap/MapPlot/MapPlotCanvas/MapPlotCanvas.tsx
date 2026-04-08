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
  Ruler,
  Undo2,
  Trash2,
  Map as MapIcon,
  MapPinned,
} from 'lucide-react';
import { MapStampGlyph, PlotObjectBlueprintGlyph } from '@/components/FieldMap/MapPlot/glyphs';
import { PestStampModal } from '@/components/FieldMap/MapPlot/PestStampModal/PestStampModal';
import {
  BLANK_GRID_MAX_SCALE,
  BLANK_GRID_MIN_SCALE,
  clampNormalized,
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
  isMapElementStampType,
  isMapObjectStampType,
  isMapPestStampType,
  MAP_ELEMENT_STAMP_OPTIONS,
  MAP_MIN_ZOOM,
  MAP_OBJECT_STAMP_OPTIONS,
  MAP_PEST_STAMP_OPTIONS,
  OUTLINE_SNAP_GRID_PX,
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
  const [pestModalStampId, setPestModalStampId] = useState<string | null>(null);
  const [showDimensions, setShowDimensions] = useState(false);
  const [selectedWallMeasurement, setSelectedWallMeasurement] = useState<{ outlineId: string; segmentIndex: number } | null>(null);
  const [showLegendLabels, setShowLegendLabels] = useState(false);
  const [snapToFirst, setSnapToFirst] = useState(false);
  const [activeStampMenu, setActiveStampMenu] = useState<MapStampCategory | null>(null);
  const [blankGridScale, setBlankGridScale] = useState(1);
  const [blankGridOffset, setBlankGridOffset] = useState({ x: 0, y: 0 });
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
    const nextStamp = createStamp(point, mapPlotData.selectedStampType);

    updateMapPlotData({
      stamps: [...mapPlotData.stamps, nextStamp],
    });

    if (isMapPestStampType(nextStamp.type)) {
      setPestModalStampId(nextStamp.id);
    }
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

    const rect = container.getBoundingClientRect();
    const NODE_HIT_PX = 18;

    // Search all outlines for the closest node within hit range
    let hitOutlineId: string | null = null;
    let hitNodeIndex = -1;
    let hitDistance = Number.POSITIVE_INFINITY;

    for (const outline of mapPlotData.outlines) {
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

      // Node drag gesture: any node on any outline
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
    canvasSize.width > 0 &&
    canvasSize.height > 0 &&
    latitude !== null;

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
    <>
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
                const dash = outline.isClosed ? 'none'
                  : isBlankGridMode ? `${12 / blankGridScale} ${6 / blankGridScale}` : '12 6';
                return (
                  <g key={outline.id}>
                    {outline.points.length >= 2 && (
                      outline.points.length >= 3 ? (
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
                          strokeLinejoin="round"
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

                    {(!outline.isClosed || isActive) && outline.points.slice(1).map((point, i) => (
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

                    {(!outline.isClosed || isActive) && outline.points.length >= 1 && (
                      <>
                        {isActive && !outline.isClosed && snapToFirst && (
                          <circle
                            cx={gx(outline.points[0])}
                            cy={gy(outline.points[0])}
                            r={isBlankGridMode ? 18 / blankGridScale : 18}
                            fill="none"
                            stroke="#f97316"
                            strokeWidth={isBlankGridMode ? 2 / blankGridScale : 2}
                            className={styles.mapSnapRing}
                          />
                        )}
                        <circle
                          cx={gx(outline.points[0])}
                          cy={gy(outline.points[0])}
                          r={isBlankGridMode
                            ? (outline.isClosed ? 6 : outline.points.length >= 3 ? 7 : 5) / blankGridScale
                            : (outline.isClosed ? 6 : outline.points.length >= 3 ? 7 : 5)}
                          fill="white"
                          stroke={outline.isClosed ? metrics.strokeColor : outline.points.length >= 3 ? '#f97316' : '#2563eb'}
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
              return (
                <button
                  key={stamp.id}
                  type="button"
                  className={`${styles.mapStamp} ${isPestStamp ? styles.mapStampPest : ''} ${isObjectStamp ? styles.mapStampObject : ''}`}
                  style={{
                    left: `${stamp.x * 100}%`,
                    top: `${stamp.y * 100}%`,
                    transform: isBlankGridMode
                      ? `translate(-50%, -50%) rotate(${stamp.rotation ?? 0}deg) scale(${1 / blankGridScale})`
                      : `translate(-50%, -50%) rotate(${stamp.rotation ?? 0}deg)`,
                    ...(isPestStamp
                      ? { color: '#ffffff' }
                      : isObjectStamp
                      ? { color: '#1d4ed8' }
                      : { backgroundColor: option.color, color: '#ffffff' }),
                  }}
                  title={isObjectStamp ? `${option.label} — click to rotate` : option.label}
                  onPointerDown={event => handleStampPointerDown(stamp.id, event)}
                  onPointerMove={event => handleStampPointerMove(stamp.id, event)}
                  onPointerUp={stopDragging}
                  onPointerCancel={stopDragging}
                  onClick={() => {
                    if (dragMovedRef.current) return;
                    if (isObjectStamp) {
                      updateMapPlotData({
                        stamps: mapPlotData.stamps.map(s =>
                          s.id === stamp.id
                            ? { ...s, rotation: ((s.rotation ?? 0) + 45) % 360 }
                            : s
                        ),
                      });
                    } else if (isPestStamp) {
                      setPestModalStampId(stamp.id);
                    }
                  }}
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

    {pestModalStampId && mapPlotData.stamps.find(s => s.id === pestModalStampId) && (
      <PestStampModal
        stamp={mapPlotData.stamps.find(s => s.id === pestModalStampId)!}
        companyId={companyId}
        onSave={(id, notes, photoUrls) => {
          updateMapPlotData({
            stamps: mapPlotData.stamps.map(s =>
              s.id === id ? { ...s, notes, photoUrls } : s
            ),
          });
          setPestModalStampId(null);
        }}
        onDelete={(id) => {
          updateMapPlotData({
            stamps: mapPlotData.stamps.filter(s => s.id !== id),
          });
          setPestModalStampId(null);
        }}
        onClose={() => setPestModalStampId(null)}
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
}

function ReadOnlySummary({ mapPlotData }: { mapPlotData: MapPlotData }) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMapData, setModalMapData] = useState<MapPlotData>(mapPlotData);

  useEffect(() => {
    fetch('/api/google-places-key')
      .then(r => r.ok ? r.json() : null)
      .then((d: { apiKey?: string } | null) => { if (d?.apiKey) setApiKey(d.apiKey); })
      .catch(() => {});
  }, []);

  const lat = getMapLatitude(mapPlotData);
  const lng = getMapLongitude(mapPlotData);
  const hasCoords = lat !== null && lng !== null;
  const stampCount = mapPlotData.stamps.length;
  const outlineCount = mapPlotData.outlines.length;

  const staticMapUrl = hasCoords && apiKey ? (() => {
    const zoom = Math.max(Math.min(mapPlotData.zoom ?? 20, 20), 16);
    const params = new URLSearchParams({
      center: `${lat},${lng}`,
      zoom: String(Math.max(zoom - 1, 16)),
      size: '600x280',
      maptype: 'satellite',
      scale: '2',
      key: apiKey,
    });
    for (const stamp of mapPlotData.stamps) {
      if (stamp.lat != null && stamp.lng != null) {
        const opt = getMapStampOption(stamp.type);
        const hexColor = opt.color.replace('#', '0x') + 'FF';
        const label = opt.label.charAt(0).toUpperCase();
        params.append('markers', `color:${hexColor}|size:mid|label:${label}|${stamp.lat},${stamp.lng}`);
      }
    }
    for (const outline of mapPlotData.outlines) {
      const geo = outline.points.filter(p => p.lat != null && p.lng != null);
      if (geo.length >= 2) {
        // Close the polygon explicitly so the final stroke segment is rendered
        const closedGeo = outline.isClosed ? [...geo, geo[0]] : geo;
        const coords = closedGeo.map(p => `${p.lat},${p.lng}`).join('|');
        params.append('path', `color:0x3b82f6FF|weight:2|fillcolor:0x3b82f620|${coords}`);
      }
    }
    return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
  })() : null;

  return (
    <>
      <button
        type="button"
        className={styles.readOnlyThumbnail}
        onClick={() => { setModalMapData(mapPlotData); setShowModal(true); }}
        aria-label="Open map preview"
      >
        {staticMapUrl ? (
          <img src={staticMapUrl} alt="Map preview" className={styles.readOnlyMapImg} />
        ) : (
          <div className={styles.readOnlyPlaceholder}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span>Tap to view map</span>
          </div>
        )}
        <div className={styles.readOnlyBadge}>
          {stampCount > 0 && <span>{stampCount} stamp{stampCount !== 1 ? 's' : ''}</span>}
          {outlineCount > 0 && <span>{outlineCount} outline{outlineCount !== 1 ? 's' : ''}</span>}
          <span className={styles.readOnlyBadgeHint}>Tap to expand ↗</span>
        </div>
      </button>

      {showModal && (
        <div className={styles.readOnlyModal}>
          <button
            type="button"
            className={styles.readOnlyModalClose}
            onClick={() => setShowModal(false)}
          >
            ✕ Close
          </button>
          <div className={styles.readOnlyModalInner}>
            <StepMapPlot
              companyId=""
              mapPlotData={modalMapData}
              onChange={setModalMapData}
              onBack={() => setShowModal(false)}
              onNext={() => setShowModal(false)}
              canNext={false}
            />
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
}: MapPlotCanvasProps) {
  if (isReadOnly) {
    return <ReadOnlySummary mapPlotData={mapPlotData} />;
  }

  return (
    <StepMapPlot
      companyId={companyId ?? ''}
      mapPlotData={mapPlotData}
      onChange={onChange}
      onBack={onBack ?? (() => undefined)}
      onNext={onNext ?? (() => undefined)}
      canNext={canNext}
    />
  );
}
