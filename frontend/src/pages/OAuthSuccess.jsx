import { useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function OAuthSuccess() {
  const navigate = useNavigate();
  const { setToken, setUser } = useContext(AuthContext);

  const token = new URLSearchParams(window.location.search).get("token");

  useEffect(() => {
    console.log("OAuthSuccess mounted");
    console.log("Received token:", token);

    const handleOAuth = async () => {
      if (!token) {
        console.log("No token found in URL");
        return;
      }

      setToken(token);
      localStorage.setItem("token", token);

      try {
        console.log("Fetching user with token...");

        const res = await axios.get("http://localhost:4000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log("User fetched:", res.data.user);

        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        console.log("Redirecting to /");
        navigate("/");
      } catch (err) {
        console.log("OAuth failed:", err);
        navigate("/login?error=oauth_failed");
      }
    };

    handleOAuth();
  }, []);

  return <div>Redirecting...</div>;
}
