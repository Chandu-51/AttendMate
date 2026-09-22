import type { AttendanceStatus, SubjectStats } from "@/lib/attendance";

export type { AttendanceStatus, SubjectStats };

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  college: string;
  semester: string;
  section: string;
  min_attendance: number;
  target_attendance: number;
  semester_start: string | null;
  semester_end: string | null;
  onboarded: boolean;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  code: string;
  faculty: string;
  color: string;
  target_percentage: number;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  user_id: string;
  subject_id: string;
  date: string;
  status: AttendanceStatus;
  class_number: number;
  notes: string;
  created_at: string;
}

export interface TimetableEntry {
  id: string;
  user_id: string;
  subject_id: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string;
  faculty: string;
}

export interface AttendanceGoal {
  id: string;
  user_id: string;
  subject_id: string | null;
  target_percentage: number;
  deadline: string | null;
  priority: "low" | "medium" | "high";
  note: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  category: "info" | "success" | "warning" | "danger";
  read: boolean;
  created_at: string;
}

export interface SubjectWithStats extends Subject {
  stats: SubjectStats;
}
