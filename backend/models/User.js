import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, default: null },

    avatarColor: { 
      type: String, 
      default: '#3b82f6' // Default Blue
    },

    // Store the URL (Cloudinary or UI-Avatars)
    profileImage: {
      type: String,
      default: "" 
    },

    googleId: { type: String, default: null },
    githubId: { type: String, default: null },
    authProvider: {
      type: String,
      enum: ["local", "google", "github"],
      default: "local"
    },
  },
  { timestamps: true }
);

// --- THE MAGIC PART ---
// Before saving, if profileImage is empty, generate one using UI Avatars
userSchema.pre("save", function () {
  if (!this.profileImage) {
    const colorHex = this.avatarColor.replace("#", "");

    this.profileImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      this.username
    )}&background=${colorHex}&color=fff&size=200&bold=true`;
  }
});


export default mongoose.model("User", userSchema);