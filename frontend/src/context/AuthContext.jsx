import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("ste_token");
    const savedUser = localStorage.getItem("ste_user");
    if (token && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
      } catch {
        clearSession();
      }
    }
    setLoading(false);
  }, []);

  const clearSession = () => {
    localStorage.removeItem("ste_token");
    localStorage.removeItem("ste_user");
    setUser(null);
  };

  const login = async (email, password) => {
    // Always clear previous session first
    clearSession();

    const res = await axios.post("/auth/login", { email, password });
    localStorage.setItem("ste_token", res.data.token);
    localStorage.setItem("ste_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const register = async (name, email, password) => {
    // Clear any existing session
    clearSession();

    const res = await axios.post("/auth/register", { name, email, password });
    // Do NOT auto-login after register — redirect to login instead
    return res.data;
  };

  const logout = () => {
    clearSession();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#06060F" }}>
        <div className="flex flex-col items-center gap-4">
          <svg className="w-10 h-10 animate-spin" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#1E1E3A" strokeWidth="6" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#F97316" strokeWidth="6"
              strokeLinecap="round" strokeDasharray="70 196"
              style={{ filter: "drop-shadow(0 0 8px #F97316)" }} />
          </svg>
          <p className="text-xs tracking-widest text-gray-500 font-display">LOADING...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);