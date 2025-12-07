import { useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function OAuthSuccess() {
  const navigate = useNavigate();
  const { setToken, setUser } = useContext(AuthContext);
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000/api';

  const token = new URLSearchParams(window.location.search).get("token");

  useEffect(() => {
    const handleOAuth = async () => {
      if (!token) {
        console.log("No token found in URL");
        return navigate("/login?error=no_token");
      }

      // Save token
      setToken(token);
      localStorage.setItem("token", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      try {
        // Fetch user
        const res = await axios.get(`${BACKEND_URL}/auth/me`);
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        navigate("/");
      } catch (err) {
        console.log("OAuth failed:", err.response?.data || err);
        navigate("/login?error=oauth_failed");
      }
    };

    handleOAuth();
  }, []);

  return <div>Redirecting...</div>;
}
