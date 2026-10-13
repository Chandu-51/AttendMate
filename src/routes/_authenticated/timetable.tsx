import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAttendMateData, qk } from "@/hooks/use-attendmate";
import { useAuth } from "@/hooks/use-auth";
import { timetableService } from "@/services/attendmate.service";

export const Route = createFileRoute("/_authenticated/timetable")({
  head: () => ({
    meta: [
      { title: "Timetable — AttendMate" },
      { name: "description", content: "Your weekly class schedule with rooms, faculty and timings." },
      { property: "og:title", content: "Timetable — AttendMate" },
      {
        property: "og:description",
        content: "Your weekly class schedule with rooms, faculty and timings.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TimetablePage,
});

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function TimetablePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { timetable, subjects, isLoading } = useAttendMateData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    subject_id: "",
    day_of_week: "1",
    start_time: "09:00",
    end_time: "10:00",
    room: "",
  });

  const grouped = useMemo(
    () =>
      days.map((label, i) => ({
        label,
        entries: timetable.filter((e) => e.day_of_week === i + 1),
      })),
    [timetable],
  );

  const subjectName = (id: string | null) =>
    subjects.find((s) => s.id === id)?.name ?? "Free slot";

  const create = useMutation({
    mutationFn: () =>
      timetableService.create({
        user_id: user!.id,
        subject_id: form.subject_id || null,
        day_of_week: Number(form.day_of_week),
        start_time: form.start_time,
        end_time: form.end_time,
        room: form.room,
        faculty: subjects.find((s) => s.id === form.subject_id)?.faculty ?? "",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.timetable });
      setOpen(false);
      toast.success("Class added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => timetableService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.timetable });
      toast.success("Class removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Skeleton className="h-96 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timetable"
        description="Your weekly schedule, grouped by day."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-1.5 size-4" aria-hidden /> Add class
          </Button>
        }
      />

      {timetable.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No classes scheduled"
          description="Add your weekly classes to see them here."
          actionLabel="Add class"
          onAction={() => setOpen(true)}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {grouped.map(({ label, entries }) => (
            <section key={label} className="glass-panel rounded-2xl p-4">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </h2>
              <div className="mt-3 space-y-2">
                {entries.length === 0 && (
                  <p className="text-xs text-muted-foreground">No classes.</p>
                )}
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-secondary/50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {subjectName(entry.subject_id)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {entry.start_time?.slice(0, 5)}–{entry.end_time?.slice(0, 5)}
                        {entry.room && ` · ${entry.room}`}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Remove class"
                      onClick={() => remove.mutate(entry.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add class</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Subject</Label>
              <Select
                value={form.subject_id}
                onValueChange={(v) => setForm({ ...form, subject_id: v })}
              >
                <SelectTrigger aria-label="Subject">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Day</Label>
              <Select
                value={form.day_of_week}
                onValueChange={(v) => setForm({ ...form, day_of_week: v })}
              >
                <SelectTrigger aria-label="Day">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {days.map((d, i) => (
                    <SelectItem key={d} value={String(i + 1)}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="t-start">Start</Label>
                <Input
                  id="t-start"
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="t-end">End</Label>
                <Input
                  id="t-end"
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="t-room">Room</Label>
              <Input
                id="t-room"
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                placeholder="B-204"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending}>
              Add class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
