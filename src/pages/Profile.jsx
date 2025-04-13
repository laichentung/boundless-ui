import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAndActivities = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/");
        return;
      }

      setUser(session.user);

      // Fetch user's activities
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching activities:", error);
      } else {
        setActivities(data);
      }

      setLoading(false);
    };

    fetchUserAndActivities();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <p className="mt-1 text-sm text-gray-500">
              {user?.email}
            </p>
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Your Activities</h2>
            {activities.length === 0 ? (
              <p className="text-gray-500">You haven't created any activities yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-medium text-gray-900">{activity.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">{activity.description}</p>
                    <div className="mt-2 text-sm text-gray-500">
                      <p>Category: {activity.category}</p>
                      <p>Location: {activity.location.join(", ")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 