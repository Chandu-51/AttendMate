// Data access layer for AttendMate.
// Data access for the Supabase-backed application.

import type {
  AppNotification,
  AttendanceGoal,
  AttendanceRecord,
  Profile,
  Subject,
  TimetableEntry,
} from "@/types";
import { supabase } from "@/integrations/supabase/client";

async function getUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Your session has expired. Please sign in again.");
  return data.user.id;
}

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function requireData<T>(data: T | null, message: string): T {
  if (data === null) throw new Error(message);
  return data;
}

export const profileService = {
  async get(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    throwIfError(error);
    return data;
  },
  async update(userId: string, patch: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase.from("profiles").update(patch).eq("id", userId).select().single();
    throwIfError(error);
    return requireData(data, "Could not update your profile.");
  },
};

export const subjectService = {
  async list(): Promise<Subject[]> {
    const userId = await getUserId();
    const { data, error } = await supabase.from("subjects").select("*").eq("user_id", userId).order("created_at");
    throwIfError(error);
    return data ?? [];
  },
  async create(input: Partial<Subject> & { name: string; user_id: string }): Promise<Subject> {
    const { data, error } = await supabase.from("subjects").insert(input).select().single();
    throwIfError(error);
    return requireData(data, "Could not create the subject.");
  },
  async update(id: string, patch: Partial<Subject>): Promise<Subject> {
    const { data, error } = await supabase.from("subjects").update(patch).eq("id", id).select().single();
    throwIfError(error);
    return requireData(data, "Could not update the subject.");
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("subjects").delete().eq("id", id);
    throwIfError(error);
  },
};

export const attendanceService = {
  async list(): Promise<AttendanceRecord[]> {
    const userId = await getUserId();
    const { data, error } = await supabase.from("attendance_records").select("*").eq("user_id", userId).order("date", { ascending: false });
    throwIfError(error);
    return data as AttendanceRecord[];
  },
  async create(input: {
    user_id: string;
    subject_id: string;
    date: string;
    status: AttendanceRecord["status"];
    class_number?: number;
    notes?: string;
  }): Promise<AttendanceRecord> {
    const { data, error } = await supabase.from("attendance_records").insert(input).select().single();
    throwIfError(error);
    return data as AttendanceRecord;
  },
  async update(id: string, patch: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    const { data, error } = await supabase.from("attendance_records").update(patch).eq("id", id).select().single();
    throwIfError(error);
    return data as AttendanceRecord;
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("attendance_records").delete().eq("id", id);
    throwIfError(error);
  },
};

export const timetableService = {
  async list(): Promise<TimetableEntry[]> {
    const userId = await getUserId();
    const { data, error } = await supabase.from("timetable_entries").select("*").eq("user_id", userId).order("day_of_week");
    throwIfError(error);
    return data ?? [];
  },
  async create(input: Omit<TimetableEntry, "id">): Promise<TimetableEntry> {
    const { data, error } = await supabase.from("timetable_entries").insert(input).select().single();
    throwIfError(error);
    return requireData(data, "Could not create the timetable entry.");
  },
  async update(id: string, patch: Partial<TimetableEntry>): Promise<TimetableEntry> {
    const { data, error } = await supabase.from("timetable_entries").update(patch).eq("id", id).select().single();
    throwIfError(error);
    return requireData(data, "Could not update the timetable entry.");
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("timetable_entries").delete().eq("id", id);
    throwIfError(error);
  },
};

export const goalService = {
  async list(): Promise<AttendanceGoal[]> {
    const userId = await getUserId();
    const { data, error } = await supabase.from("attendance_goals").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    throwIfError(error);
    return (data ?? []) as AttendanceGoal[];
  },
  async create(input: Omit<AttendanceGoal, "id" | "created_at">): Promise<AttendanceGoal> {
    const { data, error } = await supabase.from("attendance_goals").insert(input).select().single();
    throwIfError(error);
    return requireData(data, "Could not create the attendance goal.") as AttendanceGoal;
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("attendance_goals").delete().eq("id", id);
    throwIfError(error);
  },
};

export const notificationService = {
  async list(): Promise<AppNotification[]> {
    const userId = await getUserId();
    const { data, error } = await supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    throwIfError(error);
    return (data ?? []) as AppNotification[];
  },
  async markRead(id: string, read = true): Promise<void> {
    const { error } = await supabase.from("notifications").update({ read }).eq("id", id);
    throwIfError(error);
  },
  async markAllRead(userId: string): Promise<void> {
    const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", userId);
    throwIfError(error);
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    throwIfError(error);
  },
};
