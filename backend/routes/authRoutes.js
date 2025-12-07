import express from "express";
import passport from "passport";
import { 
  login, 
  googleSuccess, 
  githubSuccess, 
  getCurrentUser,
  registerUser
} from "../controllers/authController.js";
import auth from "../middlewares/authMiddleware.js";
import multer from 'multer';
import { upload } from '../config/cloudinary.js';
import User from '../models/User.js';

const router = express.Router();

// Email + Password
router.post("/register", registerUser);
router.post("/login", login);

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  googleSuccess
);

// GitHub OAuth
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

router.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  githubSuccess
);

// Authenticated user
router.get("/me", auth, getCurrentUser);



router.put('/update-profile', upload.single('profileImage'), async (req, res) => {
  try {
    // 1. Get text data
    const { userId, username } = req.body;

    // 2. Validate User ID
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // 3. Prepare the update object dynamically
    const updateData = {
      username: username // Always update username (or check if it exists)
    };

    // 4. ONLY add image path if a file was actually uploaded
    if (req.file) {
      updateData.profileImage = req.file.path;
    }

    // 5. Update the user in the database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData, // Pass the dynamic object
      { new: true } 
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully!",
      user: updatedUser
    });

  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: "Server error during update", error: error.message });
  }
});
export default router;
