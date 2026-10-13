// Mongoose Models for AttendMate
// These schemas define the data structures for MongoDB.

import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  full_name: { type: String, default: "" },
  created_at: { type: Date, default: Date.now },
});

const ProfileSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  full_name: { type: String, default: "" },
  email: { type: String, default: "" },
  college: { type: String, default: "" },
  semester: { type: String, default: "" },
  section: { type: String, default: "" },
  min_attendance: { type: Number, default: 75 },
  target_attendance: { type: Number, default: 80 },
  semester_start: { type: String },
  semester_end: { type: String },
  onboarded: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const SubjectSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true, index: true },
  name: { type: String, required: true },
  code: { type: String, default: "" },
  faculty: { type: String, default: "" },
  color: { type: String, default: "cyan" },
  target_percentage: { type: Number, default: 75 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const AttendanceRecordSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true, index: true },
  subject_id: { type: String, required: true, index: true },
  date: { type: String, required: true },
  status: { type: String, enum: ["present", "absent", "cancelled"], default: "present" },
  class_number: { type: Number, default: 1 },
  notes: { type: String, default: "" },
  created_at: { type: Date, default: Date.now },
});

const TimetableEntrySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true, index: true },
  subject_id: { type: String, required: true },
  day_of_week: { type: Number, min: 1, max: 7, required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  room: { type: String, default: "" },
  faculty: { type: String, default: "" },
  created_at: { type: Date, default: Date.now },
});

const GoalSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true, index: true },
  subject_id: { type: String },
  target_percentage: { type: Number, default: 75 },
  deadline: { type: String },
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  note: { type: String, default: "" },
  created_at: { type: Date, default: Date.now },
});

const NotificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, default: "" },
  category: { type: String, enum: ["info", "success", "warning", "danger"], default: "info" },
  read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
export const Profile = mongoose.models.Profile || mongoose.model("Profile", ProfileSchema);
export const Subject = mongoose.models.Subject || mongoose.model("Subject", SubjectSchema);
export const AttendanceRecord = mongoose.models.AttendanceRecord || mongoose.model("AttendanceRecord", AttendanceRecordSchema);
export const TimetableEntry = mongoose.models.TimetableEntry || mongoose.model("TimetableEntry", TimetableEntrySchema);
export const Goal = mongoose.models.Goal || mongoose.model("Goal", GoalSchema);
export const Notification = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
