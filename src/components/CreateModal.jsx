// 類別清單
const activityCategories = [
  "Meal", "Ride", "Meet-up", "Entertainment",
  "Relaxation", "Learning", "Help"
];

const resourceCategories = [
  "Food / Drinks", "Items", "Clothing", "Space", "Parking"
];

const otherCategories = [
  "Others"
];

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, useMapEvents, Marker, useMap } from "react-leaflet";
import { supabase } from "../../lib/supabase";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import AuthModal from "./AuthModal";
import heic2any from "heic2any";

// Fix Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

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

export default function CreateModal({ onClose, onSuccess }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [location, setLocation] = useState(null);
  const [inputLocation, setInputLocation] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSettingLocation, setIsSettingLocation] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [error, setError] = useState(null);
  const mapRef = useRef();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    timeStart: "",
    timeEnd: "",
    price: "",
    unit: "TWD",
    photos: [],
  });

  const [user, setUser] = useState(null);

  const categories = [
    { id: 'activity', name: 'Activity' },
    { id: 'resource', name: 'Resource' },
    { id: 'others', name: 'Others' }
  ];

  // Check authentication status when component mounts
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setUser(session?.user ?? null);
    };
    checkAuth();
  }, []);

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length + formData.photos.length > 4) {
      setError("You can only upload up to 4 images");
      return;
    }

    const uploadPromises = files.map(async (file) => {
      try {
        // Check if the file is HEIC format
        const isHeic = file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic');
        
        let imageFile = file;
        if (isHeic) {
          // Convert HEIC to JPEG using heic2any library
          const convertedBlob = await heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.8
          });
          imageFile = new File([convertedBlob], file.name.replace('.heic', '.jpg'), {
            type: 'image/jpeg'
          });
        }

        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `activity-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('activity-images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('activity-images')
          .getPublicUrl(filePath);

        return publicUrl;
      } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
      }
    });

    try {
      const uploadedUrls = await Promise.all(uploadPromises);
      setFormData({ ...formData, photos: [...formData.photos, ...uploadedUrls] });
    } catch (error) {
      setError("Failed to upload images. Please try again.");
    }
  };

  const recenter = async () => {
    if (navigator.geolocation) {
      setIsGettingLocation(true);
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        const coords = [position.coords.latitude, position.coords.longitude];
        setLocation(coords);
        if (mapRef.current) {
          mapRef.current.setView(coords, 15);
        }
      } catch (error) {
        console.error("Geolocation error:", error);
        alert("Failed to get your location. Please try again.");
      } finally {
        setIsGettingLocation(false);
      }
    }
  };

  const handleLocationInput = async () => {
    if (!inputLocation) return;
    setIsSettingLocation(true);
    try {
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
        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 15);
        }
      } else {
        alert("⚠️ Please enter valid coordinates or a Google Maps link with coordinates.");
      }
    } finally {
      setIsSettingLocation(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsPublishing(true);

    try {
      // Check if user is signed in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be signed in to create an activity");
      }

      // Validate required fields
      if (!formData.title || !location || !formData.timeStart || !formData.timeEnd || !selectedCategory) {
        throw new Error("Please fill in all required fields");
      }

      // Create activity data
      const activityData = {
        title: formData.title,
        description: formData.description || null, // Make description optional
        location: location,
        time_start: formData.timeStart,
        time_end: formData.timeEnd,
        category: selectedCategory,
        user_id: user.id,
        created_at: new Date().toISOString(),
        photos: formData.photos // Add photos array to the activity data
      };

      // Insert activity into database
      const { error: insertError } = await supabase
        .from('activities')
        .insert([activityData]);

      if (insertError) throw insertError;

      // Show success message
      setShowSuccess(true);
      
      // Wait for 2 seconds before closing the modal
      setTimeout(() => {
        onClose();
        if (onSuccess) {
          onSuccess(); // Call the onSuccess callback to refresh activities
        }
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCreateClick = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      setShowCreate(true);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    setShowCreate(true);
  };

  return (
    <div className="bg-white flex justify-center min-h-screen">
      <div className="flex flex-col w-full max-w-[430px] min-h-screen bg-white relative pb-4 mx-auto">
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

            {!isAuthenticated ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Please sign in to share an activity</p>
                <button
                  onClick={() => {
                    onClose();
                    // You might want to redirect to sign in page or show sign in modal
                  }}
                  className="bg-black text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Sign In
                </button>
              </div>
            ) : (
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
                    <optgroup label="Other">
                      {otherCategories.map(category => (
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
                    className={`w-full text-sm px-4 py-2.5 border border-gray-200 rounded-lg ${
                      isGettingLocation ? 'bg-gray-100' : 'bg-white hover:bg-gray-50'
                    } transition-colors flex items-center justify-center gap-2`}
                    disabled={isGettingLocation}
                  >
                    <span>📍</span>
                    <span>{isGettingLocation ? 'Getting location...' : 'Use My Current Location'}</span>
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
                      className={`px-4 py-2.5 text-sm border border-gray-200 rounded-lg ${
                        isSettingLocation ? 'bg-gray-100' : 'bg-white hover:bg-gray-50'
                      } transition-colors whitespace-nowrap`}
                      disabled={isSettingLocation}
                    >
                      {isSettingLocation ? 'Setting...' : 'Set'}
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
                    onChange={handleImageUpload} 
                    className="w-full border border-gray-200 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" 
                  />
                </div>
                
                {formData.photos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {formData.photos.map((photo, i) => (
                      <div key={i} className="relative">
                        <img 
                          src={photo}
                          alt="preview"
                          className="h-24 w-24 object-cover rounded-lg border border-gray-200" 
                          onError={(e) => {
                            console.error('Error loading image:', photo);
                            e.target.src = 'https://placehold.co/400x400?text=No+Image';
                          }}
                        />
                        <button
                          onClick={() => {
                            setFormData({
                              ...formData,
                              photos: formData.photos.filter((_, index) => index !== i)
                            });
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {error && (
                  <div className="text-red-500 text-sm">{error}</div>
                )}

                <div className="pt-4 flex justify-end">
                  <button 
                    onClick={handleSubmit} 
                    disabled={isPublishing}
                    className={`bg-black text-white px-6 py-2.5 rounded-lg ${
                      isPublishing ? 'opacity-75' : 'hover:bg-gray-800'
                    } transition-colors`}
                  >
                    {isPublishing ? 'Publishing...' : 'Publish'}
                  </button>
                </div>
              </div>
            )}

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

        {showAuthModal && (
          <AuthModal
            onClose={() => setShowAuthModal(false)}
            onSuccess={handleAuthSuccess}
          />
        )}
      </div>
    </div>
  );
}