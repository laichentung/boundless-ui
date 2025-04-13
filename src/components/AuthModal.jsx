import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AuthModal({ onClose, onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (onSuccess) onSuccess();
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (onSuccess) onSuccess();
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-[90%] max-w-md rounded-2xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">{isSignUp ? "Sign Up" : "Sign In"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded-md disabled:opacity-50"
          >
            {loading ? "Loading..." : (isSignUp ? "Sign Up" : "Sign In")}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-gray-600 hover:text-black"
          >
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
} 