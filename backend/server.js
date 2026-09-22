// AttendMate Backend Server (Node.js + Express)
// Clean, understandable REST API for college academic attendance tracking.

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initDatabase, isMongoConnected } from "./db.js";
import authRoutes from "./routes/auth.js";
import dataRoutes from "./routes/data.js";

// Load environment variables (.env)
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing (CORS) & JSON parsing
app.use(cors());
app.use(express.json());

// Request logger for easy debugging in terminal
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "AttendMate API is healthy and running.",
    database: isMongoConnected ? "MongoDB" : "Local JSON Database",
    timestamp: new Date().toISOString(),
  });
});

// Register API routes
app.use("/api/auth", authRoutes);
app.use("/api", dataRoutes);

// Start server
async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(`🚀 AttendMate Backend running on http://localhost:${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
    console.log(`=============================================`);
  });
}

start();
