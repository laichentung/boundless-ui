
import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, useMapEvents, Marker, useMap } from "react-leaflet";
import { supabase } from "../../lib/supabase";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const activityCategories = [
  "Meal", "Ride", "Meet-up", "Entertainment",
  "Relaxation", "Learning", "Help", "Others",
];

const resourceCategories = [
  "Food / Drinks", "Items", "Clothing", "Space", "Parking", "Others",
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
    category: "",
    type: "",
    photos: [],
  });

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    const isActivity = activityCategories.includes(value);
    setFormData((prev) => ({
      ...prev,
      category: value,
      type: isActivity ? "activity" : "resource",
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl p-4 w-full max-w-md max-h-[95vh] overflow-y-auto relative">
        <h2 className="text-xl font-semibold mb-4">I want to share...</h2>

        <label className="text-sm text-gray-500">Category</label>
        <select
          value={formData.category}
          onChange={handleCategoryChange}
          className="border p-2 w-full mb-4"
        >
          <optgroup label="Activities">
            {activityCategories.map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </optgroup>
          <optgroup label="Resources">
            {resourceCategories.map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </optgroup>
        </select>

        <input
          name="title"
          type="text"
          placeholder="Title"
          className="border p-2 w-full mb-3"
          value={formData.title}
          onChange={handleInput}
        />

        <textarea
          name="description"
          placeholder="Description"
          className="border p-2 w-full mb-3"
          rows={3}
          value={formData.description}
          onChange={handleInput}
        />

        <label className="text-sm text-gray-500">Time</label>
        <div className="flex gap-2 mb-3">
          <input
            type="datetime-local"
            name="timeStart"
            className="border p-2 flex-1"
            value={formData.timeStart}
            onChange={handleInput}
          />
          <span className="self-center">-</span>
          <input
            type="datetime-local"
            name="timeEnd"
            className="border p-2 flex-1"
            value={formData.timeEnd}
            onChange={handleInput}
          />
        </div>

        <label className="text-sm text-gray-500">Price</label>
        <div className="flex gap-2 mb-4">
          <select
            name="unit"
            value={formData.unit}
            onChange={handleInput}
            className="border p-2"
          >
            <option>Free</option>
            <option>USD</option>
            <option>TWD</option>
            <option>Bound</option>
          </select>
          <input
            name="price"
            type="number"
            className="flex-1 border p-2"
            value={formData.price}
            onChange={handleInput}
            disabled={formData.unit === "Free"}
          />
        </div>

        <label className="text-sm text-gray-500">Location</label>
        <div className="h-48 rounded-lg overflow-hidden mb-2 relative">
          <MapContainer
            center={location || [25.033, 121.5654]}
            zoom={14}
            className="h-full w-full z-0"
            whenCreated={(mapInstance) => {
              mapRef.current = mapInstance;
            }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution=""
            />
            <CenterOnCurrentLocation setLocation={setLocation} />
            <LocationSelector setLocation={setLocation} />
            {location && <Marker position={location} />}
          </MapContainer>
        </div>

        <div className="flex justify-between mt-4">
          <button onClick={onClose} className="text-gray-600">
            Cancel
          </button>
          <button
            type="button"
            className="bg-black text-white px-4 py-2 rounded-full"
            onClick={() => console.log("To be implemented: handle submit")}
          >
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}
