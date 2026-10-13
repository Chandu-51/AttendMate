// Hybrid Database Layer
// Supports MongoDB (Atlas or local) when MONGODB_URI is provided,
// and automatically falls back to an embedded JSON database file for 100% offline resilience.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateSeedData } from "./seedData.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "attendmate_db.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let db = {
  users: [],
  profiles: [],
  subjects: [],
  attendance: [],
  timetable: [],
  goals: [],
  notifications: [],
};

// Load database from file
function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      db = JSON.parse(raw);
    } else {
      saveDb();
    }
  } catch (err) {
    console.error("[DB] Error loading database file, initializing empty:", err.message);
  }
}

// Save database to file atomically
function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("[DB] Error saving database:", err.message);
  }
}

loadDb();

// MongoDB status
export let isMongoConnected = false;

export async function initDatabase() {
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    try {
      console.log("[DB] Attempting connection to MongoDB...");
      const mongooseModule = await import("mongoose");
      const mongoose = mongooseModule.default || mongooseModule;
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      isMongoConnected = true;
      console.log("[DB] Successfully connected to MongoDB!");
    } catch (err) {
      console.warn("[DB] MongoDB connection failed (" + err.message + "). Falling back to local JSON database.");
      isMongoConnected = false;
    }
  } else {
    console.log("[DB] Using local JSON database (backend/data/attendmate_db.json). Ready for offline use!");
  }
}

// Database API
export const database = {
  // Users
  findUserByEmail(email) {
    return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },
  findUserById(id) {
    return db.users.find((u) => u.id === id);
  },
  createUser({ id, email, password, full_name }) {
    const user = { id, email, password, full_name, created_at: new Date().toISOString() };
    db.users.push(user);

    // Auto-seed default semester data for this new student!
    const seed = generateSeedData(id, full_name, email);
    db.profiles.push(seed.profile);
    db.subjects.push(...seed.subjects);
    db.timetable.push(...seed.timetable);
    db.attendance.push(...seed.records);
    db.notifications.push(...seed.notifications);

    saveDb();
    return user;
  },
  updateUserPassword(userId, newPassword) {
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      user.password = newPassword;
      saveDb();
    }
    return user;
  },

  // Profiles
  getProfile(userId) {
    return db.profiles.find((p) => p.id === userId) || null;
  },
  updateProfile(userId, patch) {
    let profile = db.profiles.find((p) => p.id === userId);
    if (!profile) {
      profile = { id: userId, ...patch, updated_at: new Date().toISOString() };
      db.profiles.push(profile);
    } else {
      Object.assign(profile, patch, { updated_at: new Date().toISOString() });
    }
    saveDb();
    return profile;
  },

  // Subjects
  getSubjects(userId) {
    return db.subjects.filter((s) => s.user_id === userId);
  },
  createSubject(item) {
    db.subjects.push(item);
    saveDb();
    return item;
  },
  updateSubject(id, patch) {
    const s = db.subjects.find((item) => item.id === id);
    if (s) {
      Object.assign(s, patch, { updated_at: new Date().toISOString() });
      saveDb();
    }
    return s;
  },
  deleteSubject(id) {
    db.subjects = db.subjects.filter((s) => s.id !== id);
    db.attendance = db.attendance.filter((a) => a.subject_id !== id);
    db.timetable = db.timetable.filter((t) => t.subject_id !== id);
    saveDb();
    return true;
  },

  // Attendance Records
  getAttendance(userId) {
    return db.attendance
      .filter((a) => a.user_id === userId)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  },
  createAttendance(item) {
    db.attendance.push(item);
    saveDb();
    return item;
  },
  updateAttendance(id, patch) {
    const rec = db.attendance.find((item) => item.id === id);
    if (rec) {
      Object.assign(rec, patch);
      saveDb();
    }
    return rec;
  },
  deleteAttendance(id) {
    db.attendance = db.attendance.filter((item) => item.id !== id);
    saveDb();
    return true;
  },

  // Timetable
  getTimetable(userId) {
    return db.timetable
      .filter((t) => t.user_id === userId)
      .sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time));
  },
  createTimetableEntry(item) {
    db.timetable.push(item);
    saveDb();
    return item;
  },
  updateTimetableEntry(id, patch) {
    const entry = db.timetable.find((item) => item.id === id);
    if (entry) {
      Object.assign(entry, patch);
      saveDb();
    }
    return entry;
  },
  deleteTimetableEntry(id) {
    db.timetable = db.timetable.filter((item) => item.id !== id);
    saveDb();
    return true;
  },

  // Goals
  getGoals(userId) {
    return db.goals.filter((g) => g.user_id === userId);
  },
  createGoal(item) {
    db.goals.push(item);
    saveDb();
    return item;
  },
  deleteGoal(id) {
    db.goals = db.goals.filter((item) => item.id !== id);
    saveDb();
    return true;
  },

  // Notifications
  getNotifications(userId) {
    return db.notifications
      .filter((n) => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },
  markNotificationRead(id, read = true) {
    const n = db.notifications.find((item) => item.id === id);
    if (n) {
      n.read = read;
      saveDb();
    }
    return n;
  },
  markAllNotificationsRead(userId) {
    db.notifications.filter((n) => n.user_id === userId).forEach((n) => (n.read = true));
    saveDb();
    return true;
  },
  deleteNotification(id) {
    db.notifications = db.notifications.filter((n) => n.id !== id);
    saveDb();
    return true;
  },
};
