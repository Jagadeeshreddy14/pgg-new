import React, { useState } from "react";
import { Mail, Lock, User as UserIcon, Phone, Sparkles, AlertCircle, HelpCircle, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import api, { setToken } from "../lib/api";
import { useToast } from "../context/ToastContext";

interface AuthViewProps {
  onAuthSuccess: (user: any) => void;
}

export default function AuthView({ onAuthSuccess }: AuthViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);

  const { toast } = useToast();

  const handleQuickLogin = async (role: "admin" | "student") => {
    setError("");
    setLoading(true);
    const quickEmail = role === "admin" ? "admin@srisrinivasa.com" : "student@srisrinivasa.com";
    const quickPassword = role === "admin" ? "admin" : "student";
    
    setEmail(quickEmail);
    setPassword(quickPassword);
    
    try {
      const data = await api.post("/auth/login", { email: quickEmail, password: quickPassword });
      setToken(data.accessToken);
      toast(`Successfully logged in as ${data.user.role === "admin" ? "Warden" : "Resident"} ${data.user.name}!`, "success");
      onAuthSuccess(data.user);
    } catch (err: any) {
      const errMsg = err.message || "An authentication error occurred.";
      setError(errMsg);
      toast(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (forgotMode) {
        // Forgot password API simulation
        await api.post("/auth/reset-password-request", { email });
        setResetSent(true);
        toast("Password recovery instructions transmitted successfully.", "success");
      } else if (isLogin) {
        // Login API
        const data = await api.post("/auth/login", { email, password });
        setToken(data.accessToken);
        toast(`Welcome back, ${data.user.name}!`, "success");
        onAuthSuccess(data.user);
      } else {
        // Register API
        const data = await api.post("/auth/register", { name, email, password, phone });
        setToken(data.accessToken);
        toast("Resident account registered & verified successfully!", "success");
        onAuthSuccess(data.user);
      }
    } catch (err: any) {
      const errMsg = err.message || "An authentication error occurred.";
      setError(errMsg);
      toast(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-amber-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Hostel Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 shadow-xl shadow-amber-500/10 mb-4 border border-amber-300">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="font-display font-bold text-3xl tracking-tight text-white mb-1 bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent">
            Sri Srinivasa Boys Hostel
          </h1>
          <p className="text-sm text-slate-400">Luxury PG & Hostel Accommodation Management</p>
        </div>

        {/* Auth Glassmorphism Container */}
        <div className="bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative">
          <h2 className="font-display font-semibold text-xl text-slate-200 mb-6">
            {forgotMode ? "Reset Password" : isLogin ? "Welcome Back" : "Create Account"}
          </h2>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {resetSent ? (
            <div className="text-center py-6">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-full inline-block text-emerald-400 mb-4">
                <Mail className="w-8 h-8" />
              </div>
              <p className="text-sm text-slate-300 mb-6">
                A password reset link has been dispatched to <strong className="text-white">{email}</strong>. Please check your inbox or spam directory.
              </p>
              <button
                onClick={() => {
                  setForgotMode(false);
                  setResetSent(false);
                }}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-all text-sm"
              >
                Return to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && !forgotMode && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-slate-950/60 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none transition-colors placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Phone Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full bg-slate-950/60 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none transition-colors placeholder:text-slate-600"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@srisrinivasa.com"
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none transition-colors placeholder:text-slate-600"
                  />
                </div>
              </div>

              {!forgotMode && (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-medium text-slate-400">Password</label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => setForgotMode(true)}
                        className="text-xs text-amber-500 hover:text-amber-400 transition-colors"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950/60 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none transition-colors placeholder:text-slate-600"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-slate-950 rounded-xl font-semibold transition-all shadow-lg hover:shadow-amber-500/10 active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>{loading ? "Please wait..." : forgotMode ? "Dispatched Link" : isLogin ? "Sign In" : "Register"}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          {/* Bottom toggle auth link */}
          {!forgotMode && (
            <div className="mt-6 text-center text-xs text-slate-400">
              {isLogin ? "New to Srinivasa PG?" : "Already have an account?"}{" "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-amber-500 font-medium hover:underline hover:text-amber-400 transition-colors ml-1"
              >
                {isLogin ? "Register here" : "Sign in here"}
              </button>
            </div>
          )}

          {forgotMode && !resetSent && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setForgotMode(false)}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>

        {/* Demo Credentials Helper (Notion-style Card) */}
        <div className="mt-6 p-4 bg-slate-900/40 border border-slate-800/60 rounded-2xl space-y-3">
          <div className="flex items-center space-x-2 text-amber-500/90">
            <HelpCircle className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider font-display">Demo Credentials & Quick Login</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <button
              type="button"
              onClick={() => handleQuickLogin("admin")}
              disabled={loading}
              className="text-left p-3 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/50 rounded-xl transition-all cursor-pointer group active:scale-[0.98] disabled:opacity-50"
            >
              <p className="font-semibold text-slate-200 group-hover:text-amber-400 transition-colors">Warden (Admin)</p>
              <p className="text-[10px] text-slate-500 mt-0.5">admin@srisrinivasa.com</p>
              <div className="text-[10px] text-amber-500/80 mt-2 font-medium flex items-center">
                <span>Quick Sign In</span>
                <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("student")}
              disabled={loading}
              className="text-left p-3 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/50 rounded-xl transition-all cursor-pointer group active:scale-[0.98] disabled:opacity-50"
            >
              <p className="font-semibold text-slate-200 group-hover:text-amber-400 transition-colors">Resident (Student)</p>
              <p className="text-[10px] text-slate-500 mt-0.5">student@srisrinivasa.com</p>
              <div className="text-[10px] text-amber-500/80 mt-2 font-medium flex items-center">
                <span>Quick Sign In</span>
                <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
