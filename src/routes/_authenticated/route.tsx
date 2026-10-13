import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const DEMO_SUBJECTS = [
  { name: "Data Structures", code: "CS201", faculty: "Dr. R. Menon", color: "cyan", rate: 0.86, day: 1, start: "09:00", end: "10:00", room: "C-302" },
  { name: "Database Management Systems", code: "CS203", faculty: "Prof. A. Iyer", color: "violet", rate: 0.81, day: 2, start: "10:00", end: "11:00", room: "C-105" },
  { name: "Operating Systems", code: "CS205", faculty: "Dr. S. Rao", color: "amber", rate: 0.76, day: 3, start: "11:00", end: "12:00", room: "B-210" },
  { name: "Computer Networks", code: "CS207", faculty: "Prof. K. Nair", color: "emerald", rate: 0.89, day: 4, start: "09:00", end: "10:00", room: "B-114" },
  { name: "Software Testing", code: "CS209", faculty: "Dr. M. Gupta", color: "blue", rate: 0.92, day: 5, start: "14:00", end: "15:00", room: "A-401" },
] as const;

function isMissingDefaultDataFunctionError(error: { message?: string } | null | undefined) {
  const message = error?.message ?? "";
  return /ensure_user_default_data|Could not find the function|schema cache|PGRST202/i.test(message);
}

