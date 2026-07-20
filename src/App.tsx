import React, { useState, useEffect } from "react";
import AuthView from "./views/AuthView";
import AdminDashboard from "./views/AdminDashboard";
import StudentDashboard from "./views/StudentDashboard";
import AIChatWidget from "./components/AIChatWidget";
import api, { clearToken, getToken } from "./lib/api";
import { User } from "./types";
import { Sparkles } from "lucide-react";
import { ToastProvider } from "./context/ToastContext";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const u = await api.get("/auth/me");
      setUser(u);
    } catch (err) {
      // Stale or invalid token, wipe it clean
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
  };

  const handleLogout = () => {
    clearToken();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        {/* Apple-style minimalist loading spin */}
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-amber-500/10 border-t-amber-500 animate-spin" />
          <Sparkles className="w-5 h-5 text-amber-500 absolute animate-pulse" />
        </div>
        <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">Hydrating Resident Node...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <ToastProvider>
        <AuthView onAuthSuccess={handleAuthSuccess} />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="font-sans antialiased bg-slate-950 text-slate-100 min-h-screen">
        {user.role === "admin" ? (
          <AdminDashboard user={user} onLogout={handleLogout} />
        ) : (
          <>
            <StudentDashboard user={user} onLogout={handleLogout} />
            <AIChatWidget />
          </>
        )}
      </div>
    </ToastProvider>
  );
}
