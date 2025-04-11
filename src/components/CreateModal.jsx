import { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
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
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState("");
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(false);

  const mapRef = useRef();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setLocation(coords);
          if (mapRef.current) {
            mapRef.current.setView(coords, 15);
          }
        },
        (err) => {
          console.error("Geolocation error:", err);
          setLocation([25.033, 121.5654]);
        }
      );
    } else {
      setLocation([25.033, 121.5654]);
    }
  }, []);

  useEffect(() => {
    if (images.length) {
      const previews = Array.from(images).map((file) =>
        URL.createObjectURL(file)
      );
      setImagePreviews(previews);
    }
  }, [images]);

  const useMyLocation = () => {
    if (isUsingCurrentLocation) {
      setIsUsingCurrentLocation(false);
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setLocation(coords);
          setIsUsingCurrentLocation(true);
          if (mapRef.current) {
            mapRef.current.flyTo(coords, 15);
          }
        },
        (err) => {
          console.error("Geolocation error:", err);
          alert("Failed to get your location. Please try again.");
        }
      );
    }
  };

  const setLocationFromAddress = () => {
    if (!address) return;

    // Try to parse coordinates
    if (address.includes(",")) {
      const parts = address.split(",");
      const lat = parseFloat(parts[0].trim());
      const lng = parseFloat(parts[1].trim());
      if (!isNaN(lat) && !isNaN(lng)) {
        const newLocation = [lat, lng];
        setLocation(newLocation);
        setIsUsingCurrentLocation(false);
        if (mapRef.current) {
          mapRef.current.flyTo(newLocation, 15);
        }
        return;
      }
    }

    // Try to parse Google Maps link
    const googleMapsRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = address.match(googleMapsRegex);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      const newLocation = [lat, lng];
      setLocation(newLocation);
      setIsUsingCurrentLocation(false);
      if (mapRef.current) {
        mapRef.current.flyTo(newLocation, 15);
      }
    }
  };

  const handleSubmit = async () => {
    if (!title || !timeStart || !timeEnd || !location) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      let photoUrls = [];

      if (images.length > 0) {
        for (const image of images) {
          const filename = `${Date.now()}_${image.name}`;
          const { data, error } = await supabase.storage
            .from("activity-photos")
            .upload(filename, image);

          if (error) throw error;

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

      if (error) throw error;

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error creating activity:", error);
      alert("Failed to create activity. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!location) {
    return <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">Loading...</div>;
  }

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

        <label className="text-sm text-gray-500">Location</label>
        <div className="flex flex-col gap-2 mb-2">
          <button
            onClick={useMyLocation}
            className={`p-1.5 rounded border ${
              isUsingCurrentLocation
                ? "bg-black text-white"
                : "bg-white text-black"
            }`}
          >
            {isUsingCurrentLocation ? "Using Current Location" : "Use My Current Location"}
          </button>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Paste coordinates or Google Maps link"
              className="border p-2 flex-1"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <button
              onClick={setLocationFromAddress}
              className="bg-black text-white px-3 py-2 rounded"
            >
              Set
            </button>
          </div>
        </div>

        <div className="h-48 rounded-lg overflow-hidden mb-2 relative">
          <MapContainer
            center={location}
            zoom={15}
            className="h-full w-full z-0"
            whenCreated={(mapInstance) => {
              mapRef.current = mapInstance;
            }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
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
          className="mb-4"
        />

        {imagePreviews.length > 0 && (
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {imagePreviews.map((preview, index) => (
              <img
                key={index}
                src={preview}
                alt={`Preview ${index + 1}`}
                className="h-20 w-20 object-cover rounded"
              />
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 p-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 bg-black text-white p-2 rounded disabled:opacity-50"
          >
            {isSubmitting ? "Publishing..." : "Publish"}
          </button>
        </div>

        {showToast && (
          <div className="absolute bottom-4 left-4 right-4 bg-green-500 text-white p-2 rounded text-center">
            Activity published successfully!
          </div>
        )}
      </div>
    </div>
  );
}
