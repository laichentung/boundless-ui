import { useEffect, useState } from "react";
import {
  User,
  Wallet,
  Share2,
  Bot,
  CalendarCheck2,
  Plus,
  Filter,
  LocateFixed,
  MapIcon,
  ListIcon,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import CreateModal from "./components/CreateModal";

// Fix Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function CurrentLocationMarker({ onLocate, setMap }) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const map = useMap();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setPosition(coords);
          onLocate(coords);
          setMap(map);
          map.setView(coords, 15);
        },
        (err) => {
          setError("定位失敗，請允許位置存取");
          console.error("Geolocation error:", err);
        }
      );
    } else {
      setError("瀏覽器不支援定位功能");
    }
  }, [map, onLocate, setMap]);

  return (
    <>
      {position && (
        <Marker position={position}>
          <Popup>You are here</Popup>
        </Marker>
      )}
      {error && (
        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded z-[999]">
          {error}
        </div>
      )}
    </>
  );
}

export default function App() {
  const [showFilter, setShowFilter] = useState(false);
  const [mode, setMode] = useState("map");
  const [mapCenter, setMapCenter] = useState([25.0340, 121.5623]);
  const [mapRef, setMapRef] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="bg-white flex justify-center min-h-screen">
      <div className="flex flex-col w-full max-w-[430px] min-h-screen bg-white relative pb-4 mx-auto">
        <div className="flex justify-between items-center px-4 py-3 border-b">
          <div className="flex items-center space-x-2">
            <div className="relative w-6 h-6 rounded-full bg-black">
              <div className="absolute w-1 h-1 bg-white rounded-full top-1 left-1" />
            </div>
            <span className="font-semibold text-lg">Boundless</span>
          </div>
          <div className="flex space-x-2">
            <button
              className={`p-2 rounded ${mode === "map" ? "bg-black text-white" : "bg-gray-200 text-black"}`}
              onClick={() => setMode("map")}
            >
              <MapIcon className="w-4 h-4" />
            </button>
            <button
              className={`p-2 rounded ${mode === "list" ? "bg-black text-white" : "bg-gray-200 text-black"}`}
              onClick={() => setMode("list")}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="relative flex-1 z-0">
          {mode === "map" ? (
            <MapContainer
              center={mapCenter}
              zoom={13}
              scrollWheelZoom={true}
              zoomControl={false}
              className="absolute top-0 left-0 right-0 bottom-0 z-0"
            >
              <TileLayer
                attribution='&copy; Carto'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />
              <CurrentLocationMarker onLocate={setMapCenter} setMap={setMapRef} />
            </MapContainer>
          ) : (
            <div className="p-4 space-y-4">
              <div className="bg-white rounded-xl shadow p-4">
                <div className="font-semibold">Street Music Night</div>
                <div className="text-sm text-gray-600">Central Park · 7:00 PM</div>
              </div>
              <div className="bg-white rounded-xl shadow p-4">
                <div className="font-semibold">Sunset Kayaking</div>
                <div className="text-sm text-gray-600">River Dock · 5:30 PM</div>
              </div>
            </div>
          )}

          {/* 🔍 Search Bar */}
          {mode === "map" && (
            <div className="absolute top-[10px] left-0 right-0 px-4 z-10">
              <input
                type="text"
                placeholder="Search..."
                className="w-full p-3 rounded-xl border border-gray-300 bg-white shadow"
              />
            </div>
          )}

          {/* 📍 Recenter / Filter / + 按鈕 */}
          {mode === "map" && (
            <div className="absolute bottom-12 right-4 flex flex-col space-y-3 z-10">
              <button
                className="bg-white border rounded-full p-3 shadow"
                onClick={() => {
                  if (mapRef && mapCenter) {
                    mapRef.setView(mapCenter, 15);
                  }
                }}
              >
                <LocateFixed className="w-6 h-6 text-black" />
              </button>
              <button className="bg-white border rounded-full p-3 shadow">
                <Filter className="w-6 h-6 text-black" />
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="bg-black text-white rounded-full p-3 shadow"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>

        <div className="h-16 w-full border-t flex justify-around items-center bg-white static mt-auto">
          <div className="flex flex-col items-center text-xs">
            <User className="w-5 h-5" />
            <span>Profile</span>
          </div>
          <div className="flex flex-col items-center text-xs">
            <Wallet className="w-5 h-5" />
            <span>Bound</span>
          </div>
          <div className="flex flex-col items-center text-xs font-semibold text-black">
            <Share2 className="w-5 h-5" />
            <span>Share</span>
          </div>
          <div className="flex flex-col items-center text-xs">
            <Bot className="w-5 h-5" />
            <span>AI</span>
          </div>
          <div className="flex flex-col items-center text-xs">
            <CalendarCheck2 className="w-5 h-5" />
            <span>To-do</span>
          </div>
        </div>

        {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}
      </div>
    </div>
  );
}
