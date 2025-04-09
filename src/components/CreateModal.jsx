// 類別清單
const activityCategories = [
  "Meal", "Ride", "Meet-up", "Entertainment",
  "Relaxation", "Learning", "Help", "Others",
];

const resourceCategories = [
  "Food / Drinks", "Items", "Clothing", "Space", "Parking", "Others",
];

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, useMapEvents, Marker, useMap } from "react-leaflet";
import { supabase } from "../../lib/supabase";
import L from "leaflet";
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
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState(null);
  const [location, setLocation] = useState(null);
  const [inputLocation, setInputLocation] = useState("");
  const mapRef = useRef();

  const [formData, setFormData] = useState({
    title: "",
    timeStart: "",
    timeEnd: "",
    price: "",
    unit: "USD",
    description: "",
    photos: [],
  });

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData({ ...formData, photos: files });
  };

  const handleLocationInput = () => {
    if (!inputLocation) return;
    const latLngMatch = inputLocation.match(/(-?[\d.]+)[,\s]+(-?[\d.]+)/);
    const atMatch = inputLocation.match(/@(-?[\d.]+),(-?[\d.]+)/);
    const queryMatch = inputLocation.match(/[?&](q|ll)=(-?[\d.]+),(-?[\d.]+)/);

    let lat = null;
    let lng = null;

    if (latLngMatch) {
      lat = parseFloat(latLngMatch[1]);
      lng = parseFloat(latLngMatch[2]);
    } else if (atMatch) {
      lat = parseFloat(atMatch[1]);
      lng = parseFloat(atMatch[2]);
    } else if (queryMatch) {
      lat = parseFloat(queryMatch[2]);
      lng = parseFloat(queryMatch[3]);
    }

    if (lat && lng) {
      setLocation([lat, lng]);
      if (mapRef.current) mapRef.current.setView([lat, lng], 15);
    } else {
      alert("⚠️ 請輸入有效的經緯度或含座標的 Google Maps 連結。");
    }
  };

  const recenter = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setLocation(coords);
        if (mapRef.current) mapRef.current.setView(coords, 15);
      });
    }
  };

  const handleSubmit = async () => {
    const activity = {
      title: formData.title,
      description: formData.description,
      type: selected?.type,
      category: selected?.label,
      latitude: location?.[0],
      longitude: location?.[1],
      time_start: formData.timeStart,
      time_end: formData.timeEnd,
      price: formData.unit === "Free" ? 0 : parseFloat(formData.price),
      unit: formData.unit,
      photos: [],
    };
    console.log("Submitting activity:", activity);
    const { data, error } = await supabase.from("activities").insert([activity]);
    console.log("Supabase 回應：", { data, error });

    if (error) {
      alert("❌ 發佈失敗：" + error.message);
    } else {
      alert("✅ 發佈成功！");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-[90%] max-w-md rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {step === 1 ? "I want to share..." : "Shared Details"}
          </h2>
          <button onClick={onClose} className="text-sm text-gray-400 hover:text-black">✕</button>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 mb-2">Service / Activity</h3>
            <div className="grid grid-cols-2 gap-3">
              {activityCategories.map(label => (
                <button key={label} onClick={() => { setSelected({ type: "activity", label }); setStep(2); }}
                  className="p-3 rounded-xl border border-gray-300 hover:border-black hover:bg-gray-50 text-sm capitalize">
                  {label}
                </button>
              ))}
            </div>
            <h3 className="text-sm font-semibold text-gray-500 mb-2">Resource</h3>
            <div className="grid grid-cols-2 gap-3">
              {resourceCategories.map(label => (
                <button key={label} onClick={() => { setSelected({ type: "resource", label }); setStep(2); }}
                  className="p-3 rounded-xl border border-gray-300 hover:border-black hover:bg-gray-50 text-sm capitalize">
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <input name="title" type="text" placeholder="Title"
              onChange={handleInput} className="w-full border px-3 py-2 rounded-md" />

            <label className="block text-sm font-semibold text-gray-600">Time</label>
            <div className="flex gap-2 items-center">
              <input name="timeStart" type="datetime-local" onChange={handleInput}
                className="w-full border px-3 py-2 rounded-md" />
              <span className="text-gray-500">-</span>
              <input name="timeEnd" type="datetime-local" onChange={handleInput}
                className="w-full border px-3 py-2 rounded-md" />
            </div>

            <label className="block text-sm font-semibold text-gray-600">Location</label>
            <button onClick={recenter} className="mb-2 text-sm px-3 py-1 border rounded-md bg-white w-full">
              📍 Use My Current Location
            </button>
            <div className="flex gap-2">
              <input type="text" value={inputLocation} onChange={(e) => setInputLocation(e.target.value)}
                placeholder="Enter coordinates or Google Maps link"
                className="flex-1 px-3 py-2 border rounded-md" />
              <button onClick={handleLocationInput}
                className="px-3 py-2 text-sm border rounded-md bg-white whitespace-nowrap">
                Set
              </button>
            </div>

            <div className="relative w-full h-56 rounded-md overflow-hidden">
              <MapContainer ref={mapRef} center={[25.033, 121.5654]} zoom={14}
                style={{ height: "100%", width: "100%" }} attributionControl={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="" />
                <LocationSelector setLocation={setLocation} />
                <CenterOnCurrentLocation setLocation={setLocation} />
                {location && (
                  <Marker position={location} icon={L.icon({
                    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
                  })} />
                )}
              </MapContainer>
            </div>

            <label className="block text-sm font-semibold text-gray-600">Price</label>
            <div className="flex gap-2">
              <select name="unit" value={formData.unit} onChange={handleInput}
                className="border px-3 py-2 rounded-md">
                <option value="USD">$</option>
                <option value="Bound">Bound</option>
                <option value="Free">Free</option>
              </select>
              <input name="price" type="number" placeholder="Amount" onChange={handleInput}
                disabled={formData.unit === "Free"}
                className="flex-1 border px-3 py-2 rounded-md bg-white disabled:bg-gray-100" />
            </div>

            <textarea name="description" placeholder="Description" onChange={handleInput}
              className="w-full border px-3 py-2 rounded-md" />
            <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="w-full" />
            <div className="flex gap-2 overflow-x-auto">
              {formData.photos.map((file, i) => (
                <img key={i} src={URL.createObjectURL(file)} alt="preview"
                  className="h-20 w-20 object-cover rounded-md border" />
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button onClick={handleSubmit} className="bg-black text-white px-4 py-2 rounded-md">
                Publish
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}