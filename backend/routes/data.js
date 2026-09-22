// Data API Routes
// Clean RESTful endpoints for profiles, subjects, attendance, timetable, and notifications.

import express from "express";
import crypto from "crypto";
import { database } from "../db.js";

const router = express.Router();

// Helper to extract user ID from query or authorization header
function getUserId(req) {
  if (req.query.user_id) return req.query.user_id;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    const parts = token.split("_");
    if (parts.length >= 2) return parts[1];
  }
  return "demo-student-id-001";
}

// ---------------- PROFILES ----------------
router.get("/profile/:userId", (req, res) => {
  const profile = database.getProfile(req.params.userId);
  res.json({ data: profile });
});

router.put("/profile/:userId", (req, res) => {
  const updated = database.updateProfile(req.params.userId, req.body);
  res.json({ data: updated });
});

// ---------------- SUBJECTS ----------------
router.get("/subjects", (req, res) => {
  const userId = getUserId(req);
  const subjects = database.getSubjects(userId);
  res.json({ data: subjects });
});

router.post("/subjects", (req, res) => {
  const userId = req.body.user_id || getUserId(req);
  const newSubject = {
    id: crypto.randomUUID(),
    user_id: userId,
    name: req.body.name,
    code: req.body.code || "",
    faculty: req.body.faculty || "",
    color: req.body.color || "cyan",
    target_percentage: req.body.target_percentage || 75,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const created = database.createSubject(newSubject);
  res.status(201).json({ data: created });
});

router.put("/subjects/:id", (req, res) => {
  const updated = database.updateSubject(req.params.id, req.body);
  res.json({ data: updated });
});

router.delete("/subjects/:id", (req, res) => {
  database.deleteSubject(req.params.id);
  res.json({ success: true });
});

// ---------------- ATTENDANCE ----------------
router.get("/attendance", (req, res) => {
  const userId = getUserId(req);
  const records = database.getAttendance(userId);
  res.json({ data: records });
});

router.post("/attendance", (req, res) => {
  const userId = req.body.user_id || getUserId(req);
  const newRecord = {
    id: crypto.randomUUID(),
    user_id: userId,
    subject_id: req.body.subject_id,
    date: req.body.date || new Date().toISOString().slice(0, 10),
    status: req.body.status || "present",
    class_number: req.body.class_number || 1,
    notes: req.body.notes || "",
    created_at: new Date().toISOString(),
  };
  const created = database.createAttendance(newRecord);
  res.status(201).json({ data: created });
});

router.put("/attendance/:id", (req, res) => {
  const updated = database.updateAttendance(req.params.id, req.body);
  res.json({ data: updated });
});

router.delete("/attendance/:id", (req, res) => {
  database.deleteAttendance(req.params.id);
  res.json({ success: true });
});

// ---------------- TIMETABLE ----------------
router.get("/timetable", (req, res) => {
  const userId = getUserId(req);
  const entries = database.getTimetable(userId);
  res.json({ data: entries });
});

router.post("/timetable", (req, res) => {
  const userId = req.body.user_id || getUserId(req);
  const newEntry = {
    id: crypto.randomUUID(),
    user_id: userId,
    subject_id: req.body.subject_id,
    day_of_week: Number(req.body.day_of_week),
    start_time: req.body.start_time,
    end_time: req.body.end_time,
    room: req.body.room || "",
    faculty: req.body.faculty || "",
    created_at: new Date().toISOString(),
  };
  const created = database.createTimetableEntry(newEntry);
  res.status(201).json({ data: created });
});

router.put("/timetable/:id", (req, res) => {
  const updated = database.updateTimetableEntry(req.params.id, req.body);
  res.json({ data: updated });
});

router.delete("/timetable/:id", (req, res) => {
  database.deleteTimetableEntry(req.params.id);
  res.json({ success: true });
});

// ---------------- GOALS ----------------
router.get("/goals", (req, res) => {
  const userId = getUserId(req);
  const goals = database.getGoals(userId);
  res.json({ data: goals });
});

router.post("/goals", (req, res) => {
  const userId = req.body.user_id || getUserId(req);
  const newGoal = {
    id: crypto.randomUUID(),
    user_id: userId,
    subject_id: req.body.subject_id,
    target_percentage: req.body.target_percentage || 75,
    deadline: req.body.deadline,
    priority: req.body.priority || "medium",
    note: req.body.note || "",
    created_at: new Date().toISOString(),
  };
  const created = database.createGoal(newGoal);
  res.status(201).json({ data: created });
});

router.delete("/goals/:id", (req, res) => {
  database.deleteGoal(req.params.id);
  res.json({ success: true });
});

// ---------------- NOTIFICATIONS ----------------
router.get("/notifications", (req, res) => {
  const userId = getUserId(req);
  const notifications = database.getNotifications(userId);
  res.json({ data: notifications });
});

router.put("/notifications/:id/read", (req, res) => {
  const updated = database.markNotificationRead(req.params.id, req.body.read !== false);
  res.json({ data: updated });
});

router.put("/notifications/read-all", (req, res) => {
  const userId = getUserId(req);
  database.markAllNotificationsRead(userId);
  res.json({ success: true });
});

router.delete("/notifications/:id", (req, res) => {
  database.deleteNotification(req.params.id);
  res.json({ success: true });
});

export default router;
