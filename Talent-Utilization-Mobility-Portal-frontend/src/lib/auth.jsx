import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await apiFetch("/auth/verify");
      if (res.data && res.data.employee) {
        setUser(res.data.employee);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (email, password) => {
    const res = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem("token", res.data.token);
    setUser(res.data.employee);
    return res.data.employee;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const signup = async (payload) => {
    const res = await apiFetch("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    localStorage.setItem("token", res.data.token);
    setUser(res.data.employee);
    return res.data.employee;
  };

  const sendOtp = async (email, fullName) => {
    await apiFetch("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ email, fullName }),
    });
  };

  // Re-fetch profile (useful after completing onboarding)
  const refreshUser = () => fetchProfile();

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signup, sendOtp, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
