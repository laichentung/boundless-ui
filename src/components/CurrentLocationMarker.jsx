import { useEffect, useState } from "react";
import { Marker, useMap } from "react-leaflet";
import L from "leaflet";

export default function CurrentLocationMarker({ onLocate, setMap }) {
  const [position, setPosition] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const map = useMap();

  useEffect(() => {
    if (setMap) {
      setMap(map);
    }
  }, [map, setMap]);

  const handleLocate = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const newPosition = [latitude, longitude];
          setPosition(newPosition);
          onLocate(newPosition);
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLocating(false);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      setIsLocating(false);
    }
  };

  useEffect(() => {
    handleLocate();
  }, []);

  if (!position) return null;

  return (
    <Marker
      position={position}
      icon={L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="bg-blue-500 border rounded-full p-2 shadow">
                <div class="w-2 h-2 rounded-full bg-white"></div>
              </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })}
    />
  );
} 