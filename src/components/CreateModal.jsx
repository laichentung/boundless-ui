import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, useMapEvents, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { Crosshair } from "lucide-react";
import "leaflet/dist/leaflet.css";

const MAPBOX_TOKEN = "pk.eyJ1IjoiYnJpYW4tbGFpIiwiYSI6ImNtOTlkazNtaTBjN3Yyam9vNXAydm9hdTkifQ.MizQ_5fggvWX0OWuwiRHWw";

const categories = [
  { type: "activity", label: "Meal" },
  { type: "activity", label: "Ride" },
  { type: "activity", label: "Meet-up" },
  { type: "activity", label: "Help" },
  { type: "activity", label: "Relaxation" },
  { type: "activity", label: "Entertainment" },
  { type: "activity", label: "Others" },
  { type: "resource", label: "Space" },
  { type: "resource", label: "Parking" },
  { type: "resource", label: "Food / Drinks" },
  { type: "resource", label: "Items" },
  { type: "resource", label: "Clothing" },
  { type: "resource", label: "Others" },
];

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
  const [clickMarker, setClickMarker] = useState(null);
  const [address, setAddress] = useState("");
  const [suggestions, setSuggestions] = useState([]);
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

  const handleAddressSearch = async (text) => {
    setAddress(text);
    if (!text) return;
    const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5&language=zh`);
    const data = await res.json();
    setSuggestions(data.features || []);
  };

  const handleSelectSuggestion = (place) => {
    const [lng, lat] = place.center;
    setLocation([lat, lng]);
    setAddress(place.place_name);
    setSuggestions([]);
  };

  const handleSubmit = () => {
    const activity = {
      ...formData,
      location,
      address,
      ...selected,
    };
    console.log("Activity created:", activity);
    onClose();
  };

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-[90%] max-w-md rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {step === 1 && "I want to share..."}
            {step === 2 && "Shared Details"}
          </h2>
          <button onClick={onClose} className="text-sm text-gray-400 hover:text-black">
            ✕
          </button>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-2">Service / Activity</h3>
              <div className="grid grid-cols-2 gap-3">
                {categories.filter(c => c.type === "activity").map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setSelected(item);
                      setStep(2);
                    }}
                    className="p-3 rounded-xl border border-gray-300 hover:border-black hover:bg-gray-50 text-sm capitalize"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-2">Resource</h3>
              <div className="grid grid-cols-2 gap-3">
                {categories.filter(c => c.type === "resource").map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setSelected(item);
                      setStep(2);
                    }}
                    className="p-3 rounded-xl border border-gray-300 hover:border-black hover:bg-gray-50 text-sm capitalize"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <input
              name="title"
              type="text"
              placeholder="Title"
              onChange={handleInput}
              className="w-full border px-3 py-2 rounded-md"
            />
            <label className="block text-sm font-semibold text-gray-600">Time</label>
            <div className="flex gap-2">
              <input
                name="timeStart"
                type="datetime-local"
                onChange={handleInput}
                className="w-full border px-3 py-2 rounded-md"
              />
              <input
                name="timeEnd"
                type="datetime-local"
                onChange={handleInput}
                className="w-full border px-3 py-2 rounded-md"
              />
            </div>

            <label className="block text-sm font-semibold text-gray-600">Location</label>
            <input
              type="text"
              placeholder="Search address..."
              value={address}
              onChange={(e) => handleAddressSearch(e.target.value)}
              className="w-full border px-3 py-2 rounded-md"
            />
            {suggestions.length > 0 && (
              <ul className="border rounded-md p-2 bg-white text-sm space-y-1">
                {suggestions.map((place) => (
                  <li
                    key={place.id}
                    onClick={() => handleSelectSuggestion(place)}
                    className="cursor-pointer hover:bg-gray-100 px-2 py-1"
                  >
                    {place.place_name}
                  </li>
                ))}
              </ul>
            )}

            <div className="relative w-full h-56 rounded-md overflow-hidden">
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

            <label className="block text-sm font-semibold text-gray-600">Price</label>
            <div className="flex gap-2">
              <select
                name="unit"
                value={formData.unit}
                onChange={handleInput}
                className="border px-3 py-2 rounded-md"
              >
                <option value="USD">$</option>
                <option value="Bound">Bound</option>
                <option value="Free">Free</option>
              </select>
              <input
                name="price"
                type="number"
                placeholder="Amount"
                onChange={handleInput}
                disabled={formData.unit === "Free"}
                className="flex-1 border px-3 py-2 rounded-md bg-white disabled:bg-gray-100"
              />
            </div>

            <textarea
              name="description"
              placeholder="Description"
              onChange={handleInput}
              className="w-full border px-3 py-2 rounded-md"
            />
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              className="w-full"
            />
            <div className="flex gap-2 overflow-x-auto">
              {formData.photos.map((file, i) => (
                <img
                  key={i}
                  src={URL.createObjectURL(file)}
                  alt="preview"
                  className="h-20 w-20 object-cover rounded-md border"
                />
              ))}
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSubmit}
                className="bg-black text-white px-4 py-2 rounded-md"
              >
                Publish
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
