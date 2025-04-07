import { useEffect, useState } from "react";
import {
  User,
  Wallet,
  Share2,
  Bot,
  CalendarCheck2,
  Plus,
  Filter,
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

// 修正 Leaflet marker 圖示載入
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ✅ 使用者定位 + 地圖移動中心
function CurrentLocationMarker() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const map = useMap(); // 地圖控制器

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setPosition(coords);
          map.setView(coords, 15); // ✅ 讓地圖以定位為中心
        },
        (err) => {
          setError("定位失敗，請允許位置存取");
          console.error("Geolocation error:", err);
        }
      );
    } else {
      setError("瀏覽器不支援定位功能");
    }
  }, [map]);

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

  return (
    <div className="bg-neutral-100 flex justify-center min-h-screen">
      <div className="flex flex-col w-full max-w-[430px] min-h-screen bg-white shadow-md relative pb-16">

        {/* Top Search */}
        <div className="p-4 z-10 bg-white">
          <input
            type="text"
            placeholder="Search..."
            className="w-full p-3 rounded-xl border border-gray-300"
          />
          <div className="flex justify-between items-center mt-4">
            <button
              className="border px-3 py-1 rounded flex items-center text-sm"
              onClick={() => setShowFilter(!showFilter)}
            >
              <Filter className="w-4 h-4 mr-1" /> Filter
            </button>
            <button className="bg-black text-white rounded-full p-2">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Map + Floating Cards */}
        <div className="relative flex-1 z-0">
          <MapContainer
            center={[25.0340, 121.5623]} // 預設台北，會被 setView 替換
            zoom={13}
            scrollWheelZoom={true}
            className="h-full w-full z-0"
          >
            <TileLayer
              attribution='&copy; Carto'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            <CurrentLocationMarker />
          </MapContainer>

          {/* Floating Cards */}
          <div className="absolute bottom-20 left-0 right-0 px-4 space-y-3 z-10">
            <div className="bg-white rounded-xl shadow p-4">
              <div className="font-semibold">Street Music Night</div>
              <div className="text-sm text-gray-600">Central Park · 7:00 PM</div>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <div className="font-semibold">Sunset Kayaking</div>
              <div className="text-sm text-gray-600">River Dock · 5:30 PM</div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="h-16 w-full border-t flex justify-around items-center bg-white shadow-md fixed bottom-0 left-0 max-w-[430px] z-20">
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
      </div>
    </div>
  );
}