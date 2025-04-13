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
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [location, setLocation] = useState(null);
  const [inputLocation, setInputLocation] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
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
    if (!selectedCategory) {
      alert("Please select a category");
      return;
    }

    if (!formData.title || !formData.timeStart || !formData.timeEnd || !location) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      // Upload photos first
      let photoUrls = [];
      if (formData.photos.length > 0) {
        for (const photo of formData.photos) {
          const fileExt = photo.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${fileName}`;

          // Upload to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('activity-photos')
            .upload(filePath, photo);

          if (uploadError) {
            throw uploadError;
          }

          // Get the public URL
          const { data: { publicUrl } } = supabase.storage
            .from('activity-photos')
            .getPublicUrl(filePath);

          photoUrls.push(publicUrl);
        }
      }

      // Create the activity record
      const { error } = await supabase
        .from('activities')
        .insert([
          {
            title: formData.title,
            description: formData.description,
            type: activityCategories.includes(selectedCategory) ? "activity" : "resource",
            category: selectedCategory,
            latitude: location[0],
            longitude: location[1],
            time_start: formData.timeStart,
            time_end: formData.timeEnd,
            price: formData.unit === "Free" ? 0 : parseFloat(formData.price),
            unit: formData.unit,
            photos: photoUrls,
          }
        ]);

      if (error) {
        throw error;
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error creating activity:", error);
      alert("❌ Failed to publish: " + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-[90%] max-w-md rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Share something</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-black transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Title</label>
            <input 
              name="title" 
              type="text" 
              placeholder="What are you sharing?"
              onChange={handleInput} 
              className="w-full border border-gray-200 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Category</label>
            <select
              value={selectedCategory || ""}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-gray-200 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white"
            >
              <option value="" disabled>Select a category</option>
              <optgroup label="Activities">
                {activityCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </optgroup>
              <optgroup label="Resources">
                {resourceCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Time</label>
            <div className="flex gap-2 items-center">
              <input 
                name="timeStart" 
                type="datetime-local" 
                onChange={handleInput}
                className="w-full border border-gray-200 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" 
              />
              <span className="text-gray-500">-</span>
              <input 
                name="timeEnd" 
                type="datetime-local" 
                onChange={handleInput}
                className="w-full border border-gray-200 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Location</label>
            <button 
              onClick={recenter} 
              className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <span>📍</span>
              <span>Use My Current Location</span>
            </button>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={inputLocation} 
                onChange={(e) => setInputLocation(e.target.value)}
                placeholder="Enter coordinates or Google Maps link"
                className="flex-1 border border-gray-200 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" 
              />
              <button 
                onClick={handleLocationInput}
                className="px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                Set
              </button>
            </div>
          </div>

          <div className="relative w-full h-64 rounded-lg overflow-hidden border border-gray-200">
            <MapContainer 
              ref={mapRef} 
              center={[25.033, 121.5654]} 
              zoom={14}
              style={{ height: "100%", width: "100%" }} 
              attributionControl={false}
            >
              <TileLayer 
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" 
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

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Price</label>
            <div className="flex gap-2">
              <select 
                name="unit" 
                value={formData.unit} 
                onChange={handleInput}
                className="border border-gray-200 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
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
                className="flex-1 border border-gray-200 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white disabled:bg-gray-50" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea 
              name="description" 
              placeholder="Tell us more about what you're sharing..."
              onChange={handleInput}
              className="w-full border border-gray-200 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent h-24" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Photos</label>
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handlePhotoUpload} 
              className="w-full border border-gray-200 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" 
            />
          </div>
          
          {formData.photos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {formData.photos.map((file, i) => (
                <img 
                  key={i} 
                  src={URL.createObjectURL(file)} 
                  alt="preview"
                  className="h-24 w-24 object-cover rounded-lg border border-gray-200" 
                />
              ))}
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <button 
              onClick={handleSubmit} 
              className="bg-black text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Publish
            </button>
          </div>
        </div>

        {showSuccess && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Successfully published!</span>
          </div>
        )}
      </div>
    </div>
  );
}