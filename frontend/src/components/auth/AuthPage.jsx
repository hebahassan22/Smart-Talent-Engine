import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Eye, EyeOff, User, Mail, Lock, CheckCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function AuthPage() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const resetForm = () => {
    setForm({ name: "", email: "", password: "" });
    setError("");
    setSuccess("");
    setShowPass(false);
  };

  const switchTab = (toLogin) => {
    setIsLogin(toLogin);
    resetForm();
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    // Validate inputs
    if (!form.email.trim() || !form.password.trim()) {
      setError("Email and password are required.");
      return;
    }
    if (!isLogin && !form.name.trim()) {
      setError("Full name is required.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        // LOGIN — loads only this user's data
        await login(form.email.trim().toLowerCase(), form.password);
        // AuthContext sets user → App.jsx redirects to dashboard automatically
      } else {
        // REGISTER — creates account then redirects to login
        await register(form.name.trim(), form.email.trim().toLowerCase(), form.password);
        // Show success and switch to login tab
        setSuccess("Account created successfully! Please sign in with your new credentials.");
        resetForm();
        setIsLogin(true);
      }
    } catch (e) {
      const msg = e?.response?.data?.error || "";
      if (msg.includes("already registered") || msg.includes("already exists")) {
        setError("This email is already registered. Please sign in.");
      } else if (msg.includes("Invalid") || msg.includes("credentials") || msg.includes("not found")) {
        setError("Invalid email or password. Please try again.");
      } else {
        setError(msg || "Something went wrong. Please try again.");
      }
    }
    setLoading(false);
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen px-4 grid-bg"
      style={{ background: "#06060F" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex p-3 mb-4 border rounded-2xl bg-neon/10 border-neon/20">
            <Zap size={28} className="text-neon" />
          </div>
          <h1 className="text-xl font-bold tracking-wider text-gray-100 font-display">
            SMART TALENT ENGINE
          </h1>
          <p className="mt-1 text-xs text-gray-500 font-body">
            AI-Powered Recruitment Intelligence
          </p>
        </div>

        {/* Card */}
        <div
          className="p-8 space-y-5 border rounded-2xl border-border"
          style={{ background: "rgba(17,17,42,0.9)", backdropFilter: "blur(20px)" }}
        >
          {/* Tab Toggle */}
          <div className="flex overflow-hidden border rounded-xl border-border">
            <button
              onClick={() => switchTab(true)}
              className={`flex-1 py-2.5 text-xs font-display tracking-wider transition-all ${
                isLogin ? "bg-neon text-black" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              SIGN IN
            </button>
            <button
              onClick={() => switchTab(false)}
              className={`flex-1 py-2.5 text-xs font-display tracking-wider transition-all ${
                !isLogin ? "bg-neon text-black" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              CREATE ACCOUNT
            </button>
          </div>

          {/* Success message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 px-3 py-2 text-xs text-green-400 border rounded-lg bg-green-500/10 border-green-500/20 font-body"
            >
              <CheckCircle size={14} className="shrink-0 mt-0.5" />
              {success}
            </motion.div>
          )}

          {/* Name field — register only */}
          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="relative"
            >
              <User size={14} className="absolute text-gray-500 -translate-y-1/2 left-3 top-1/2" />
              <input
                type="text"
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full py-3 pr-4 text-sm text-gray-200 placeholder-gray-600 border pl-9 rounded-xl bg-surface border-border focus:outline-none focus:border-neon/40 font-body"
              />
            </motion.div>
          )}

          {/* Email */}
          <div className="relative">
            <Mail size={14} className="absolute text-gray-500 -translate-y-1/2 left-3 top-1/2" />
            <input
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full py-3 pr-4 text-sm text-gray-200 placeholder-gray-600 border pl-9 rounded-xl bg-surface border-border focus:outline-none focus:border-neon/40 font-body"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock size={14} className="absolute text-gray-500 -translate-y-1/2 left-3 top-1/2" />
            <input
              type={showPass ? "text" : "password"}
              placeholder="Password (min 6 characters)"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full py-3 pr-10 text-sm text-gray-200 placeholder-gray-600 border pl-9 rounded-xl bg-surface border-border focus:outline-none focus:border-neon/40 font-body"
            />
            <button
              onClick={() => setShowPass(!showPass)}
              className="absolute text-gray-500 -translate-y-1/2 right-3 top-1/2 hover:text-gray-300"
            >
              {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-3 py-2 text-xs text-red-400 border rounded-lg bg-red-500/10 border-red-500/20 font-body"
            >
              {error}
            </motion.p>
          )}

          {/* Submit */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full py-3 rounded-xl font-display text-sm font-bold tracking-wider transition-all ${
              loading
                ? "bg-border text-gray-600 cursor-not-allowed"
                : "bg-neon text-black hover:shadow-neon"
            }`}
          >
            {loading
              ? "PROCESSING..."
              : isLogin
              ? "SIGN IN TO YOUR ACCOUNT"
              : "CREATE MY ACCOUNT"}
          </motion.button>

          {/* Switch hint */}
          <p className="text-xs text-center text-gray-600 font-body">
            {isLogin ? (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() => switchTab(false)}
                  className="text-neon hover:underline font-display"
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => switchTab(true)}
                  className="text-neon hover:underline font-display"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </motion.div>
    </div>
  );
}