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

  // Get current location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          if (mapRef) {
            mapRef.setView([latitude, longitude], 15);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, [mapRef]);

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
        const { data, error: activitiesError } = await supabase
          .from('activities')
          .select('*')
          .order('created_at', { ascending: false });

        if (activitiesError) throw activitiesError;
        
        // Format activities with proper location data
        const formattedActivities = (data || []).map(activity => {
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
              location
            };
          } catch (err) {
            console.error('Error formatting activity location:', err, activity);
            return {
              ...activity,
              location: [25.0330, 121.5654]
            };
          }
        });
        
        if (mounted) {
          setActivities(formattedActivities);
        }
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
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
                      icon={L.divIcon({
                        className: 'custom-div-icon',
                        html: `<div class="bg-white border rounded-full p-2 shadow">
                                <div class="w-2 h-2 rounded-full bg-black"></div>
                              </div>`,
                        iconSize: [24, 24],
                        iconAnchor: [12, 12]
                      })}
                    />
                  );
                })}
              </MapContainer>

              {/* Search Bar */}
              <div className="absolute top-[10px] left-0 right-0 px-4 z-[1000]">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full p-3 rounded-xl border border-gray-300 bg-white shadow"
                />
              </div>

              {/* Action Buttons */}
              <div className="absolute bottom-12 right-4 flex flex-col space-y-3 z-[1000]">
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

        {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </div>
    </div>
  );
} 