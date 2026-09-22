import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  attendanceService,
  goalService,
  notificationService,
  profileService,
  subjectService,
  timetableService,
} from "@/services/attendmate.service";
import { buildStats, percentage, round1 } from "@/lib/attendance";
import type { AttendanceRecord, Profile, Subject, SubjectWithStats } from "@/types";
import { useAuth } from "@/hooks/use-auth";

export const qk = {
  profile: (id: string) => ["profile", id] as const,
  subjects: ["subjects"] as const,
  attendance: ["attendance"] as const,
  timetable: ["timetable"] as const,
  goals: ["goals"] as const,
  notifications: ["notifications"] as const,
};

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: qk.profile(user?.id ?? "anon"),
    queryFn: () => profileService.get(user!.id),
    enabled: !!user,
  });
}

export function useSubjects() {
  const { user } = useAuth();
  return useQuery({ queryKey: qk.subjects, queryFn: subjectService.list, enabled: !!user });
}

export function useAttendance() {
  const { user } = useAuth();
  return useQuery({ queryKey: qk.attendance, queryFn: attendanceService.list, enabled: !!user });
}

export function useTimetable() {
  const { user } = useAuth();
  return useQuery({ queryKey: qk.timetable, queryFn: timetableService.list, enabled: !!user });
}

export function useGoals() {
  const { user } = useAuth();
  return useQuery({ queryKey: qk.goals, queryFn: goalService.list, enabled: !!user });
}

export function useNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: qk.notifications,
    queryFn: notificationService.list,
    enabled: !!user,
  });
}

export function useInvalidate() {
  const qc = useQueryClient();
  return (keys: readonly unknown[][]) => keys.forEach((key) => qc.invalidateQueries({ queryKey: key }));
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Profile>) => profileService.update(user!.id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.profile(user?.id ?? "anon") }),
  });
}

function computeSubjectStats(
  subjects: Subject[],
  records: AttendanceRecord[],
  minimum: number,
): SubjectWithStats[] {
  return subjects.map((subject) => {
    const own = records.filter((r) => r.subject_id === subject.id && r.status !== "cancelled");
    const attended = own.filter((r) => r.status === "present").length;
    return {
      ...subject,
      stats: buildStats(attended, own.length, subject.target_percentage ?? minimum, minimum),
    };
  });
}

/** Aggregated, derived view of everything the dashboard needs. */
export function useAttendMateData() {
  const profileQuery = useProfile();
  const subjectsQuery = useSubjects();
  const attendanceQuery = useAttendance();
  const timetableQuery = useTimetable();
  const notificationsQuery = useNotifications();

  const profile = profileQuery.data ?? null;
  const subjects = useMemo(() => subjectsQuery.data ?? [], [subjectsQuery.data]);
  const records = useMemo(() => attendanceQuery.data ?? [], [attendanceQuery.data]);
  const minimum = profile?.min_attendance ?? 75;
  const target = profile?.target_attendance ?? 80;

  const subjectsWithStats = useMemo(
    () => computeSubjectStats(subjects, records, minimum),
    [subjects, records, minimum],
  );

  const overall = useMemo(() => {
    const counted = records.filter((r) => r.status !== "cancelled");
    const attended = counted.filter((r) => r.status === "present").length;
    const total = counted.length;
    return buildStats(attended, total, target, minimum);
  }, [records, target, minimum]);

  const weeklyTrend = useMemo(() => {
    const buckets = new Map<string, { present: number; total: number }>();
    records
      .filter((r) => r.status !== "cancelled")
      .forEach((r) => {
        const date = new Date(r.date);
        const day = date.getUTCDay();
        const monday = new Date(date);
        monday.setUTCDate(date.getUTCDate() - ((day + 6) % 7));
        const key = monday.toISOString().slice(0, 10);
        const bucket = buckets.get(key) ?? { present: 0, total: 0 };
        bucket.total += 1;
        if (r.status === "present") bucket.present += 1;
        buckets.set(key, bucket);
      });
    return [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, b]) => ({
        week: new Date(week).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        percentage: round1(percentage(b.present, b.total)),
        attended: b.present,
        missed: b.total - b.present,
      }));
  }, [records]);

  const monthlyTrend = useMemo(() => {
    const buckets = new Map<string, { present: number; total: number }>();
    records
      .filter((r) => r.status !== "cancelled")
      .forEach((r) => {
        const key = r.date.slice(0, 7);
        const bucket = buckets.get(key) ?? { present: 0, total: 0 };
        bucket.total += 1;
        if (r.status === "present") bucket.present += 1;
        buckets.set(key, bucket);
      });
    return [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, b]) => ({
        month: new Date(`${month}-01`).toLocaleDateString(undefined, {
          month: "short",
          year: "2-digit",
        }),
        percentage: round1(percentage(b.present, b.total)),
      }));
  }, [records]);

  const counted = records.filter((r) => r.status !== "cancelled");

  return {
    profile,
    subjects,
    subjectsWithStats,
    records,
    timetable: timetableQuery.data ?? [],
    notifications: notificationsQuery.data ?? [],
    unreadCount: (notificationsQuery.data ?? []).filter((n) => !n.read).length,
    overall,
    minimum,
    target,
    attendedCount: counted.filter((r) => r.status === "present").length,
    missedCount: counted.filter((r) => r.status === "absent").length,
    weeklyTrend,
    monthlyTrend,
    isLoading:
      profileQuery.isLoading ||
      subjectsQuery.isLoading ||
      attendanceQuery.isLoading ||
      timetableQuery.isLoading,
    isError: profileQuery.isError || subjectsQuery.isError || attendanceQuery.isError,
  };
}

export type AttendMateData = ReturnType<typeof useAttendMateData>;
