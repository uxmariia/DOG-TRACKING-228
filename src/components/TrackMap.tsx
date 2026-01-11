import React, { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { GeoPosition } from '../utils/geolocation';

// Локальні спрощені типи, щоб не тягнути нічого з App.tsx
type SimpleTrailPoint = {
  lat: number;
  lng: number;
  timestamp?: number;
};

type SimpleObjectMarker = {
  id: string;
  lat: number;
  lng: number;
};

interface TrackMapProps {
  trailPoints: SimpleTrailPoint[];
  objects: SimpleObjectMarker[];
  lastPosition: GeoPosition | null;
}

function FitBoundsOnData({
  trailPoints,
  lastPosition,
}: {
  trailPoints: SimpleTrailPoint[];
  lastPosition: GeoPosition | null;
}) {
  const map = useMap();

  useEffect(() => {
    // Якщо є трек – фокусуємось на ньому
    if (trailPoints.length > 0) {
      const latlngs = trailPoints.map((p) => L.latLng(p.lat, p.lng));
      const bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds, { padding: [40, 40] });
      return;
    }

    // Якщо треку ще нема, але є поточна позиція
    if (lastPosition) {
      map.setView([lastPosition.lat, lastPosition.lng], 17);
      return;
    }

    // Фолбек — центр України
    map.setView([49.0, 31.0], 6);
  }, [trailPoints, lastPosition, map]);

  return null;
}

const TrackMap: React.FC<TrackMapProps> = ({
  trailPoints,
  objects,
  lastPosition,
}) => {
  return (
    <MapContainer
      className="w-full h-full"
      center={[49.0, 31.0]}
      zoom={6}
      scrollWheelZoom={true}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBoundsOnData trailPoints={trailPoints} lastPosition={lastPosition} />

      {/* Лінія треку */}
      {trailPoints.length > 1 && (
        <Polyline
          positions={trailPoints.map(
            (p) => [p.lat, p.lng] as [number, number],
          )}
          weight={4}
          color="#3b82f6"
        />
      )}

      {/* Точки треку */}
      {trailPoints.map((p, i) => (
        <CircleMarker
          key={`p-${p.lat}-${p.lng}-${i}`}
          center={[p.lat, p.lng]}
          radius={i === trailPoints.length - 1 ? 6 : 4}
          pathOptions={{
            color:
              i === 0
                ? '#22c55e' // старт
                : i === trailPoints.length - 1
                ? '#ef4444' // кінець
                : '#3b82f6', // проміжні
            weight: 2,
            fillOpacity: 0.9,
          }}
        />
      ))}

      {/* Об’єкти */}
      {objects.map((o, i) => (
        <CircleMarker
          key={`o-${o.id}-${i}`}
          center={[o.lat, o.lng]}
          radius={7}
          pathOptions={{
            color: '#f97316',
            weight: 3,
            fillOpacity: 0.9,
          }}
        />
      ))}

      {/* Поточна позиція "я тут" */}
      {lastPosition && (
        <CircleMarker
          center={[lastPosition.lat, lastPosition.lng]}
          radius={6}
          pathOptions={{
            color: '#0ea5e9',
            weight: 3,
            fillOpacity: 0.7,
          }}
        />
      )}
    </MapContainer>
  );
};

export default TrackMap;
