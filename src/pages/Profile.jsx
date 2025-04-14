import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { LogOut, User, Settings, Wallet, Share2, Bot, CalendarCheck2 } from "lucide-react";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/");
          return;
        }
        setUser(session.user);
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="bg-white flex justify-center min-h-screen">
      <div className="flex flex-col w-full max-w-[430px] min-h-screen bg-white relative pb-4 mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b">
          <div className="flex items-center space-x-2">
            <div className="relative w-6 h-6 rounded-full bg-black">
              <div className="absolute w-1 h-1 bg-white rounded-full top-1 left-1" />
            </div>
            <span className="font-semibold text-lg">Boundless</span>
          </div>
        </div>

        {/* Profile Content */}
        <div className="relative flex-1 z-0 p-4 space-y-6">
          {/* User Info */}
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-10 h-10 text-gray-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user?.email}</h2>
              <p className="text-gray-500">Member since {new Date(user?.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <button className="w-full flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </button>
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center space-x-3 p-4 border rounded-lg text-red-500 hover:bg-red-50"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 max-w-[430px] mx-auto">
          <div className="flex justify-around items-center">
            <Link to="/profile" className="flex flex-col items-center">
              <User className="w-5 h-5" />
              <span className="text-xs mt-1 font-bold text-black">Profile</span>
            </Link>
            <Link to="/bound" className="flex flex-col items-center">
              <Wallet className="w-5 h-5" />
              <span className="text-xs mt-1">Bound</span>
            </Link>
            <Link to="/" className="flex flex-col items-center">
              <Share2 className="w-5 h-5" />
              <span className="text-xs mt-1">Share</span>
            </Link>
            <Link to="/ai" className="flex flex-col items-center">
              <Bot className="w-5 h-5" />
              <span className="text-xs mt-1">AI</span>
            </Link>
            <Link to="/todo" className="flex flex-col items-center">
              <CalendarCheck2 className="w-5 h-5" />
              <span className="text-xs mt-1">To-do</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 