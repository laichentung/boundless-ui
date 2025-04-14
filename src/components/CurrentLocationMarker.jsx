import { useEffect, useRef, useState } from "react";
import { Marker, useMap } from "react-leaflet";
import L from "leaflet";

export default function CurrentLocationMarker({ onLocate, setMap }) {
  const map = useMap();
  const markerRef = useRef();
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const location = [latitude, longitude];
          setPosition(location);
          onLocate(location);
          if (setMap) setMap(map);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, [map, onLocate, setMap]);

  const createCurrentLocationIcon = () => {
    return L.divIcon({
      className: 'current-location-icon',
      html: `
        <div class="relative">
          <div class="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs font-medium text-black bg-white px-2 py-0.5 rounded shadow whitespace-nowrap">
            You are here
          </div>
          <div class="relative">
            <div class="w-8 h-8 rounded-full border-2 border-white shadow-lg animate-pulse" style="background-color: #3B82F6">
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="w-4 h-4 rounded-full bg-white animate-ping"></div>
              </div>
            </div>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-6 h-6 rounded-full border-2 border-white animate-ping" style="background-color: #3B82F6"></div>
            </div>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });
  };

  if (!position) return null;

  return (
    <Marker
      position={position}
      icon={createCurrentLocationIcon()}
      ref={markerRef}
    />
  );
} 