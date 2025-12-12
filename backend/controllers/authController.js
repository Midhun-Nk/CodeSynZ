import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Helper to create consistent JWT token
function createToken(user) {
  return jwt.sign(
    {
      _id: user._id,    // FIXED
      email: user.email,
      username: user.username
    },
    process.env.JWT_SECRET,
    { expiresIn: "3d" }
  );
}

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid email" });

    // Prevent OAuth-only accounts from using password login
    if (user.authProvider !== "local") {
      return res.status(400).json({
        message: `This account uses ${user.authProvider.toUpperCase()} login only.`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid password" });

    const token = createToken(user);

    return res.json({
      message: "Login success",
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email
      },
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// GOOGLE SUCCESS
export const googleSuccess = async (req, res) => {
  if (!req.user)
    return res.redirect(`${FRONTEND_URL}/login?error=no_user`);

  const token = createToken(req.user);

  return res.redirect(`${FRONTEND_URL}/oauth-success?token=${token}`);
};

// GITHUB SUCCESS
export const githubSuccess = async (req, res) => {
  if (!req.user)
    return res.redirect(`${FRONTEND_URL}/login?error=no_user`);

  const token = createToken(req.user);

  return res.redirect(`${FRONTEND_URL}/oauth-success?token=${token}`);
};

// GET CURRENT USER
export const getCurrentUser = async (req, res) => {
  try {
    // req.user comes from authMiddleware → contains _id
    const user = await User.findById(req.user._id).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const getRandomColor = () => {
  const colors = ["3b82f6", "ef4444", "10b981", "f59e0b", "8b5cf6", "ec4899"];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const randomColor = getRandomColor();

    const defaultImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      username
    )}&background=${randomColor}&color=fff&size=128&bold=true`;

    const newUser = new User({
      username,
      email,
      password: hashed, // ✅ FIXED
      avatarColor: `#${randomColor}`,
      profileImage: defaultImage,
      authProvider: "local",
    });

    const savedUser = await newUser.save();

    res.status(201).json({
      message: "Account created",
      userId: savedUser._id,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
