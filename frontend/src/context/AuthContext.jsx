import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

const API = "http://localhost:4000/api/auth";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user")) || null
  );

  const [token, setToken] = useState(() =>
    localStorage.getItem("token") || null
  );

  const [loading, setLoading] = useState(false);

  // Automatically attach token to axios
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // ----------------------------------------
  // Auto-login using token (on page refresh)
  // ----------------------------------------
  const fetchUser = async () => {
  try {
    if (!token) return;

    const res = await axios.get(`${API}/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    setUser(res.data.user);
    localStorage.setItem("user", JSON.stringify(res.data.user));

  } catch (err) {
    console.log("Token expired or invalid");
    logout();
  }
};

useEffect(() => {
  if (!token) return;

  // Wait small delay so axios.defaults gets applied
  const timer = setTimeout(() => {
    fetchUser();
  }, 50);

  return () => clearTimeout(timer);
}, [token]);

  // ----------------------------------------
  // LOGIN
  // ----------------------------------------
  const login = async (email, password) => {
    try {
      setLoading(true);

      const res = await axios.post(`${API}/login`, { email, password });

      setToken(res.data.token);
      setUser(res.data.user);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      return { success: true, user: res.data.user };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Login failed",
      };
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------
  // REGISTER
  // ----------------------------------------
  const register = async (username, email, password) => {
    try {
      setLoading(true);

      await axios.post(`${API}/register`, { username, email, password });

      return { success: true, message: "Account created!" };

    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Registration failed",
      };
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------
  // OAUTH LOGIN
  // ----------------------------------------
  const loginWithGoogle = () => {
    window.location.href = `${API}/google`;
  };

  const loginWithGithub = () => {
    window.location.href = `${API}/github`;
  };

  // ----------------------------------------
  // LOGOUT
  // ----------------------------------------
  const logout = () => {
    setUser(null);
    setToken(null);

    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        setUser,
        setToken,
        loading,
        login,
        register,
        logout,
        loginWithGoogle,
        loginWithGithub,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
