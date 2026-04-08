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
}

export function MapPlotStep({ address, initialData, onChange, onBack, onNext, canNext }: MapPlotStepProps) {
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
    />
  );
}

export function getPlottedPestTypes(data: MapPlotData): string[] {
  const types = new Set<string>();
  for (const stamp of data.stamps) {
    if (isMapPestStampType(stamp.type)) {
      types.add(getMapStampOption(stamp.type).label.toLowerCase());
    }
  }
  return Array.from(types);
}
