import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


// REGISTER
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashed,
      authProvider: "local",
    });

    return res.json({
      message: "Account created",
      userId: newUser._id,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid email" });

    // If OAuth user — block password login
    if (user.authProvider !== "local") {
      return res.status(400).json({
        message: `This account uses ${user.authProvider.toUpperCase()} login only.`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "3d",
    });

    return res.json({
      message: "Login success",
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// GOOGLE SUCCESS
export const googleSuccess = async (req, res) => {
      console.log("GOOGLE JWT_SECRET:", process.env.JWT_SECRET);  // <--- ADD THIS

  if (!req.user)
    return res.redirect("http://localhost:5173/login?error=no_user");

  const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });

  return res.redirect(`http://localhost:5173/oauth-success?token=${token}`);
};

// GITHUB SUCCESS
export const githubSuccess = async (req, res) => {
  if (!req.user)
    return res.redirect("http://localhost:5173/login?error=no_user");

  const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });

  return res.redirect(`http://localhost:5173/oauth-success?token=${token}`);
};

// GET CURRENT USER
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
