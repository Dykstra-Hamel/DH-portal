'use client';

import { MapPlotCanvas } from '@/components/FieldMap/MapPlot/MapPlotCanvas/MapPlotCanvas';
import { MapPlotData, DEFAULT_MAP_PLOT_DATA, getMapStampOption, isMapPestStampType } from '@/components/FieldMap/MapPlot/types';

interface MapPlotStepProps {
  address: string;
  initialData: MapPlotData;
  onChange: (data: MapPlotData) => void;
  onBack: () => void;
  onNext: () => void;
  canNext: boolean;
  companyId?: string;
}

export function MapPlotStep({ address, initialData, onChange, onBack, onNext, canNext, companyId }: MapPlotStepProps) {
  const data = initialData.addressInput ? initialData : {
    ...DEFAULT_MAP_PLOT_DATA,
    addressInput: address,
    backgroundMode: 'satellite' as const,
  };

  return (
    <MapPlotCanvas
      mapPlotData={data}
      onChange={onChange}
      onBack={onBack}
      onNext={onNext}
      canNext={canNext}
      companyId={companyId}
    />
  );
}

export function getPlottedPestTypes(data: MapPlotData): string[] {
  const types = new Set<string>();
  for (const stamp of data.stamps) {
    if (isMapPestStampType(stamp.type)) {
      const label = stamp.displayLabel || getMapStampOption(stamp.type).label;
      types.add(label.toLowerCase());
    }
  }
  return Array.from(types);
}

export function getPlottedPestIds(data: MapPlotData): string[] {
  const ids = new Set<string>();
  for (const stamp of data.stamps) {
    if (isMapPestStampType(stamp.type) && stamp.pestId) {
      ids.add(stamp.pestId);
    }
  }
  return Array.from(ids);
}

export function getPlottedPests(data: MapPlotData): Array<{ id: string; label: string }> {
  const seen = new Set<string>();
  const result: Array<{ id: string; label: string }> = [];
  for (const stamp of data.stamps) {
    if (!isMapPestStampType(stamp.type)) continue;
    const id = stamp.pestId ?? stamp.type;
    if (seen.has(id)) continue;
    seen.add(id);
    result.push({ id, label: stamp.displayLabel || getMapStampOption(stamp.type).label });
  }
  return result;
}
