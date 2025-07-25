'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMapsLibrary,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  Trash2,
  Plus,
  Save,
  MapPin,
  Circle as CircleIcon,
  Square,
  RefreshCw,
  Check,
} from 'lucide-react';
import styles from './ServiceAreaMap.module.scss';

interface ServiceArea {
  id: string;
  name: string;
  type: 'polygon' | 'radius' | 'zip_code';
  polygon?: { lat: number; lng: number }[];
  center?: { lat: number; lng: number };
  radius?: number; // in miles
  zipCodes?: string[];
  priority: number;
  isActive: boolean;
}

interface ServiceAreaMapProps {
  companyId: string;
  existingAreas: ServiceArea[];
  onAreasChange: (areas: ServiceArea[]) => void;
  onSave: (areas: ServiceArea[]) => Promise<void>;
  googleMapsApiKey: string;
  defaultCenter?: { lat: number; lng: number };
  defaultZoom?: number;
}

// Libraries are loaded automatically by @vis.gl/react-google-maps

const ServiceAreaMap: React.FC<ServiceAreaMapProps> = ({
  companyId,
  existingAreas,
  onAreasChange,
  onSave,
  googleMapsApiKey,
  defaultCenter,
  defaultZoom = 10,
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [drawingManager, setDrawingManager] =
    useState<google.maps.drawing.DrawingManager | null>(null);
  const [serviceAreas, setServiceAreas] =
    useState<ServiceArea[]>(existingAreas);
  const [selectedArea, setSelectedArea] = useState<ServiceArea | null>(null);
  const [drawingMode, setDrawingMode] = useState<'polygon' | 'radius' | null>(
    null
  );
  const [isCreatingArea, setIsCreatingArea] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaPriority, setNewAreaPriority] = useState(0);
  const mapRef = useRef<HTMLDivElement>(null);
  const newAreaNameRef = useRef('');
  const newAreaPriorityRef = useRef(0);
  const prevExistingAreasRef = useRef<ServiceArea[]>([]);

  // Save state tracking
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>(
    'idle'
  );


  const mapContainerStyle = {
    width: '100%',
    height: '500px',
  };

  // Use provided default center or fallback to NYC
  const fallbackCenter = {
    lat: 40.7128,
    lng: -74.006, // New York City
  };

  const initialCenter = defaultCenter || fallbackCenter;

  // Map options
  const mapOptions = {
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: true,
    fullscreenControl: true,
    mapId: 'DEMO_MAP_ID', // Required for AdvancedMarker support
  };

  useEffect(() => {
    // Compare with previous existingAreas to detect real changes from parent
    const prevIds = prevExistingAreasRef.current.map(a => a.id).sort();
    const newIds = existingAreas.map(a => a.id).sort();
    const arraysAreDifferent = prevIds.length !== newIds.length || 
      prevIds.some((id, index) => id !== newIds[index]);
    
    if (arraysAreDifferent) {
      setServiceAreas(existingAreas);
      // Update the ref with the new value
      prevExistingAreasRef.current = existingAreas;
      
      // Only reset unsaved changes if this is truly external data (not our own changes)
      // This happens when new areas have permanent IDs (not temp-*) or when both prev and new are empty
      const hasOnlyTempIds = newIds.every(id => id.startsWith('temp-'));
      const isInitialLoad = prevIds.length === 0 && newIds.length === 0;
      
      if (isInitialLoad || !hasOnlyTempIds) {
        setHasUnsavedChanges(false);
      }
    }
  }, [existingAreas]);

  // Sync refs with state
  useEffect(() => {
    newAreaNameRef.current = newAreaName;
  }, [newAreaName]);

  useEffect(() => {
    newAreaPriorityRef.current = newAreaPriority;
  }, [newAreaPriority]);

  // Sync serviceAreas changes with parent (for state management only, not saving)
  useEffect(() => {
    onAreasChange(serviceAreas);
  }, [serviceAreas, onAreasChange]);

  const handlePolygonComplete = useCallback((polygon: google.maps.Polygon) => {
    const path = polygon.getPath();
    const coordinates: { lat: number; lng: number }[] = [];

    for (let i = 0; i < path.getLength(); i++) {
      const point = path.getAt(i);
      coordinates.push({
        lat: point.lat(),
        lng: point.lng(),
      });
    }

    const currentAreaName = newAreaNameRef.current;
    const currentAreaPriority = newAreaPriorityRef.current;

    if (currentAreaName.trim()) {
      const newArea: ServiceArea = {
        id: `temp-${Date.now()}`,
        name: currentAreaName,
        type: 'polygon',
        polygon: coordinates,
        priority: currentAreaPriority,
        isActive: true,
      };

      setServiceAreas(prev => [...prev, newArea]);
      setHasUnsavedChanges(true);
    } else {
      // Remove the drawn polygon from the map if no name was provided
      polygon.setMap(null);
    }

    // Always reset drawing state after completion
    setNewAreaName('');
    setNewAreaPriority(0);
    newAreaNameRef.current = '';
    newAreaPriorityRef.current = 0;
    setIsCreatingArea(false);
    setDrawingMode(null);
  }, []);

  const handleCircleComplete = useCallback((circle: google.maps.Circle) => {
    const center = circle.getCenter();
    const radiusMeters = circle.getRadius();
    const radiusMiles = radiusMeters / 1609.34; // Convert meters to miles

    const currentAreaName = newAreaNameRef.current;
    const currentAreaPriority = newAreaPriorityRef.current;

    if (currentAreaName.trim()) {
      const newArea: ServiceArea = {
        id: `temp-${Date.now()}`,
        name: currentAreaName,
        type: 'radius',
        center: {
          lat: center?.lat() || 0,
          lng: center?.lng() || 0,
        },
        radius: radiusMiles,
        priority: currentAreaPriority,
        isActive: true,
      };

      setServiceAreas(prev => [...prev, newArea]);
      setHasUnsavedChanges(true);
    } else {
      // Remove the drawn circle from the map if no name was provided
      circle.setMap(null);
    }

    // Always reset drawing state after completion
    setNewAreaName('');
    setNewAreaPriority(0);
    newAreaNameRef.current = '';
    newAreaPriorityRef.current = 0;
    setIsCreatingArea(false);
    setDrawingMode(null);
  }, []);

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      setMap(map);

      // Set initial map position
      map.setCenter(initialCenter);
      map.setZoom(defaultZoom);

      // Initialize drawing manager
      const drawingManagerOptions = {
        drawingMode: null,
        drawingControl: false,
        polygonOptions: {
          fillColor: '#2196F3',
          fillOpacity: 0.3,
          strokeColor: '#2196F3',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          clickable: false,
          editable: true,
          zIndex: 1,
        },
        circleOptions: {
          fillColor: '#FF5722',
          fillOpacity: 0.3,
          strokeColor: '#FF5722',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          clickable: false,
          editable: true,
          zIndex: 1,
        },
      };

      const manager = new google.maps.drawing.DrawingManager(
        drawingManagerOptions
      );
      manager.setMap(map);
      setDrawingManager(manager);

      // Add event listeners for shape completion
      google.maps.event.addListener(
        manager,
        'polygoncomplete',
        (polygon: google.maps.Polygon) => {
          handlePolygonComplete(polygon);
          manager.setDrawingMode(null);
        }
      );

      google.maps.event.addListener(
        manager,
        'circlecomplete',
        (circle: google.maps.Circle) => {
          handleCircleComplete(circle);
          manager.setDrawingMode(null);
        }
      );
    },
    [initialCenter, defaultZoom, handlePolygonComplete, handleCircleComplete]
  );

  const startDrawing = (mode: 'polygon' | 'radius') => {
    if (!drawingManager) return;

    setDrawingMode(mode);
    setIsCreatingArea(true);

    if (mode === 'polygon') {
      drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
    } else if (mode === 'radius') {
      drawingManager.setDrawingMode(google.maps.drawing.OverlayType.CIRCLE);
    }
  };

  const cancelDrawing = () => {
    if (drawingManager) {
      drawingManager.setDrawingMode(null);
    }
    setDrawingMode(null);
    setIsCreatingArea(false);
    setNewAreaName('');
    setNewAreaPriority(0);
  };

  const deleteArea = (areaId: string) => {
    setServiceAreas(prev => prev.filter(area => area.id !== areaId));
    setHasUnsavedChanges(true);
    if (selectedArea?.id === areaId) {
      setSelectedArea(null);
    }
  };

  const toggleAreaActive = (areaId: string) => {
    setServiceAreas(prev =>
      prev.map(area =>
        area.id === areaId ? { ...area, isActive: !area.isActive } : area
      )
    );
    setHasUnsavedChanges(true);
  };

  // getPolygonPaths function no longer needed with direct Google Maps API

  const handleSave = async () => {
    if (!hasUnsavedChanges || isSaving) return;

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      await onSave(serviceAreas);
      setHasUnsavedChanges(false);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving service areas:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // onUnmount callback no longer needed with new library

  return (
    <div className={styles.serviceAreaMap}>
      <div className={styles.mapControls}>
        <div className={styles.drawingControls}>
          <h4>Add Service Area</h4>

          {!isCreatingArea ? (
            <div className={styles.drawingButtons}>
              <button
                onClick={() => startDrawing('polygon')}
                className={styles.drawButton}
                disabled={isCreatingArea}
              >
                <Square size={16} />
                Draw Polygon Area
              </button>

              <button
                onClick={() => startDrawing('radius')}
                className={styles.drawButton}
                disabled={isCreatingArea}
              >
                <CircleIcon size={16} />
                Draw Radius Area
              </button>
            </div>
          ) : (
            <div className={styles.creationForm}>
              <div className={styles.formGroup}>
                <label>Area Name:</label>
                <input
                  type="text"
                  value={newAreaName}
                  onChange={e => {
                    setNewAreaName(e.target.value);
                    newAreaNameRef.current = e.target.value;
                  }}
                  placeholder="Enter area name"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Priority:</label>
                <input
                  type="number"
                  value={newAreaPriority}
                  onChange={e => {
                    const priority = parseInt(e.target.value) || 0;
                    setNewAreaPriority(priority);
                    newAreaPriorityRef.current = priority;
                  }}
                  min="0"
                  max="100"
                />
              </div>


              <div className={styles.formActions}>
                <p className={styles.instruction}>
                  {drawingMode === 'polygon'
                    ? 'Click on the map to draw a polygon area'
                    : 'Click on the map to place the circle center, then drag to set the radius'}
                </p>
                <button onClick={cancelDrawing} className={styles.cancelButton}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.mapContainer}>
        <APIProvider apiKey={googleMapsApiKey}>
          <Map
            style={mapContainerStyle}
            defaultCenter={initialCenter}
            defaultZoom={defaultZoom}
            mapId={mapOptions.mapId}
            zoomControl={mapOptions.zoomControl}
            streetViewControl={mapOptions.streetViewControl}
            mapTypeControl={mapOptions.mapTypeControl}
            fullscreenControl={mapOptions.fullscreenControl}
          >
            <MapContent
              serviceAreas={serviceAreas}
              setSelectedArea={setSelectedArea}
              onLoad={onLoad}
              handlePolygonComplete={handlePolygonComplete}
              handleCircleComplete={handleCircleComplete}
              setDrawingManager={setDrawingManager}
            />
            {/* MapContent component will render the areas */}
          </Map>
        </APIProvider>
      </div>

      {/* Service Areas List */}
      <div className={styles.areasList}>
        <div className={styles.areasHeader}>
          <h4>Service Areas ({serviceAreas.length})</h4>

          <div className={styles.saveSection}>
            {hasUnsavedChanges && (
              <span className={styles.unsavedIndicator}>Unsaved changes</span>
            )}

            <button
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isSaving}
              className={`${styles.saveButton} ${saveStatus === 'success' ? styles.success : ''} ${saveStatus === 'error' ? styles.error : ''}`}
            >
              {isSaving ? (
                <RefreshCw size={16} className={styles.spinning} />
              ) : saveStatus === 'success' ? (
                <Check size={16} />
              ) : (
                <Save size={16} />
              )}
              {isSaving
                ? 'Saving...'
                : saveStatus === 'success'
                  ? 'Saved!'
                  : saveStatus === 'error'
                    ? 'Error'
                    : 'Save Service Areas'}
            </button>
          </div>
        </div>
        {serviceAreas.length === 0 ? (
          <p className={styles.emptyState}>
            No service areas defined. Use the drawing tools above to create
            coverage areas.
          </p>
        ) : (
          <div className={styles.areasGrid}>
            {serviceAreas.map(area => (
              <div
                key={area.id}
                className={`${styles.areaCard} ${selectedArea?.id === area.id ? styles.selected : ''} ${!area.isActive ? styles.inactive : ''}`}
                onClick={() => setSelectedArea(area)}
              >
                <div className={styles.areaHeader}>
                  <div className={styles.areaInfo}>
                    <h5>{area.name}</h5>
                    <span className={styles.areaType}>
                      {area.type === 'polygon' && <Square size={14} />}
                      {area.type === 'radius' && <CircleIcon size={14} />}
                      {area.type === 'zip_code' && <MapPin size={14} />}
                      {area.type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className={styles.areaActions}>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        toggleAreaActive(area.id);
                      }}
                      className={`${styles.toggleButton} ${area.isActive ? styles.active : styles.inactive}`}
                      title={area.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {area.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        deleteArea(area.id);
                      }}
                      className={styles.deleteButton}
                      title="Delete area"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className={styles.areaDetails}>
                  <div className={styles.areaDetail}>
                    <span>Priority:</span>
                    <span>{area.priority}</span>
                  </div>

                  {area.type === 'radius' && area.radius && (
                    <div className={styles.areaDetail}>
                      <span>Radius:</span>
                      <span>{area.radius.toFixed(1)} miles</span>
                    </div>
                  )}

                  {area.type === 'polygon' && area.polygon && (
                    <div className={styles.areaDetail}>
                      <span>Points:</span>
                      <span>{area.polygon.length} vertices</span>
                    </div>
                  )}

                  {area.type === 'zip_code' && area.zipCodes && (
                    <div className={styles.areaDetail}>
                      <span>Zip Codes:</span>
                      <span>{area.zipCodes.length} codes</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// MapContent component to handle drawing and rendering within the map context
interface MapContentProps {
  serviceAreas: ServiceArea[];
  setSelectedArea: (area: ServiceArea | null) => void;
  onLoad: (map: google.maps.Map) => void;
  handlePolygonComplete: (polygon: google.maps.Polygon) => void;
  handleCircleComplete: (circle: google.maps.Circle) => void;
  setDrawingManager: (
    manager: google.maps.drawing.DrawingManager | null
  ) => void;
}

const MapContent: React.FC<MapContentProps> = ({
  serviceAreas,
  setSelectedArea,
  onLoad,
  handlePolygonComplete,
  handleCircleComplete,
  setDrawingManager,
}) => {
  const map = useMap();
  const drawingLibrary = useMapsLibrary('drawing');
  const [polygons, setPolygons] = useState<google.maps.Polygon[]>([]);
  const [circles, setCircles] = useState<google.maps.Circle[]>([]);

  // Initialize drawing manager when map and library are ready
  useEffect(() => {
    if (!map || !drawingLibrary) return;

    // Call the original onLoad callback
    onLoad(map);

    // Initialize drawing manager
    const drawingManagerOptions = {
      drawingMode: null,
      drawingControl: false,
      polygonOptions: {
        fillColor: '#2196F3',
        fillOpacity: 0.3,
        strokeColor: '#2196F3',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        clickable: false,
        editable: true,
        zIndex: 1,
      },
      circleOptions: {
        fillColor: '#FF5722',
        fillOpacity: 0.3,
        strokeColor: '#FF5722',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        clickable: false,
        editable: true,
        zIndex: 1,
      },
    };

    const manager = new drawingLibrary.DrawingManager(drawingManagerOptions);
    manager.setMap(map);
    setDrawingManager(manager);

    // Add event listeners for shape completion
    google.maps.event.addListener(
      manager,
      'polygoncomplete',
      (polygon: google.maps.Polygon) => {
        handlePolygonComplete(polygon);
        manager.setDrawingMode(null);
      }
    );

    google.maps.event.addListener(
      manager,
      'circlecomplete',
      (circle: google.maps.Circle) => {
        handleCircleComplete(circle);
        manager.setDrawingMode(null);
      }
    );

    return () => {
      manager.setMap(null);
    };
  }, [
    map,
    drawingLibrary,
    onLoad,
    handlePolygonComplete,
    handleCircleComplete,
    setDrawingManager,
  ]);

  // Create polygons for existing service areas
  useEffect(() => {
    if (!map) return;

    // Clear existing polygons
    polygons.forEach(polygon => polygon.setMap(null));

    const newPolygons: google.maps.Polygon[] = [];

    serviceAreas
      .filter(area => area.type === 'polygon' && area.polygon)
      .forEach(area => {
        const polygon = new google.maps.Polygon({
          paths: area.polygon!,
          fillColor: area.isActive ? '#2196F3' : '#9E9E9E',
          fillOpacity: 0.3,
          strokeColor: area.isActive ? '#2196F3' : '#9E9E9E',
          strokeOpacity: 0.8,
          strokeWeight: 2,
        });

        polygon.setMap(map);
        polygon.addListener('click', () => setSelectedArea(area));
        newPolygons.push(polygon);
      });

    setPolygons(newPolygons);

    return () => {
      newPolygons.forEach(polygon => polygon.setMap(null));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, serviceAreas, setSelectedArea]);

  // Create circles for existing radius areas
  useEffect(() => {
    if (!map) return;

    // Clear existing circles
    circles.forEach(circle => circle.setMap(null));

    const newCircles: google.maps.Circle[] = [];

    serviceAreas
      .filter(area => area.type === 'radius' && area.center && area.radius)
      .forEach(area => {
        const circle = new google.maps.Circle({
          center: area.center!,
          radius: area.radius! * 1609.34, // Convert miles to meters
          fillColor: area.isActive ? '#FF5722' : '#9E9E9E',
          fillOpacity: 0.3,
          strokeColor: area.isActive ? '#FF5722' : '#9E9E9E',
          strokeOpacity: 0.8,
          strokeWeight: 2,
        });

        circle.setMap(map);
        circle.addListener('click', () => setSelectedArea(area));
        newCircles.push(circle);
      });

    setCircles(newCircles);

    return () => {
      newCircles.forEach(circle => circle.setMap(null));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, serviceAreas, setSelectedArea]);

  return (
    <>
      {/* Render AdvancedMarkers for radius area centers */}
      {serviceAreas
        .filter(area => area.type === 'radius' && area.center)
        .map(area => (
          <AdvancedMarker
            key={area.id}
            position={area.center!}
            title={area.name}
          >
            <Pin
              background={area.isActive ? '#FF5722' : '#9E9E9E'}
              borderColor="#ffffff"
              glyphColor="#ffffff"
              scale={1.2}
            />
          </AdvancedMarker>
        ))}
    </>
  );
};

export default ServiceAreaMap;
