import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, useMapEvents, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { Crosshair } from "lucide-react";
import "leaflet/dist/leaflet.css";

function LocationSelector({ setLocation }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setLocation([lat, lng]);
    },
  });
  return null;
}

function CenterOnCurrentLocation({ setLocation }) {
  const map = useMap();
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setLocation(coords);
        map.setView(coords, 15);
      });
    }
  }, [map, setLocation]);
  return null;
}

export default function CreateModal({ onClose }) {
  const [location, setLocation] = useState(null);
  const [inputLocation, setInputLocation] = useState("");
  const mapRef = useRef();

  const recenter = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setLocation(coords);
        if (mapRef.current) {
          mapRef.current.setView(coords, 15);
        }
      });
    }
  };

  const handleLocationInput = () => {
    if (!inputLocation) return;

    const latLngMatch = inputLocation.match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
    const googleLinkMatch = inputLocation.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);

    if (latLngMatch) {
      const lat = parseFloat(latLngMatch[1]);
      const lng = parseFloat(latLngMatch[2]);
      setLocation([lat, lng]);
      if (mapRef.current) mapRef.current.setView([lat, lng], 15);
    } else if (googleLinkMatch) {
      const lat = parseFloat(googleLinkMatch[1]);
      const lng = parseFloat(googleLinkMatch[2]);
      setLocation([lat, lng]);
      if (mapRef.current) mapRef.current.setView([lat, lng], 15);
    } else {
      alert("Please enter coordinates like '25.033, 121.5654' or a Google Maps link.");
    }
  };

  return (
    <div className="relative w-full h-56 rounded-md overflow-hidden">
      <input
        type="text"
        value={inputLocation}
        onChange={(e) => setInputLocation(e.target.value)}
        placeholder="Enter coordinates or Google Maps link"
        className="mb-2 w-full px-3 py-2 border rounded-md"
      />
      <button
        onClick={handleLocationInput}
        className="mb-3 px-3 py-1 text-sm border rounded-md bg-white mr-2"
      >
        Set Location
      </button>
      <button
        onClick={recenter}
        className="mb-3 px-3 py-1 text-sm border rounded-md bg-white"
      >
        📍 Use My Current Location
      </button>

      <MapContainer
        ref={mapRef}
        center={[25.033, 121.5654]}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution=""
        />
        <LocationSelector setLocation={setLocation} />
        <CenterOnCurrentLocation setLocation={setLocation} />
        {location && (
          <Marker
            position={location}
            icon={L.icon({
              iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
              shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            })}
          />
        )}
      </MapContainer>
    </div>
  );
}
