
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
        const { latitude, longitude } = pos.coords;
        setLocation([latitude, longitude]);
        map.setView([latitude, longitude], 15);
      });
    }
  }, []);
  return null;
}

export default function CreateModal({ onClose }) {
  const [title, setTitle] = useState("");
  const [selected, setSelected] = useState({ type: "activity", label: "Meal" });
  const [formData, setFormData] = useState({
    timeStart: "",
    timeEnd: "",
    price: "",
    unit: "Free",
  });
  const [location, setLocation] = useState([25.033, 121.5654]);

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const mapRef = useRef();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    setUploading(true);
    let photoUrls = [];

    if (image) {
      const filename = `${Date.now()}_${image.name}`;
      const { data, error } = await supabase.storage
        .from("activity-photos")
        .upload(filename, image);

      if (!error) {
        const { data: urlData } = supabase.storage
          .from("activity-photos")
          .getPublicUrl(filename);
        photoUrls.push(urlData.publicUrl);
      }
    }

    const activity = {
      title,
      category: selected.label,
      type: selected.type,
      time_start: formData.timeStart,
      time_end: formData.timeEnd,
      price: formData.unit === "Free" ? 0 : parseFloat(formData.price),
      unit: formData.unit,
      latitude: location[0],
      longitude: location[1],
      photos: photoUrls,
    };

    const { error } = await supabase.from("activities").insert([activity]);

    setUploading(false);
    if (!error) {
      onClose();
    } else {
      console.error("Insert failed", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl p-4 w-full max-w-md max-h-[95vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">I want to share...</h2>

        <div className="mb-4">
          <div className="flex flex-wrap gap-2 mb-2">
            <button
              className={`px-3 py-1 rounded-full border ${selected.type === "activity" ? "bg-black text-white" : ""}`}
              onClick={() => setSelected({ type: "activity", label: "Meal" })}
            >
              Activity
            </button>
            <button
              className={`px-3 py-1 rounded-full border ${selected.type === "resource" ? "bg-black text-white" : ""}`}
              onClick={() => setSelected({ type: "resource", label: "Food / Drinks" })}
            >
              Resource
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(selected.type === "activity" ? activityCategories : resourceCategories).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelected({ ...selected, label: cat })}
                className={`border px-3 py-2 rounded-lg text-sm ${selected.label === cat ? "bg-black text-white" : ""}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 w-full mb-2"
        />

        <label className="text-sm text-gray-500">Time</label>
        <div className="flex gap-2 mb-2">
          <input
            type="datetime-local"
            className="border p-2 flex-1"
            value={formData.timeStart}
            onChange={(e) => setFormData({ ...formData, timeStart: e.target.value })}
          />
          <span className="self-center">-</span>
          <input
            type="datetime-local"
            className="border p-2 flex-1"
            value={formData.timeEnd}
            onChange={(e) => setFormData({ ...formData, timeEnd: e.target.value })}
          />
        </div>

        <label className="text-sm text-gray-500">Photo</label>
        <input type="file" accept="image/*" onChange={handleImageChange} className="mb-2" />
        {imagePreview && <img src={imagePreview} alt="preview" className="mb-2 rounded-lg" />}

        <label className="text-sm text-gray-500">Location</label>
        <div className="h-48 rounded-lg overflow-hidden mb-2">
          <MapContainer center={location} zoom={14} className="h-full w-full z-0" ref={mapRef}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <LocationSelector setLocation={setLocation} />
            <CenterOnCurrentLocation setLocation={setLocation} />
            <Marker position={location} />
          </MapContainer>
        </div>

        <label className="text-sm text-gray-500">Price</label>
        <div className="flex gap-2 mb-4">
          <select
            className="border p-2"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
          >
            <option>Free</option>
            <option>USD</option>
            <option>TWD</option>
          </select>
          <input
            type="number"
            className="border p-2 flex-1"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            disabled={formData.unit === "Free"}
          />
        </div>

        <div className="flex justify-between">
          <button onClick={onClose} className="text-gray-600">Cancel</button>
          <button
            onClick={handleSubmit}
            className="bg-black text-white px-4 py-2 rounded-full"
            disabled={uploading}
          >
            {uploading ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
