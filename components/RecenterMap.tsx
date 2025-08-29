'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface RecenterMapProps {
  center: [number, number];
}

export const RecenterMap: React.FC<RecenterMapProps> = ({ center }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center); // recenter map whenever center changes
  }, [center, map]);

  return null;
};
