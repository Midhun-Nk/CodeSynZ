import express from "express";
import passport from "passport";
import { 
  register, 
  login, 
  googleSuccess, 
  githubSuccess, 
  getCurrentUser
} from "../controllers/authController.js";
import auth from "../middlewares/authMiddleware.js";

const router = express.Router();

// Email + Password
router.post("/register", register);
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

export default router;
