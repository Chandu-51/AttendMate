// Authentication Routes
// Clean, standard Express endpoints for user login, signup, and demo access.

import express from "express";
import crypto from "crypto";
import { database } from "../db.js";

const router = express.Router();

// Helper to format auth response matching what the frontend expects
function createAuthResponse(user) {
  const profile = database.getProfile(user.id);
  const token = `token_${user.id}_${Date.now()}`;
  return {
    user: {
      id: user.id,
      email: user.email,
      user_metadata: { full_name: user.full_name },
    },
    session: {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        user_metadata: { full_name: user.full_name },
      },
    },
    profile,
  };
}

// Ensure a demo student always exists on boot
const DEMO_EMAIL = "demo@college.edu";
if (!database.findUserByEmail(DEMO_EMAIL)) {
  database.createUser({
    id: "demo-student-id-001",
    email: DEMO_EMAIL,
    password: "password123",
    full_name: "Dheeraj Vemuri",
  });
}

// POST /api/auth/signup
router.post("/signup", (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const existing = database.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: "That email is already registered. Try signing in instead." });
    }

    const userId = crypto.randomUUID();
    const newUser = database.createUser({
      id: userId,
      email: email.trim(),
      password: password,
      full_name: name ? name.trim() : "Student",
    });

    res.status(201).json(createAuthResponse(newUser));
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Internal server error during registration." });
  }
});

// POST /api/auth/login
router.post("/login", (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Please enter your email and password." });
    }

    const user = database.findUserByEmail(email);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Email or password is incorrect." });
    }

    res.json(createAuthResponse(user));
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error during login." });
  }
});

// POST /api/auth/demo — 1-click access for instant evaluation
router.post("/demo", (req, res) => {
  try {
    let demoUser = database.findUserByEmail(DEMO_EMAIL);
    if (!demoUser) {
      demoUser = database.createUser({
        id: "demo-student-id-001",
        email: DEMO_EMAIL,
        password: "password123",
        full_name: "Dheeraj Vemuri",
      });
    }
    res.json(createAuthResponse(demoUser));
  } catch (err) {
    console.error("Demo login error:", err);
    res.status(500).json({ error: "Failed to start demo session." });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", (req, res) => {
  try {
    const { email, newPassword, userId } = req.body;
    let targetUser = userId ? database.findUserById(userId) : null;
    if (!targetUser && email) {
      targetUser = database.findUserByEmail(email);
    }

    if (!targetUser) {
      return res.status(404).json({ error: "User not found." });
    }

    database.updateUserPassword(targetUser.id, newPassword || "newpassword123");
    res.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Failed to update password." });
  }
});

// GET /api/auth/session
router.get("/session", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ user: null, session: null });
  }

  // Token format: token_<userId>_<timestamp>
  const token = authHeader.replace("Bearer ", "");
  const parts = token.split("_");
  const userId = parts[1];

  const user = database.findUserById(userId);
  if (!user) {
    return res.status(401).json({ user: null, session: null });
  }

  res.json(createAuthResponse(user));
});

export default router;
