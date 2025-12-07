import React, { useState, useEffect } from "react";
import axios from "axios";
import { Camera, Loader2 } from "lucide-react"; // Icons

export function SettingsView({ theme, darkMode, currentUser, token }) {
  // 1. State for form data
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    userId: ""
  });
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000/api';

  // 2. State for Image Handling
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // 3. UI States
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Load initial data when component mounts or currentUser changes
  useEffect(() => {
    if (currentUser) {
      setFormData({
        username: currentUser.username || "",
        email: currentUser.email || "",
        userId: currentUser._id || "" // Assuming Mongoose ID
      });
      // Set initial image from DB or empty
      setImagePreview(currentUser.profileImage || null);
    }
  }, [currentUser]);

  // Handle Text Inputs
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle File Selection & Preview
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Create a local URL for immediate preview (super fast UX)
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Handle Form Submission
  const handleSubmit = async () => {
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // We must use FormData because we are sending a file
      const data = new FormData();
      data.append("userId", formData.userId);
      data.append("username", formData.username); // Optional: if you update text too
      
      // Only append image if user selected a new one
      if (selectedFile) {
        data.append("profileImage", selectedFile);
      }

      // CALL THE API
      const res = await axios.put(
        `${BACKEND_URL}/auth/update-profile`, // Your Backend URL
        data,
        {
          headers: { "Content-Type": "multipart/form-data",
            "Authorization": `Bearer ${token}`
           },
        }
      );

      setMessage({ type: "success", text: "Profile updated successfully!" });

  if (res)

      console.log("Response:", res.data);
      
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Failed to update profile." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl animate-fade-in-up">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
      <p className={`${theme.textMuted} mb-8`}>
        Manage your account preferences and workspace configuration.
      </p>

      {/* Feedback Message */}
      {message.text && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
          {message.text}
        </div>
      )}

      <div className={`space-y-6 ${theme.text}`}>
        {/* --- PROFILE INFORMATION CARD --- */}
        <div className={`p-6 rounded-2xl border ${theme.border} ${theme.cardBg} shadow-sm`}>
          <h3 className="text-lg font-bold mb-6">Profile Information</h3>
          
          <div className="flex flex-col md:flex-row gap-8">
            
            {/* 1. IMAGE UPLOAD SECTION */}
            <div className="flex flex-col items-center space-y-3">
              <div className="relative group cursor-pointer">
                <div className={`w-24 h-24 rounded-full overflow-hidden border-4 ${theme.border} relative`}>
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Profile" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    // Fallback Initials if no image
                    <div 
                      className="w-full h-full flex items-center justify-center text-3xl font-bold text-white"
                      style={{ backgroundColor: currentUser?.avatarColor || '#3b82f6' }}
                    >
                      {formData.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="text-white w-8 h-8" />
                  </div>
                </div>

                {/* Hidden File Input */}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <p className={`text-xs ${theme.textMuted}`}>Click to change</p>
            </div>

            {/* 2. TEXT INPUTS SECTION */}
            <div className="flex-1 space-y-4">
              <div>
                <label className={`block text-xs font-medium ${theme.textMuted} mb-1.5`}>
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`w-full p-2.5 rounded-xl ${theme.inputBg} border ${theme.border} focus:outline-none focus:border-emerald-500 shadow-sm`}
                />
              </div>

              <div>
                <label className={`block text-xs font-medium ${theme.textMuted} mb-1.5`}>
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled // Usually emails are harder to change
                  className={`w-full p-2.5 rounded-xl ${theme.inputBg} border ${theme.border} opacity-70 cursor-not-allowed`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* --- NOTIFICATIONS CARD (Kept same as before) --- */}
        <div className={`p-6 rounded-2xl border ${theme.border} ${theme.cardBg} shadow-sm`}>
          <h3 className="text-lg font-bold mb-4">Notifications</h3>
          <div className="space-y-3">
            {["Email notifications for comments", "Desktop notifications for builds", "Weekly digest"].map((item, i) => (
              <label key={i} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className={`w-4 h-4 rounded border-zinc-400 text-emerald-500 focus:ring-emerald-500 ${darkMode ? "bg-zinc-800" : "bg-white"}`}
                />
                <span className="text-sm">{item}</span>
              </label>
            ))}
          </div>
        </div>

        {/* --- ACTION BUTTONS --- */}
        <div className="flex justify-end space-x-3">
          <button className={`px-4 py-2 rounded-xl text-sm font-medium ${theme.textMuted} hover:text-zinc-500`}>
            Cancel
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`px-6 py-2 rounded-xl text-sm font-bold bg-emerald-500 ${
              darkMode ? "text-zinc-950" : "text-white"
            } hover:bg-emerald-400 shadow-lg ${theme.shadowGlow} flex items-center space-x-2 transition-all`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isLoading ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}