
import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { supabase } from "../../lib/supabase";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const activityCategories = [
  "Meal", "Ride", "Meet-up", "Entertainment", "Relaxation", "Learning", "Help", "Others",
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

export default function CreateModal({ onClose }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Meal");
  const [type, setType] = useState("activity");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("Free");
  const [location, setLocation] = useState([25.033, 121.5654]);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showToast, setShowToast] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
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

    const { error } = await supabase.from("activities").insert([
      {
        title,
        type,
        category,
        time_start: timeStart,
        time_end: timeEnd,
        price: unit === "Free" ? 0 : parseFloat(price),
        unit,
        latitude: location[0],
        longitude: location[1],
        photos: photoUrls,
      },
    ]);

    if (!error) {
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        onClose();
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl p-4 w-full max-w-md max-h-[95vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">I want to share...</h2>

        <label className="text-sm text-gray-500">Category</label>
        <select
          value={category}
          onChange={(e) => {
            const value = e.target.value;
            setCategory(value);
            setType(activityCategories.includes(value) ? "activity" : "resource");
          }}
          className="border p-2 w-full mb-4"
        >
          <optgroup label="Activities">
            {activityCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </optgroup>
          <optgroup label="Resources">
            {resourceCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </optgroup>
        </select>

        <input
          type="text"
          placeholder="Title"
          className="border p-2 w-full mb-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label className="text-sm text-gray-500">Time</label>
        <div className="flex gap-2 mb-2">
          <input
            type="datetime-local"
            className="border p-2 flex-1"
            value={timeStart}
            onChange={(e) => setTimeStart(e.target.value)}
          />
          <span className="self-center">-</span>
          <input
            type="datetime-local"
            className="border p-2 flex-1"
            value={timeEnd}
            onChange={(e) => setTimeEnd(e.target.value)}
          />
        </div>

        <label className="text-sm text-gray-500">Upload Photo</label>
        <input type="file" accept="image/*" onChange={handleImageChange} className="mb-2" />
        {imagePreview && <img src={imagePreview} className="mb-2 rounded" alt="preview" />}

        <label className="text-sm text-gray-500">Location</label>
        <div className="h-48 rounded-lg overflow-hidden mb-2">
          <MapContainer center={location} zoom={14} className="h-full w-full">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution=""
            />
            <LocationSelector setLocation={setLocation} />
            <Marker position={location} />
          </MapContainer>
        </div>

        <label className="text-sm text-gray-500">Price</label>
        <div className="flex gap-2 mb-4">
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="border p-2"
          >
            <option>Free</option>
            <option>USD</option>
            <option>TWD</option>
          </select>
          <input
            type="number"
            className="flex-1 border p-2"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            disabled={unit === "Free"}
          />
        </div>

        <div className="flex justify-between">
          <button onClick={onClose} className="text-gray-600">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="bg-black text-white px-4 py-2 rounded-full"
          >
            Publish
          </button>
        </div>

        {showToast && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-black text-white px-6 py-2 rounded-full shadow-md transition-all">
            Activity published successfully!
          </div>
        )}
      </div>
    </div>
  );
}
