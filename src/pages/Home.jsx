import { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { MapIcon, ListIcon, LocateFixed, Filter, Plus, User, Wallet, Share2, Bot, CalendarCheck2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import CreateModal from "../components/CreateModal";
import CurrentLocationMarker from "../components/CurrentLocationMarker";
import { supabase } from "../../lib/supabase";
import AuthModal from "../components/AuthModal";

// Category definitions with colors
const categoryColors = {
  // Activity categories
  "Meal": "#FF6B6B", // Red
  "Ride": "#4ECDC4", // Teal
  "Meet-up": "#FFD166", // Yellow
  "Entertainment": "#06D6A0", // Green
  "Relaxation": "#118AB2", // Blue
  "Learning": "#073B4C", // Dark Blue
  "Help": "#EF476F", // Pink
  // Resource categories
  "Food / Drinks": "#7209B7", // Purple
  "Items": "#F72585", // Magenta
  "Clothing": "#3A0CA3", // Indigo
  "Space": "#4361EE", // Light Blue
  "Parking": "#4CC9F0", // Sky Blue
  // Other
  "Others": "#A0A0A0" // Gray
};

// Fix Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function Home() {
  const [mode, setMode] = useState("map");
  const [mapCenter, setMapCenter] = useState([25.0330, 121.5654]); // Default to Taipei
  const [mapRef, setMapRef] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [activities, setActivities] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showActivityPreview, setShowActivityPreview] = useState(false);

  const fetchActivities = async () => {
    try {
      const { data: activities, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedActivities = activities.map(activity => {
        try {
          let location;
          if (Array.isArray(activity.location)) {
            location = activity.location;
          } else if (activity.location && typeof activity.location === 'object') {
            location = [activity.location.lat, activity.location.lng];
          } else if (activity.location && typeof activity.location === 'string') {
            const coords = activity.location.split(',').map(Number);
            if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
              location = coords;
            } else {
              throw new Error('Invalid coordinate string');
            }
          } else {
            throw new Error('Invalid location format');
          }
          
          return {
            ...activity,
            location,
            images: activity.photos || []
          };
        } catch (err) {
          console.error('Error formatting activity location:', err, activity);
          return {
            ...activity,
            location: [25.0330, 121.5654], // Default to Taipei
            images: activity.photos || []
          };
        }
      });

      setActivities(formattedActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setError('Failed to load activities');
    }
  };

  // Get current location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  // Update map view when mapRef or mapCenter changes
  useEffect(() => {
    if (mapRef && mapCenter) {
      mapRef.setView(mapCenter, 15);
    }
  }, [mapRef, mapCenter]);

  // Set up auth state listener and fetch activities
  useEffect(() => {
    let mounted = true;

    const initializeApp = async () => {
      try {
        // Check user session
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setUser(session?.user ?? null);
        }

        // Fetch activities
        await fetchActivities();
      } catch (error) {
        console.error('Error initializing app:', error);
        if (mounted) {
          setError(error.message);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeApp();

    // Set up auth state listener
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Set up real-time subscription for activities
    const activitiesSubscription = supabase
      .channel('activities_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'activities'
        },
        async (payload) => {
          console.log('Activity change detected:', payload);
          if (payload.eventType === 'INSERT') {
            try {
              // Format the new activity's location
              const newActivity = payload.new;
              let location;
              try {
                if (Array.isArray(newActivity.location)) {
                  location = newActivity.location;
                } else if (newActivity.location && typeof newActivity.location === 'object') {
                  location = [newActivity.location.lat, newActivity.location.lng];
                } else if (newActivity.location && typeof newActivity.location === 'string') {
                  const coords = newActivity.location.split(',').map(Number);
                  if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                    location = coords;
                  } else {
                    throw new Error('Invalid coordinate string');
                  }
                } else {
                  throw new Error('Invalid location format');
                }
              } catch (err) {
                console.error('Error formatting new activity location:', err, newActivity);
                location = [25.0330, 121.5654];
              }

              // Add the new activity to the list
              setActivities(prevActivities => [{
                ...newActivity,
                location,
                images: newActivity.photos || []
              }, ...prevActivities]);
            } catch (error) {
              console.error('Error handling new activity:', error);
            }
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      authSubscription.unsubscribe();
      activitiesSubscription.unsubscribe();
    };
  }, []);

  const handleSignIn = () => {
    setShowAuthModal(true);
  };

  const handleCreateClick = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      setShowCreate(true);
    }
  };

  // Function to get marker color based on category
  const getMarkerColor = (category) => {
    return categoryColors[category] || '#A0A0A0';
  };

  // Function to create custom marker icon
  const createCustomIcon = (category, title) => {
    const color = getMarkerColor(category);
    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="relative">
          <div class="absolute -top-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-white px-2 py-1 rounded shadow text-xs font-medium">
            ${title}
          </div>
          <div class="w-4 h-4 rounded-full border-2 border-white shadow" style="background-color: ${color}"></div>
        </div>
      `,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      popupAnchor: [0, -20]
    });
  };

  // Function to create current location marker icon
  const createCurrentLocationIcon = () => {
    return L.divIcon({
      className: 'current-location-icon',
      html: `
        <div class="relative">
          <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-medium text-black bg-white px-2 py-0.5 rounded shadow">
            You are here
          </div>
          <div class="relative">
            <div class="w-16 h-16 rounded-full border-4 border-white shadow-lg animate-pulse" style="background-color: #000000">
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="w-8 h-8 rounded-full bg-white animate-ping"></div>
              </div>
            </div>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-12 h-12 rounded-full border-2 border-white animate-ping" style="background-color: #000000"></div>
            </div>
          </div>
        </div>
      `,
      iconSize: [64, 64],
      iconAnchor: [32, 32],
      popupAnchor: [0, -32]
    });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-black text-white rounded"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="bg-white flex justify-center min-h-screen">
      <div className="flex flex-col w-full max-w-[430px] min-h-screen bg-white relative pb-4 mx-auto">
        {/* Navigation Bar */}
        <div className="flex justify-between items-center px-4 py-3 border-b">
          <div className="flex items-center space-x-2">
            <div className="relative w-6 h-6 rounded-full bg-black">
              <div className="absolute w-1 h-1 bg-white rounded-full top-1 left-1" />
            </div>
            <span className="font-semibold text-lg">Boundless</span>
          </div>
          <div className="flex space-x-2">
            <button
              className={`p-2 rounded ${mode === "map" ? "bg-black text-white" : "bg-gray-200 text-black"}`}
              onClick={() => setMode("map")}
            >
              <MapIcon className="w-4 h-4" />
            </button>
            <button
              className={`p-2 rounded ${mode === "list" ? "bg-black text-white" : "bg-gray-200 text-black"}`}
              onClick={() => setMode("list")}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative flex-1 z-0">
          {mode === "map" ? (
            <div className="h-[calc(100vh-120px)] w-full relative">
              <MapContainer
                center={mapCenter}
                zoom={13}
                scrollWheelZoom={true}
                zoomControl={false}
                attributionControl={false}
                className="h-full w-full"
                whenCreated={setMapRef}
              >
                <TileLayer
                  attribution='&copy; Carto'
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
                <CurrentLocationMarker onLocate={setMapCenter} setMap={setMapRef} />
                
                {activities.map((activity) => {
                  if (!Array.isArray(activity.location) || activity.location.length !== 2) {
                    console.warn('Invalid location data for activity:', activity);
                    return null;
                  }
                  return (
                    <Marker
                      key={activity.id}
                      position={activity.location}
                      icon={createCustomIcon(activity.category, activity.title)}
                      eventHandlers={{
                        click: () => {
                          setSelectedActivity(activity);
                          setShowActivityPreview(true);
                        }
                      }}
                    />
                  );
                })}
              </MapContainer>

              {/* Search Bar */}
              <div className="absolute top-[10px] left-0 right-0 px-4 z-[1000]">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full p-3 rounded-xl border border-gray-300 bg-white text-black placeholder-gray-400 shadow"
                />
              </div>

              {/* Activity Preview Modal */}
              {showActivityPreview && selectedActivity && (
                <div className="fixed inset-0 z-[1000]">
                  <div 
                    className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" 
                    onClick={() => setShowActivityPreview(false)}
                  />
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[400px] bg-white rounded-2xl shadow-lg max-h-[80vh] overflow-y-auto">
                    <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b">
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: getMarkerColor(selectedActivity.category) }}
                        />
                        <h3 className="text-lg font-semibold">{selectedActivity.title}</h3>
                      </div>
                      <button 
                        onClick={() => setShowActivityPreview(false)}
                        className="text-gray-400 hover:text-black p-2"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="p-4 space-y-4">
                      {/* User Info */}
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          <img 
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedActivity.user_id || 'anonymous'}`}
                            alt="Default avatar"
                            className="w-full h-full"
                          />
                        </div>
                        <div>
                          <div className="font-medium">Anonymous User</div>
                          <div className="text-xs text-gray-500">Posted {new Date(selectedActivity.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>

                      <div className="flex items-center text-sm text-gray-500">
                        <span className="w-2 h-2 rounded-full mr-2" 
                          style={{ backgroundColor: getMarkerColor(selectedActivity.category) }}
                        />
                        {selectedActivity.category}
                      </div>
                      <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                        {selectedActivity.description || 'No description provided'}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex flex-col">
                          <span className="font-medium">Price</span>
                          <span>{selectedActivity.price || 'Free'}</span>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex flex-col">
                          <span className="font-medium">Time</span>
                          <span>{new Date(selectedActivity.time_start).toLocaleString()} - 
                          {new Date(selectedActivity.time_end).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div className="flex flex-col">
                          <span className="font-medium">Location</span>
                          <span>{Array.isArray(selectedActivity.location) 
                            ? selectedActivity.location.join(", ") 
                            : 'Invalid location'}</span>
                        </div>
                      </div>

                      {/* Image Preview */}
                      {selectedActivity.photos && selectedActivity.photos.length > 0 ? (
                        <div className="flex space-x-2 overflow-x-auto pb-2">
                          {selectedActivity.photos.map((photo, index) => (
                            <div 
                              key={index} 
                              className="flex-shrink-0 w-20 h-20 relative"
                              onClick={() => {
                                // Open full screen image view
                                const img = new Image();
                                img.src = photo;
                                const w = window.open('', '_blank');
                                w.document.write(img.outerHTML);
                                w.document.title = `Image ${index + 1}`;
                              }}
                            >
                              <img 
                                src={photo}
                                alt={`Activity image ${index + 1}`}
                                className="w-full h-full object-cover rounded-lg"
                                onError={(e) => {
                                  console.error('Error loading image:', photo);
                                  e.target.src = 'https://placehold.co/400x400?text=No+Image';
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="w-20 h-20 relative">
                          <img 
                            src="https://placehold.co/400x400?text=No+Image"
                            alt="No image available"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="absolute bottom-12 right-4 flex flex-col space-y-3 z-[900]">
                <button
                  className="bg-white border rounded-full p-3 shadow"
                  onClick={() => {
                    if (mapRef && mapCenter) {
                      mapRef.setView(mapCenter, 15);
                    }
                  }}
                >
                  <LocateFixed className="w-6 h-6 text-black" />
                </button>
                <button className="bg-white border rounded-full p-3 shadow">
                  <Filter className="w-6 h-6 text-black" />
                </button>
                <button
                  onClick={handleCreateClick}
                  className="bg-black text-white rounded-full p-3 shadow"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-4 overflow-y-auto h-[calc(100vh-120px)]">
              {activities.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  No activities found
                </div>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="bg-white rounded-xl shadow p-4">
                    <div className="font-semibold">{activity.title}</div>
                    <div className="text-sm text-gray-600">
                      {Array.isArray(activity.location) ? activity.location.join(", ") : 'Invalid location'} · {new Date(activity.time_start).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="h-16 w-full border-t flex justify-around items-center bg-white static mt-auto">
          {user ? (
            <Link to="/profile" className="flex flex-col items-center text-xs">
              <User className="w-5 h-5" />
              <span>Profile</span>
            </Link>
          ) : (
            <button onClick={handleSignIn} className="flex flex-col items-center text-xs">
              <User className="w-5 h-5" />
              <span>Sign In</span>
            </button>
          )}
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

        {showCreate && <CreateModal onClose={() => setShowCreate(false)} onSuccess={fetchActivities} />}
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </div>
    </div>
  );
} 