'use client';

import React, { useEffect, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, PolylineF, HeatmapLayerF } from '@react-google-maps/api';

const STADIUM_CENTER = { lat: 51.556, lng: -0.2795 }; // Wembley Stadium center

const MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#0f172a' }] }, // slate-900
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1e293b' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#334155' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#334155' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#020617' }] },
];

// Operational markers coordinates
const gates = [
  { id: 'Gate_A', name: 'Gate A (North Entrance)', position: { lat: 51.5566, lng: -0.2808 }, crowd: 'high' },
  { id: 'Gate_B', name: 'Gate B (East Entrance)', position: { lat: 51.5568, lng: -0.2781 }, crowd: 'low' },
  { id: 'Gate_C', name: 'Gate C (South Exit)', position: { lat: 51.5552, lng: -0.2778 }, crowd: 'medium' },
  { id: 'Gate_D', name: 'Gate D (West Exit)', position: { lat: 51.5550, lng: -0.2805 }, crowd: 'low' },
];

const parkingLots = [
  { id: 'Lot_A', name: 'Parking Lot A', position: { lat: 51.5578, lng: -0.2810 }, occupancy: '95%' },
  { id: 'Lot_B', name: 'Parking Lot B', position: { lat: 51.5540, lng: -0.2765 }, occupancy: '35%' },
];

// Pre-defined polyline paths for dynamic routes
const routes = {
  fastest: [
    { lat: 51.556, lng: -0.2795 }, // Center
    { lat: 51.5562, lng: -0.2802 },
    { lat: 51.5566, lng: -0.2808 }, // Gate A
  ],
  leastCrowded: [
    { lat: 51.556, lng: -0.2795 }, // Center
    { lat: 51.5558, lng: -0.2788 },
    { lat: 51.5564, lng: -0.2783 },
    { lat: 51.5568, lng: -0.2781 }, // Gate B (East - Low crowd)
  ],
  wheelchair: [
    { lat: 51.556, lng: -0.2795 }, // Center (Elevator lobby)
    { lat: 51.5554, lng: -0.2792 }, // Level Ramp
    { lat: 51.5550, lng: -0.2805 }, // Gate D (West ADA Access)
  ],
  emergency: [
    { lat: 51.556, lng: -0.2795 }, // Center
    { lat: 51.5551, lng: -0.2797 },
    { lat: 51.5543, lng: -0.2799 }, // Outer perimeter exit
  ],
};

const routeStyles = {
  fastest: { strokeColor: '#818cf8', strokeWidth: 6 }, // Indigo
  leastCrowded: { strokeColor: '#10b981', strokeWidth: 6 }, // Green
  wheelchair: { strokeColor: '#0ea5e9', strokeWidth: 6 }, // Sky Blue
  emergency: { strokeColor: '#ef4444', strokeWidth: 6, strokeDashArray: '10, 5' }, // Red flashing-like dash
};

interface StadiumMapProps {
  selectedRoute: 'fastest' | 'leastCrowded' | 'wheelchair' | 'emergency';
  focusLocation: { lat: number; lng: number } | null;
  showHeatmap: boolean;
}

export const StadiumMap: React.FC<StadiumMapProps> = ({
  selectedRoute,
  focusLocation,
  showHeatmap,
}) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: ['visualization'],
  });

  const mapRef = useRef<google.maps.Map | null>(null);

  // Focus Map camera on coordinate updates
  useEffect(() => {
    if (mapRef.current && focusLocation) {
      mapRef.current.panTo(focusLocation);
      mapRef.current.setZoom(19);
    }
  }, [focusLocation]);

  if (loadError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-900 border border-white/5 rounded-2xl text-red-400 font-mono text-xs">
        ⚠️ Google Maps load failure. Please verify NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-900 border border-white/5 rounded-2xl">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-sky-500/20 border-t-sky-500 animate-spin" />
          <p className="text-xs text-slate-400 font-light">Loading Spatial Engine...</p>
        </div>
      </div>
    );
  }

  // Set up mock heatmap coordinates weighted around crowd blocks
  const heatmapData = [
    new google.maps.LatLng(51.5566, -0.2808), // Gate A
    new google.maps.LatLng(51.5565, -0.2807),
    new google.maps.LatLng(51.5567, -0.2809),
    new google.maps.LatLng(51.5562, -0.2802), // Corridor B
    new google.maps.LatLng(51.5561, -0.2801),
    new google.maps.LatLng(51.5558, -0.2778), // Concession C
    new google.maps.LatLng(51.5557, -0.2779),
  ];

  return (
    <div className="h-full w-full relative rounded-2xl overflow-hidden border border-white/5">
      <GoogleMap
        mapContainerClassName="h-full w-full"
        center={STADIUM_CENTER}
        zoom={17}
        onLoad={(map) => {
          mapRef.current = map;
        }}
        onUnmount={() => {
          mapRef.current = null;
        }}
        options={{
          styles: MAP_STYLES,
          disableDefaultUI: true,
          zoomControl: true,
        }}
      >
        {/* Heatmap Layer */}
        {showHeatmap && (
          <HeatmapLayerF
            data={heatmapData}
            options={{
              radius: 25,
              opacity: 0.8,
            }}
          />
        )}

        {/* Dynamic Route Polyline */}
        <PolylineF
          path={routes[selectedRoute]}
          options={{
            strokeColor: routeStyles[selectedRoute].strokeColor,
            strokeWeight: routeStyles[selectedRoute].strokeWidth,
            strokeOpacity: 0.9,
            icons: routeStyles[selectedRoute].strokeDashArray
              ? [
                  {
                    icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 4 },
                    offset: '0',
                    repeat: '20px',
                  },
                ]
              : undefined,
          }}
        />

        {/* Gate Pins */}
        {gates.map((gate) => (
          <MarkerF
            key={gate.id}
            position={gate.position}
            title={gate.name}
            label={{
              text: gate.id.split('_')[1],
              color: '#ffffff',
              fontWeight: 'bold',
            }}
            icon={{
              path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
              fillColor: gate.crowd === 'high' ? '#ef4444' : gate.crowd === 'medium' ? '#f59e0b' : '#10b981',
              fillOpacity: 0.9,
              strokeColor: '#ffffff',
              strokeWeight: 1,
              scale: 6,
            }}
          />
        ))}

        {/* Parking Pins */}
        {parkingLots.map((lot) => (
          <MarkerF
            key={lot.id}
            position={lot.position}
            title={`${lot.name}: ${lot.occupancy} Full`}
            label={{
              text: 'P',
              color: '#0f172a',
              fontWeight: 'bold',
            }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: lot.occupancy === '95%' ? '#ef4444' : '#10b981',
              fillOpacity: 0.9,
              strokeColor: '#ffffff',
              strokeWeight: 1,
              scale: 8,
            }}
          />
        ))}
      </GoogleMap>
    </div>
  );
};
