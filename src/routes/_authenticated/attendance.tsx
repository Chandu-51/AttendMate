import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ListChecks, MinusCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAttendMateData, qk } from "@/hooks/use-attendmate";
import { useAuth } from "@/hooks/use-auth";
import { attendanceService } from "@/services/attendmate.service";
import type { AttendanceStatus } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/attendance")({
  head: () => ({
    meta: [
      { title: "Mark Attendance — AttendMate" },
      {
        name: "description",
        content: "Mark present, absent or cancelled classes for any day and review your history.",
      },
      { property: "og:title", content: "Mark Attendance — AttendMate" },
      {
        property: "og:description",
        content: "Mark present, absent or cancelled classes for any day and review your history.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AttendancePage,
});

const statuses: { value: AttendanceStatus; label: string; icon: typeof CheckCircle2 }[] = [
  { value: "present", label: "Present", icon: CheckCircle2 },
  { value: "absent", label: "Absent", icon: XCircle },
  { value: "cancelled", label: "Cancelled", icon: MinusCircle },
];

function AttendancePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { subjects, records, isLoading } = useAttendMateData();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const byDate = useMemo(
    () => records.filter((r) => r.date === date),
    [records, date],
  );

  const recent = useMemo(
    () => [...records].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20),
    [records],
  );

  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? "Subject";

  const mark = useMutation({
    mutationFn: async ({ subjectId, status }: { subjectId: string; status: AttendanceStatus }) => {
      const existing = byDate.find((r) => r.subject_id === subjectId);
      if (existing) {
        if (existing.status === status) return attendanceService.remove(existing.id);
        return attendanceService.update(existing.id, { status });
      }
      return attendanceService.create({
        user_id: user!.id,
        subject_id: subjectId,
        date,
        status,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.attendance });
      toast.success("Attendance updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mark attendance"
        description="One tap per class. Cancelled classes are excluded from every calculation."
        action={
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-[180px]"
            aria-label="Attendance date"
          />
        }
      />

      {subjects.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No subjects yet"
          description="Add subjects first — then you can mark attendance for each class."
        />
      ) : (
        <div className="grid gap-3">
          {subjects.map((subject) => {
            const current = byDate.find((r) => r.subject_id === subject.id);
            return (
              <div
                key={subject.id}
                className="glass-panel flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-semibold">{subject.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {subject.code} {subject.faculty && `· ${subject.faculty}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  {statuses.map(({ value, label, icon: Icon }) => (
                    <Button
                      key={value}
                      size="sm"
                      variant={current?.status === value ? "default" : "outline"}
                      onClick={() => mark.mutate({ subjectId: subject.id, status: value })}
                      disabled={mark.isPending}
                      aria-pressed={current?.status === value}
                    >
                      <Icon className="mr-1.5 size-4" aria-hidden />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Recent activity</h2>
        <div className="glass-panel divide-y divide-border rounded-2xl">
          {recent.length === 0 && (
            <p className="p-5 text-sm text-muted-foreground">No records yet.</p>
          )}
          {recent.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm">{subjectName(r.subject_id)}</p>
                <p className="text-xs text-muted-foreground">{r.date}</p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full text-[11px] capitalize",
                  r.status === "present" && "border-success/30 bg-success/10 text-success",
                  r.status === "absent" && "border-destructive/30 bg-destructive/10 text-destructive",
                  r.status === "cancelled" && "text-muted-foreground",
                )}
              >
                {r.status}
              </Badge>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
