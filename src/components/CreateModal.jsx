import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, useMapEvents, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { Crosshair } from "lucide-react";
import "leaflet/dist/leaflet.css";

const MAPBOX_TOKEN = "pk.eyJ1IjoiYnJpYW4tbGFpIiwiYSI6ImNtOTlkazNtaTBjN3Yyam9vNXAydm9hdTkifQ.MizQ_5fggvWX0OWuwiRHWw";

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

  return (
    <div className="relative w-full h-64 rounded-md overflow-hidden">
      <div className="relative w-full h-full">
        <MapContainer
          ref={mapRef}
          center={[25.033, 121.5654]}
          zoom={14}
          style={{ height: "100%", width: "100%" }}
          attributionControl={false}
        >
          <TileLayer
            url={`https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/256/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`}
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
        <button
          onClick={recenter}
          className="absolute bottom-2 right-2 z-[999] bg-white p-2 rounded-full shadow"
        >
          <Crosshair className="w-5 h-5" />
        </button>
        <button
          onClick={recenter}
          className="absolute top-2 right-2 text-sm text-blue-500 underline bg-white px-2 py-1 rounded"
        >
          📍 Use My Current Location
        </button>
      </div>
    </div>
  );
}
