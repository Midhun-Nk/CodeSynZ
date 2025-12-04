import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email:    { type: String, required: true, unique: true },

    // Local auth
    password: { type: String, default: null },

    // Matches "currentUser.color" in your frontend
  avatarColor: { 
    type: String, 
    default: '#3b82f6' // Default blue
  },

    // OAuth IDs
    googleId: { type: String, default: null },
    githubId: { type: String, default: null },

    // Track login method
    authProvider: {
      type: String,
      enum: ["local", "google", "github"],
      default: "local"
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
