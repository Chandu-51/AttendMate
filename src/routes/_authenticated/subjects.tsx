import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { SubjectCard } from "@/components/dashboard/SubjectCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAttendMateData, qk } from "@/hooks/use-attendmate";
import { useAuth } from "@/hooks/use-auth";
import { subjectService } from "@/services/attendmate.service";

export const Route = createFileRoute("/_authenticated/subjects")({
  head: () => ({
    meta: [
      { title: "Subjects — AttendMate" },
      {
        name: "description",
        content: "Manage your semester subjects, faculty and per-subject attendance targets.",
      },
      { property: "og:title", content: "Subjects — AttendMate" },
      {
        property: "og:description",
        content: "Manage your semester subjects, faculty and per-subject attendance targets.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SubjectsPage,
});

const palette = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#06b6d4", "#a855f7"];

function SubjectsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { subjectsWithStats, isLoading } = useAttendMateData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", faculty: "", target: "75" });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: qk.subjects });
    qc.invalidateQueries({ queryKey: qk.attendance });
  };

  const create = useMutation({
    mutationFn: () =>
      subjectService.create({
        user_id: user!.id,
        name: form.name.trim(),
        code: form.code.trim(),
        faculty: form.faculty.trim(),
        color: palette[Math.floor(Math.random() * palette.length)]!,
        target_percentage: Number(form.target) || 75,
      }),
    onSuccess: () => {
      invalidate();
      setOpen(false);
      setForm({ name: "", code: "", faculty: "", target: "75" });
      toast.success("Subject added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => subjectService.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Subject removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-56" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subjects"
        description="Every subject carries its own target and live attendance maths."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-1.5 size-4" aria-hidden /> Add subject
          </Button>
        }
      />

      {subjectsWithStats.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No subjects yet"
          description="Add your first subject to start tracking attendance."
          actionLabel="Add subject"
          onAction={() => setOpen(true)}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjectsWithStats.map((subject, index) => (
            <div key={subject.id} className="relative">
              <SubjectCard subject={subject} index={index} />
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-2 top-2 text-muted-foreground hover:text-destructive"
                aria-label={`Delete ${subject.name}`}
                onClick={() => remove.mutate(subject.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add subject</DialogTitle>
            <DialogDescription>Create a subject for this semester.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="s-name">Name</Label>
              <Input
                id="s-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Data Structures"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="s-code">Code</Label>
                <Input
                  id="s-code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="CS201"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="s-target">Target %</Label>
                <Input
                  id="s-target"
                  type="number"
                  min={0}
                  max={100}
                  value={form.target}
                  onChange={(e) => setForm({ ...form, target: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="s-faculty">Faculty</Label>
              <Input
                id="s-faculty"
                value={form.faculty}
                onChange={(e) => setForm({ ...form, faculty: e.target.value })}
                placeholder="Dr. Rao"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => create.mutate()}
              disabled={!form.name.trim() || create.isPending}
            >
              Save subject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
