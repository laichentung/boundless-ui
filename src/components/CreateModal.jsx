
import { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { supabase } from "../../lib/supabase";
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
      setLocation([e.latlng.lat, e.latlng.lng]);
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
  const [address, setAddress] = useState("");
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [showToast, setShowToast] = useState(false);

  const mapRef = useRef();

  useEffect(() => {
    if (images.length) {
      const previews = Array.from(images).map((file) =>
        URL.createObjectURL(file)
      );
      setImagePreviews(previews);
    }
  }, [images]);

  const recenterMap = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setLocation(coords);
        mapRef.current.setView(coords, 15);
      });
    }
  };

  const useMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setLocation(coords);
      });
    }
  };

  const handleSubmit = async () => {
    let photoUrls = [];

    for (const image of images) {
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
        address,
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
      <div className="bg-white rounded-xl p-4 w-full max-w-md max-h-[95vh] overflow-y-auto relative">
        <h2 className="text-xl font-semibold mb-4">Share something</h2>

        <input
          type="text"
          placeholder="Title"
          className="border p-2 w-full mb-3"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label className="text-sm text-gray-500">Category</label>
        <select
          value={category}
          onChange={(e) => {
            const val = e.target.value;
            setCategory(val);
            setType(activityCategories.includes(val) ? "activity" : "resource");
          }}
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

        <label className="text-sm text-gray-500">Time</label>
        <div className="flex gap-2 mb-3">
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

        <label className="text-sm text-gray-500">Address or Google Map Link</label>
        <input
          type="text"
          placeholder="Paste Google Maps link or type address"
          className="border p-2 w-full mb-2"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <button
          onClick={useMyLocation}
          className="text-sm underline text-blue-600 mb-1"
        >
          Use My Current Location
        </button>

        <div className="h-48 rounded-lg overflow-hidden mb-2 relative">
          <MapContainer
            center={location}
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
            <LocationSelector setLocation={setLocation} />
            <Marker position={location} />
          </MapContainer>
          <button
            onClick={recenterMap}
            className="absolute bottom-2 right-2 bg-white text-black px-2 py-1 text-xs rounded shadow"
          >
            ⟳ Recenter
          </button>
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
            <option>Bound</option>
          </select>
          <input
            type="number"
            className="flex-1 border p-2"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            disabled={unit === "Free"}
          />
        </div>

        <label className="text-sm text-gray-500">Upload Photos</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setImages(Array.from(e.target.files))}
          className="mb-2"
        />
        <div className="grid grid-cols-4 gap-2 mb-4">
          {imagePreviews.map((src, idx) => (
            <img
              key={idx}
              src={src}
              alt={`preview-${idx}`}
              className="rounded object-cover w-full h-20"
            />
          ))}
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