function buildDefaultDataSeed(userId: string, fullName: string, email: string) {
  const now = new Date();
  const startDate = new Date(Date.now() - 70 * 24 * 60 * 60 * 1000);
  const profile = {
    id: userId,
    full_name: fullName,
    email,
    college: "Sample Institute of Technology",
    semester: "4-1",
    section: "A",
    min_attendance: 75,
    target_attendance: 80,
    semester_start: startDate.toISOString().slice(0, 10),
    semester_end: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    onboarded: true,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  const subjects = DEMO_SUBJECTS.map((subject) => ({
    id: crypto.randomUUID(),
    user_id: userId,
    name: subject.name,
    code: subject.code,
    faculty: subject.faculty,
    color: subject.color,
    target_percentage: 75,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  }));

  const timetableEntries = subjects.flatMap((subject, index) => {
    const subjectInfo = DEMO_SUBJECTS[index];
    const secondDay = ((subjectInfo.day + 2) % 5) + 1;

    return [
      {
        id: crypto.randomUUID(),
        user_id: userId,
        subject_id: subject.id,
        day_of_week: subjectInfo.day,
        start_time: subjectInfo.start,
        end_time: subjectInfo.end,
        room: subjectInfo.room,
        faculty: subjectInfo.faculty,
        created_at: now.toISOString(),
      },
      {
        id: crypto.randomUUID(),
        user_id: userId,
        subject_id: subject.id,
        day_of_week: secondDay,
        start_time: "11:00",
        end_time: "12:00",
        room: subjectInfo.room,
        faculty: subjectInfo.faculty,
        created_at: now.toISOString(),
      },
    ];
  });

  const records: Array<{
    id: string;
    user_id: string;
    subject_id: string;
    date: string;
    status: "present" | "absent";
    class_number: number;
    notes: string;
    created_at: string;
  }> = [];

  subjects.forEach((subject, subjectIndex) => {
    const subjectInfo = DEMO_SUBJECTS[subjectIndex];
    let classNumber = 0;
    const cursor = new Date(startDate);

    while (cursor < now) {
      const isoDay = cursor.getUTCDay() === 0 ? 7 : cursor.getUTCDay();
      if (isoDay === subjectInfo.day || isoDay === ((subjectInfo.day + 2) % 5) + 1) {
        classNumber += 1;
        records.push({
          id: crypto.randomUUID(),
          user_id: userId,
          subject_id: subject.id,
          date: cursor.toISOString().slice(0, 10),
          status: Math.random() < subjectInfo.rate ? "present" : "absent",
          class_number: classNumber,
          notes: "",
          created_at: now.toISOString(),
        });
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  });

  const notifications = [
    {
      id: crypto.randomUUID(),
      user_id: userId,
      title: "Welcome to AttendMate",
      message: "Your demo semester is ready. Review your subjects and set your attendance target.",
      category: "info",
      read: false,
      created_at: now.toISOString(),
    },
    {
      id: crypto.randomUUID(),
      user_id: userId,
      title: "Operating Systems needs attention",
      message: "Attendance is close to the 75% minimum requirement.",
      category: "warning",
      read: false,
      created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      user_id: userId,
      title: "Great work in Software Testing",
      message: "You are comfortably above your target attendance.",
      category: "success",
      read: false,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
  ];

  return { profile, subjects, timetableEntries, records, notifications };
}

async function initializeDefaultSemesterData(userId: string, fullName: string, email: string) {
  const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", userId).limit(1);
  if (existingProfile && existingProfile.length > 0) {
    return;
  }

  const seed = buildDefaultDataSeed(userId, fullName, email);

  const { error: profileError } = await supabase.from("profiles").upsert(seed.profile, { onConflict: "id" });
  if (profileError) throw profileError;

  const { error: subjectError } = await supabase.from("subjects").upsert(seed.subjects, { onConflict: "id" });
  if (subjectError) throw subjectError;

  const { error: timetableError } = await supabase.from("timetable_entries").upsert(seed.timetableEntries, { onConflict: "id" });
  if (timetableError) throw timetableError;

  const { error: attendanceError } = await supabase.from("attendance_records").upsert(seed.records, { onConflict: "id" });
  if (attendanceError) throw attendanceError;

  const { error: notificationsError } = await supabase.from("notifications").upsert(seed.notifications, { onConflict: "id" });
  if (notificationsError) throw notificationsError;
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const userId = session?.user.id;
  const [initializedUserId, setInitializedUserId] = useState<string | null>(null);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!loading && !session) {
      navigate({ to: "/auth", replace: true });
    }
  }, [loading, session, navigate]);

  useEffect(() => {
    if (loading || !userId || initializedUserId === userId) return;

    let cancelled = false;
    setInitializationError(null);

    supabase
      .rpc("ensure_user_default_data")
      .then(async ({ error }) => {
        if (cancelled) return;
        if (error) {
          if (isMissingDefaultDataFunctionError(error)) {
            try {
              await initializeDefaultSemesterData(
                userId,
                session?.user.user_metadata?.full_name ?? "Demo Student",
                session?.user.email ?? "demo@college.edu",
              );
              setInitializedUserId(userId);
              return;
            } catch (fallbackError) {
              setInitializationError(
                fallbackError instanceof Error
                  ? `Could not load your default semester data: ${fallbackError.message}`
                  : "Could not load your default semester data due to an unexpected error.",
              );
              return;
            }
          }
          setInitializationError(`Could not load your default semester data: ${error.message}`);
        } else {
          setInitializedUserId(userId);
        }
      })
      .catch(async (error: unknown) => {
        if (cancelled) return;
        if (error instanceof Error && isMissingDefaultDataFunctionError(error)) {
          try {
            await initializeDefaultSemesterData(
              userId,
              session?.user.user_metadata?.full_name ?? "Demo Student",
              session?.user.email ?? "demo@college.edu",
            );
            setInitializedUserId(userId);
            return;
          } catch (fallbackError) {
            setInitializationError(
              fallbackError instanceof Error
                ? `Could not load your default semester data: ${fallbackError.message}`
                : "Could not load your default semester data due to an unexpected error.",
            );
            return;
          }
        }

        setInitializationError(
          error instanceof Error
            ? `Could not load your default semester data: ${error.message}`
            : "Could not load your default semester data due to an unexpected error.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [initializedUserId, loading, retryCount, userId]);

  if (initializationError) {
    return (
      <div className="mx-auto w-full max-w-2xl p-6">
        <Alert variant="destructive">
          <AlertTitle>Semester setup failed</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{initializationError}</p>
            <Button variant="outline" onClick={() => setRetryCount((count) => count + 1)}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading || !session || initializedUserId !== userId) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-4 p-6">
        <Skeleton className="h-10 w-52" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
